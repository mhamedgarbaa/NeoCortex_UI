"""Phase 1 deduplication: ReAct agent that produces canonical classes."""

from __future__ import annotations

from typing import List

from langchain_core.tools import StructuredTool
from langgraph.prebuilt import create_react_agent

from service.ontology_tbox_pipeline.llm import get_worker_llm
from service.ontology_tbox_pipeline.prompts import CLASS_DEDUPLICATION_SYSTEM_PROMPT


def build_class_deduplication_agent(worker_id: int, tools: List[StructuredTool]):
    """Construct the class deduplication ReAct agent."""
    llm = get_worker_llm(worker_id)
    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=CLASS_DEDUPLICATION_SYSTEM_PROMPT,
    )
