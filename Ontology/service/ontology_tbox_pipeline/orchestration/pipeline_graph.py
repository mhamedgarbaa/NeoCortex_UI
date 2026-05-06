"""Build the LangGraph ``StateGraph`` orchestrating all four phases."""

from __future__ import annotations

from typing import List

from langgraph.graph import END, START, StateGraph

from service.ontology_tbox_pipeline.chunking import Chunk
from service.ontology_tbox_pipeline.phases import (
    class_dedup_node,
    class_extractor_worker_node,
    data_property_dedup_node,
    data_property_extractor_worker_node,
    dispatch_phase1,
    dispatch_phase2,
    dispatch_phase3,
    object_property_dedup_node,
    object_property_extractor_worker_node,
    phase4_assembly_node,
)
from service.ontology_tbox_pipeline.state.pipeline_state import PipelineState
from service.ontology_tbox_pipeline.state.records import (
    ClassRecord,
    DataPropertyRecord,
    ObjectPropertyRecord,
)
from service.ontology_tbox_pipeline.state.shared_stores import AsyncAppendOnlyStore

_DISPATCH_PHASE1 = "dispatch_phase1"
_DISPATCH_PHASE2 = "dispatch_phase2"
_DISPATCH_PHASE3 = "dispatch_phase3"
_PHASE1_WORKER = "class_extractor_worker"
_PHASE1_DEDUP = "class_dedup"
_PHASE2_WORKER = "data_property_extractor_worker"
_PHASE2_DEDUP = "data_property_dedup"
_PHASE3_WORKER = "object_property_extractor_worker"
_PHASE3_DEDUP = "object_property_dedup"
_PHASE4_ASSEMBLY = "phase4_assembly"


def build_pipeline():
    """Construct and compile the full pipeline ``StateGraph``."""
    graph = StateGraph(PipelineState)

    graph.add_node(_DISPATCH_PHASE1, _passthrough)
    graph.add_node(_PHASE1_WORKER, class_extractor_worker_node)
    graph.add_node(_PHASE1_DEDUP, class_dedup_node)

    graph.add_node(_DISPATCH_PHASE2, _passthrough)
    graph.add_node(_PHASE2_WORKER, data_property_extractor_worker_node)
    graph.add_node(_PHASE2_DEDUP, data_property_dedup_node)

    graph.add_node(_DISPATCH_PHASE3, _passthrough)
    graph.add_node(_PHASE3_WORKER, object_property_extractor_worker_node)
    graph.add_node(_PHASE3_DEDUP, object_property_dedup_node)

    graph.add_node(_PHASE4_ASSEMBLY, phase4_assembly_node)

    graph.add_edge(START, _DISPATCH_PHASE1)
    graph.add_conditional_edges(
        _DISPATCH_PHASE1, dispatch_phase1, [_PHASE1_WORKER]
    )
    graph.add_edge(_PHASE1_WORKER, _PHASE1_DEDUP)
    graph.add_edge(_PHASE1_DEDUP, _DISPATCH_PHASE2)
    graph.add_conditional_edges(
        _DISPATCH_PHASE2, dispatch_phase2, [_PHASE2_WORKER]
    )
    graph.add_edge(_PHASE2_WORKER, _PHASE2_DEDUP)
    graph.add_edge(_PHASE2_DEDUP, _DISPATCH_PHASE3)
    graph.add_conditional_edges(
        _DISPATCH_PHASE3, dispatch_phase3, [_PHASE3_WORKER]
    )
    graph.add_edge(_PHASE3_WORKER, _PHASE3_DEDUP)
    graph.add_edge(_PHASE3_DEDUP, _PHASE4_ASSEMBLY)
    graph.add_edge(_PHASE4_ASSEMBLY, END)

    return graph.compile()


def build_initial_state(chunks: List[Chunk]) -> PipelineState:
    """Construct the initial pipeline state with empty shared stores."""
    return PipelineState(
        chunks=chunks,
        class_store=AsyncAppendOnlyStore[ClassRecord](),
        data_property_store=AsyncAppendOnlyStore[DataPropertyRecord](),
        object_property_store=AsyncAppendOnlyStore[ObjectPropertyRecord](),
        deduplicated_classes=[],
        deduplicated_data_properties=[],
        deduplicated_object_properties=[],
    )


def _passthrough(state: PipelineState) -> dict:
    """Dispatch nodes have no state delta — Send routing happens in the conditional edge."""
    return {}
