"""Phase 2 — data property extraction."""

from __future__ import annotations

from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.types import Send

from service.ontology_tbox_pipeline.agents import build_data_property_extractor_chain
from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.prompts.extraction_prompts import (
    DATA_PROPERTY_EXTRACTION_SYSTEM_PROMPT,
    DATA_PROPERTY_EXTRACTION_USER_PROMPT,
)
from service.ontology_tbox_pipeline.state.pipeline_state import PipelineState, DataPropertyRecord
from service.ontology_tbox_pipeline.dedup.deterministic import dedup_data_properties

_LOGGER = get_logger("phase2")
_PHASE2_WORKER_NODE = "data_property_extractor_worker"


def dispatch_phase2(state: PipelineState) -> List[Send]:
    chunks = state["chunks"]
    worker_count = get_config().worker_count
    
    sends = [
        Send(
            _PHASE2_WORKER_NODE,
            {
                "chunks": chunks,
                "deduplicated_classes": state["deduplicated_classes"],
                "data_property_store": state["data_property_store"],
                "chunk_index": idx,
                "worker_id": idx % worker_count,
            },
        )
        for idx in range(len(chunks))
    ]
    _LOGGER.info("Phase 2 dispatch: %d chunk(s) across %d worker(s).", len(chunks), worker_count)
    return sends


async def data_property_extractor_worker_node(state: PipelineState) -> Dict[str, Any]:
    chunk = state["chunks"][state["chunk_index"]]
    worker_id = state["worker_id"]
    store = state["data_property_store"]
    classes = state["deduplicated_classes"]

    chain = build_data_property_extractor_chain(worker_id)
    classes_list_text = "\n".join([f"- {c.name}" for c in classes])
    
    user_prompt = DATA_PROPERTY_EXTRACTION_USER_PROMPT.format(
        classes_list=classes_list_text,
        chunk_text=chunk.text
    )

    try:
        result = await chain.ainvoke([
            SystemMessage(content=DATA_PROPERTY_EXTRACTION_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        records = [
            DataPropertyRecord(
                name=p.name,
                domain=p.domain_class,
                range_xsd=p.range_xsd,
                description=p.description,
                source_chunk_id=chunk.chunk_id,
            )
            for p in result.properties
        ]
        for r in records:
            await store.append(r)
            
    except Exception:
        _LOGGER.exception("Phase 2 worker %d failed on chunk %s; continuing.", worker_id, chunk.chunk_id)
        
    return {}


async def data_property_dedup_node(state: PipelineState) -> Dict[str, Any]:
    records = state["data_property_store"].snapshot_sync()
    if not records:
        return {"deduplicated_data_properties": []}

    canonical_list = dedup_data_properties(records)

    _LOGGER.info(
        "Phase 2 dedup produced %d canonical data prop(s) from %d record(s).",
        len(canonical_list), len(records),
    )
    return {"deduplicated_data_properties": canonical_list}
