"""Calls litellm.acompletion directly with per-call credentials.

langchain_litellm's ChatLiteLLM stores the client as the global litellm module
and mutates litellm.api_key / litellm.api_base in _client_params on every call.
Under concurrent workers that causes a race: worker N's key overwrites worker 0's
key, so worker 0 authenticates against the wrong Azure endpoint.

Fix: bypass ChatLiteLLM entirely.  Call litellm.acompletion with api_key and
api_base as explicit per-call arguments so no global state is ever touched.
Tool calling (not response_format) is used to match the original speed.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any, List, Tuple
from urllib.parse import parse_qs, urlparse

import litellm
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from service.ontology_tbox_pipeline.config import PipelineConfig, get_config
from service.ontology_tbox_pipeline.llm.concurrency import get_key_semaphore
from service.ontology_tbox_pipeline.llm.retry import with_rate_limit_retry
from service.ontology_tbox_pipeline.logging_config import get_logger

_LOGGER = get_logger("llm")


def _to_litellm_messages(input_data: Any) -> List[dict]:
    """Convert LangChain messages or a plain string to litellm message dicts."""
    if isinstance(input_data, str):
        return [{"role": "user", "content": input_data}]
    if isinstance(input_data, list):
        out: List[dict] = []
        for m in input_data:
            if isinstance(m, SystemMessage):
                out.append({"role": "system", "content": m.content})
            elif isinstance(m, HumanMessage):
                out.append({"role": "user", "content": m.content})
            elif isinstance(m, AIMessage):
                out.append({"role": "assistant", "content": m.content})
            elif isinstance(m, dict):
                out.append(m)
            else:
                out.append({"role": "user", "content": str(m)})
        return out
    return [{"role": "user", "content": str(input_data)}]


class SemaphoreWrappedLLM:
    """Calls litellm.acompletion with explicit per-call credentials.

    Uses function calling (tools) — the same mechanism as ChatLiteLLM.with_structured_output —
    so speed is identical to the original while the race condition is eliminated.
    """

    def __init__(
        self,
        api_key: str,
        api_base: str,
        api_version: str,
        config: PipelineConfig,
        worker_id: int,
    ) -> None:
        self._api_key = api_key
        self._api_base = api_base
        self._api_version = api_version
        self._config = config
        self._worker_id = worker_id

    def with_structured_output(self, schema: Any, **kwargs) -> RunnableLambda:
        """Return a RunnableLambda that invokes the model via tool calling and returns a Pydantic instance."""
        # Capture everything in the closure — no self reference inside the coroutine
        api_key = self._api_key
        api_base = self._api_base
        api_version = self._api_version
        model = self._config.LITELLM_MODEL
        max_tokens = self._config.LITELLM_MAX_TOKENS
        temperature = self._config.LITELLM_TEMPERATURE
        request_timeout = self._config.LITELLM_REQUEST_TIMEOUT
        worker_id = self._worker_id

        tool_def = {
            "type": "function",
            "function": {
                "name": schema.__name__,
                "description": f"Return a structured {schema.__name__} object.",
                "parameters": schema.model_json_schema(),
            },
        }
        tool_choice = {"type": "function", "function": {"name": schema.__name__}}

        async def _wrapped_ainvoke(input_data: Any, config: Any = None, **kw: Any) -> Any:
            semaphore = await get_key_semaphore(worker_id)

            @with_rate_limit_retry
            async def _do_call() -> Any:
                async with semaphore:
                    messages = _to_litellm_messages(input_data)
                    response = await litellm.acompletion(
                        model=model,
                        messages=messages,
                        api_key=api_key,
                        api_base=api_base,
                        api_version=api_version,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        request_timeout=request_timeout,
                        tools=[tool_def],
                        tool_choice=tool_choice,
                    )
                    finish_reason = response.choices[0].finish_reason
                    if finish_reason == "length":
                        raise ValueError(
                            f"Model output truncated (finish_reason=length) for "
                            f"{schema.__name__} — increase LITELLM_MAX_TOKENS "
                            f"(currently {max_tokens})."
                        )
                    tool_calls = response.choices[0].message.tool_calls
                    if not tool_calls:
                        raise ValueError(
                            f"Model returned no tool call for {schema.__name__}. "
                            f"finish_reason={finish_reason}"
                        )
                    return schema.model_validate_json(tool_calls[0].function.arguments)

            return await _do_call()

        return RunnableLambda(_wrapped_ainvoke)


def build_llm(
    api_key: str, api_base_url: str, config: PipelineConfig, worker_id: int
) -> SemaphoreWrappedLLM:
    """Construct an LLM instance bound to the given key and endpoint."""
    api_base, api_version = _split_azure_endpoint(api_base_url)
    _LOGGER.debug(
        "Building LLM model=%s base=%s version=%s",
        config.LITELLM_MODEL, api_base, api_version,
    )
    return SemaphoreWrappedLLM(
        api_key=api_key,
        api_base=api_base,
        api_version=api_version,
        config=config,
        worker_id=worker_id,
    )


@lru_cache(maxsize=8)
def get_worker_llm(worker_id: int) -> SemaphoreWrappedLLM:
    """Return the cached LLM client for a given worker (0-indexed)."""
    config = get_config()
    if not 0 <= worker_id < config.worker_count:
        raise ValueError(
            f"worker_id {worker_id} out of range [0, {config.worker_count})."
        )
    return build_llm(
        api_key=config.api_keys[worker_id],
        api_base_url=config.api_bases[worker_id],
        config=config,
        worker_id=worker_id,
    )


def _split_azure_endpoint(url: str) -> Tuple[str, str]:
    """Extract (api_base, api_version) from an Azure endpoint URL."""
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError(f"Invalid API base URL: {url!r}")
    api_base = f"{parsed.scheme}://{parsed.netloc}"
    versions = parse_qs(parsed.query).get("api-version", [])
    if not versions:
        raise ValueError(f"No api-version query parameter in URL: {url!r}")
    return api_base, versions[0]
