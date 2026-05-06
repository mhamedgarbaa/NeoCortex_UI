"""Phase 1 worker: Structured output chain that extracts classes from a single chunk."""

from __future__ import annotations

from typing import Any

from service.ontology_tbox_pipeline.llm import get_worker_llm
from service.ontology_tbox_pipeline.schemas import ExtractedClassList


def build_class_extractor_chain(worker_id: int) -> Any:
    """Construct a structured output chain pinned to a worker's API key."""
    llm = get_worker_llm(worker_id)
    return llm.with_structured_output(ExtractedClassList)
