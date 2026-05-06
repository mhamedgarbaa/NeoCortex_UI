"""Phase 1 — class extraction: dispatcher, worker node, and dedup node."""

from __future__ import annotations

from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.types import Send

from service.ontology_tbox_pipeline.agents import build_class_extractor_chain
from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.prompts.extraction_prompts import (
    CLASS_EXTRACTION_SYSTEM_PROMPT,
    CLASS_EXTRACTION_USER_PROMPT,
)
from service.ontology_tbox_pipeline.state.pipeline_state import PipelineState, ClassRecord
from service.ontology_tbox_pipeline.dedup.deterministic import dedup_classes
from service.ontology_tbox_pipeline.dedup.llm_alias_merger import merge_aliases_llm

_LOGGER = get_logger("phase1")
_PHASE1_WORKER_NODE = "class_extractor_worker"


def dispatch_phase1(state: PipelineState) -> List[Send]:
    chunks = state["chunks"]
    class_store = state["class_store"]
    worker_count = get_config().worker_count
    
    sends = [
        Send(
            _PHASE1_WORKER_NODE,
            {
                "chunks": chunks,
                "class_store": class_store,
                "chunk_index": idx,
                "worker_id": idx % worker_count,
            },
        )
        for idx in range(len(chunks))
    ]
    _LOGGER.info("Phase 1 dispatch: %d chunk(s) across %d worker(s).", len(chunks), worker_count)
    return sends


async def class_extractor_worker_node(state: PipelineState) -> Dict[str, Any]:
    chunk = state["chunks"][state["chunk_index"]]
    worker_id = state["worker_id"]
    class_store = state["class_store"]

    chain = build_class_extractor_chain(worker_id)
    user_prompt = CLASS_EXTRACTION_USER_PROMPT.format(chunk_text=chunk.text)

    try:
        result = await chain.ainvoke([
            SystemMessage(content=CLASS_EXTRACTION_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        # Convert schema items to ClassRecord and write to shared store
        records = [
            ClassRecord(
                name=c.name,
                parent_name=c.parent_name,
                description=c.description,
                source_chunk_id=chunk.chunk_id,
            )
            for c in result.classes
        ]
        for r in records:
            await class_store.append(r)
            
    except Exception:
        _LOGGER.exception("Phase 1 worker %d failed on chunk %s; continuing.", worker_id, chunk.chunk_id)
        
    return {}


async def class_dedup_node(state: PipelineState) -> Dict[str, Any]:
    records = state["class_store"].snapshot_sync()
    if not records:
        _LOGGER.warning("No classes were extracted in phase 1.")
        return {"deduplicated_classes": []}

    _LOGGER.info("Phase 1 dedup starting with %d raw records.", len(records))
    
    # Deterministic pass
    canonical_list = dedup_classes(records)
    
    # Optional LLM pass
    config = get_config()
    if config.ENABLE_LLM_ALIAS_MERGE:
        canonical_list = await merge_aliases_llm(canonical_list, worker_id=0)

    _LOGGER.info(
        "Phase 1 dedup produced %d canonical class(es) from %d record(s).",
        len(canonical_list), len(records),
    )
    return {"deduplicated_classes": canonical_list}
