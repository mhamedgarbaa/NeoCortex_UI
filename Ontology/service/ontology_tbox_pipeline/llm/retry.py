import logging
from typing import Any, Callable, Coroutine, TypeVar
import httpx
from litellm import RateLimitError
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)
from ..config import get_config

logger = logging.getLogger(__name__)

T = TypeVar("T")

def _is_rate_limit_error(exception: BaseException) -> bool:
    """Return True if the exception is a true rate limiting 429."""
    if isinstance(exception, RateLimitError):
        return True
    if isinstance(exception, httpx.HTTPStatusError):
        return exception.response.status_code == 429
    return False

def with_rate_limit_retry(func: Callable[..., Coroutine[Any, Any, T]]) -> Callable[..., Coroutine[Any, Any, T]]:
    """
    Decorator to retry async LLM calls strictly on 429 errors using tenacity backoff.
    Never preemptively sleeps.
    """
    config = get_config()
    
    return retry(
        retry=retry_if_exception(_is_rate_limit_error),
        wait=wait_exponential(multiplier=1, max=config.LLM_RETRY_MAX_BACKOFF_S),
        stop=stop_after_attempt(config.LLM_RETRY_MAX_ATTEMPTS),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )(func)
