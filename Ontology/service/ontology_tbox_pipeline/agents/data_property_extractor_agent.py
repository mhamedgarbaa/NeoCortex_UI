"""Phase 2 worker: Structured output chain that extracts data properties from a chunk."""

from __future__ import annotations

from typing import Any

from service.ontology_tbox_pipeline.llm import get_worker_llm
from service.ontology_tbox_pipeline.schemas import ExtractedDataPropertyList


def build_data_property_extractor_chain(worker_id: int) -> Any:
    """Construct a structured output chain for data property extraction."""
    llm = get_worker_llm(worker_id)
    return llm.with_structured_output(ExtractedDataPropertyList)
