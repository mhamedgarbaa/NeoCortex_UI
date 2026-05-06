"""Serialize an rdflib graph to RDF/XML (``.owl``)."""

from __future__ import annotations

from pathlib import Path

from rdflib import Graph

from service.ontology_tbox_pipeline.logging_config import get_logger

_LOGGER = get_logger("assembly.owl")


def write_owl(graph: Graph, output_path: Path) -> None:
    """Serialize the graph in RDF/XML format and write it to ``output_path``."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    graph.serialize(destination=str(output_path), format="pretty-xml")
    _LOGGER.info("Wrote %s (%d triple(s)).", output_path, len(graph))
