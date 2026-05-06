"""LangGraph state schema for the ontology TBox pipeline."""

from __future__ import annotations

from typing import List, NotRequired, TypedDict

from service.ontology_tbox_pipeline.chunking import Chunk
from service.ontology_tbox_pipeline.state.records import (
    CanonicalClass,
    CanonicalDataProperty,
    CanonicalObjectProperty,
    ClassRecord,
    DataPropertyRecord,
    ObjectPropertyRecord,
)
from service.ontology_tbox_pipeline.state.shared_stores import AsyncAppendOnlyStore


class PipelineState(TypedDict, total=False):
    """Shared state passed between LangGraph nodes.

    Mutable shared stores are passed by reference; concurrent workers mutate
    them in place under their own ``asyncio.Lock``. Worker nodes therefore
    return ``{}`` and never overwrite the store reference itself.
    """

    # --- Inputs ------------------------------------------------------------
    chunks: List[Chunk]

    # --- Phase 1 ----------------------------------------------------------
    class_store: AsyncAppendOnlyStore[ClassRecord]
    deduplicated_classes: List[CanonicalClass]

    # --- Phase 2 ----------------------------------------------------------
    data_property_store: AsyncAppendOnlyStore[DataPropertyRecord]
    deduplicated_data_properties: List[CanonicalDataProperty]

    # --- Phase 3 ----------------------------------------------------------
    object_property_store: AsyncAppendOnlyStore[ObjectPropertyRecord]
    deduplicated_object_properties: List[CanonicalObjectProperty]

    # --- Per-Send() worker payload (set transiently by dispatcher) -------
    worker_id: NotRequired[int]
    chunk_index: NotRequired[int]
