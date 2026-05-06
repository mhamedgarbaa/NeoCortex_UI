"""Phase 3 — object property extraction."""

from __future__ import annotations

from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.types import Send

from service.ontology_tbox_pipeline.agents import build_object_property_extractor_chain
from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.prompts.extraction_prompts import (
    OBJECT_PROPERTY_EXTRACTION_SYSTEM_PROMPT,
    OBJECT_PROPERTY_EXTRACTION_USER_PROMPT,
)
from service.ontology_tbox_pipeline.state.pipeline_state import PipelineState, ObjectPropertyRecord
from service.ontology_tbox_pipeline.dedup.deterministic import dedup_object_properties

_LOGGER = get_logger("phase3")
_PHASE3_WORKER_NODE = "object_property_extractor_worker"


def dispatch_phase3(state: PipelineState) -> List[Send]:
    chunks = state["chunks"]
    worker_count = get_config().worker_count
    
    sends = [
        Send(
            _PHASE3_WORKER_NODE,
            {
                "chunks": chunks,
                "deduplicated_classes": state["deduplicated_classes"],
                "object_property_store": state["object_property_store"],
                "chunk_index": idx,
                "worker_id": idx % worker_count,
            },
        )
        for idx in range(len(chunks))
    ]
    _LOGGER.info("Phase 3 dispatch: %d chunk(s) across %d worker(s).", len(chunks), worker_count)
    return sends


async def object_property_extractor_worker_node(state: PipelineState) -> Dict[str, Any]:
    chunk = state["chunks"][state["chunk_index"]]
    worker_id = state["worker_id"]
    store = state["object_property_store"]
    classes = state["deduplicated_classes"]

    chain = build_object_property_extractor_chain(worker_id)
    classes_list_text = "\n".join([f"- {c.name}" for c in classes])
    
    user_prompt = OBJECT_PROPERTY_EXTRACTION_USER_PROMPT.format(
        classes_list=classes_list_text,
        chunk_text=chunk.text
    )

    try:
        result = await chain.ainvoke([
            SystemMessage(content=OBJECT_PROPERTY_EXTRACTION_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        records = [
            ObjectPropertyRecord(
                name=p.name,
                domain=p.domain_class,
                range=p.range_class,
                description=p.description,
                inverse_of=p.inverse_of,
                source_chunk_id=chunk.chunk_id,
            )
            for p in result.properties
        ]
        for r in records:
            await store.append(r)
            
    except Exception:
        _LOGGER.exception("Phase 3 worker %d failed on chunk %s; continuing.", worker_id, chunk.chunk_id)
        
    return {}


async def object_property_dedup_node(state: PipelineState) -> Dict[str, Any]:
    records = state["object_property_store"].snapshot_sync()
    if not records:
        return {"deduplicated_object_properties": []}

    canonical_list = dedup_object_properties(records)

    _LOGGER.info(
        "Phase 3 dedup produced %d canonical object prop(s) from %d record(s).",
        len(canonical_list), len(records),
    )
    return {"deduplicated_object_properties": canonical_list}
