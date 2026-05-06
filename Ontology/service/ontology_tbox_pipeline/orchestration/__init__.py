"""LangGraph wiring for the ontology TBox pipeline."""

from service.ontology_tbox_pipeline.orchestration.pipeline_graph import (
    build_initial_state,
    build_pipeline,
)

__all__ = ["build_pipeline", "build_initial_state"]
