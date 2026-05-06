"""Deterministic assembly of the ontology TBox output files (no LLM)."""

from service.ontology_tbox_pipeline.assembly.classes_json_writer import write_classes_json
from service.ontology_tbox_pipeline.assembly.classes_markdown_writer import (
    write_classes_markdown,
)
from service.ontology_tbox_pipeline.assembly.iri_utils import slugify_pascal_case
from service.ontology_tbox_pipeline.assembly.ontology_builder import build_ontology_graph
from service.ontology_tbox_pipeline.assembly.owl_writer import write_owl
from service.ontology_tbox_pipeline.assembly.turtle_writer import write_turtle

__all__ = [
    "build_ontology_graph",
    "write_classes_json",
    "write_classes_markdown",
    "write_turtle",
    "write_owl",
    "slugify_pascal_case",
]
