"""Phase 4 — deterministic assembly of the four output files. No LLM."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from service.ontology_tbox_pipeline.assembly.classes_json_writer import write_classes_json
from service.ontology_tbox_pipeline.assembly.classes_markdown_writer import (
    write_classes_markdown,
)
from service.ontology_tbox_pipeline.assembly.ontology_builder import build_ontology_graph
from service.ontology_tbox_pipeline.assembly.owl_writer import write_owl
from service.ontology_tbox_pipeline.assembly.turtle_writer import write_turtle
from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.state.pipeline_state import PipelineState

_LOGGER = get_logger("phase4")


async def phase4_assembly_node(state: PipelineState) -> Dict[str, Any]:
    """Build the rdflib graph and write all four output artifacts."""
    config = get_config()
    output_dir = _ensure_output_dir(config.OUTPUT_DIR)

    classes = state.get("deduplicated_classes", [])
    data_properties = state.get("deduplicated_data_properties", [])
    object_properties = state.get("deduplicated_object_properties", [])

    graph = build_ontology_graph(
        canonical_classes=classes,
        canonical_data_properties=data_properties,
        canonical_object_properties=object_properties,
        base_iri=config.ONTOLOGY_BASE_IRI,
        prefix=config.ONTOLOGY_PREFIX,
    )

    write_classes_json(
        canonical_classes=classes,
        base_iri=config.ONTOLOGY_BASE_IRI,
        output_path=output_dir / config.OUTPUT_CLASSES_JSON,
    )
    write_classes_markdown(
        canonical_classes=classes,
        output_path=output_dir / config.OUTPUT_CLASSES_MD,
    )
    write_turtle(graph, output_path=output_dir / config.OUTPUT_ONTOLOGY_TTL)
    write_owl(graph, output_path=output_dir / config.OUTPUT_ONTOLOGY_OWL)

    _LOGGER.info(
        "Phase 4 assembly complete: %d classes, %d data properties, %d object properties.",
        len(classes), len(data_properties), len(object_properties),
    )
    return {}


def _ensure_output_dir(path: str) -> Path:
    """Create the output directory if needed and return its Path."""
    output_dir = Path(path)
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir
