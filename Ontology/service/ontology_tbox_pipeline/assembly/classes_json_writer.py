"""Serialize the canonical class hierarchy as ``classes.json``."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set

from service.ontology_tbox_pipeline.assembly.iri_utils import slugify_pascal_case
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.state.records import CanonicalClass

_LOGGER = get_logger("assembly.classes_json")


def write_classes_json(
    canonical_classes: List[CanonicalClass],
    base_iri: str,
    output_path: Path,
) -> None:
    """Write the class forest as a stable, indented UTF-8 JSON document."""
    payload = {
        "ontology_iri": base_iri.rstrip("#").rstrip("/"),
        "generated_at": _utc_now_iso(),
        "classes": _build_forest(canonical_classes, base_iri),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    _LOGGER.info("Wrote %s (%d top-level class(es)).",
                 output_path, len(payload["classes"]))


def _build_forest(
    canonical_classes: List[CanonicalClass], base_iri: str
) -> List[dict]:
    """Build a nested forest of classes ordered by name."""
    by_name = {c.name: c for c in canonical_classes}
    children_index = _index_children(canonical_classes)
    roots = sorted(
        (c.name for c in canonical_classes if not _has_known_parent(c, by_name)),
        key=str.lower,
    )
    return [_build_node(name, by_name, children_index, base_iri, set()) for name in roots]


def _build_node(
    name: str,
    by_name: Dict[str, CanonicalClass],
    children_index: Dict[str, List[str]],
    base_iri: str,
    visited: Set[str],
) -> dict:
    """Recursively render one class and its subclasses; cycle-safe."""
    if name in visited:
        return {"name": name, "iri": _iri_for(name, base_iri),
                "description": "", "subclasses": []}
    visited = visited | {name}
    canonical = by_name[name]
    child_names = sorted(children_index.get(name, []), key=str.lower)
    return {
        "name": canonical.name,
        "iri": _iri_for(canonical.name, base_iri),
        "description": canonical.description,
        "subclasses": [
            _build_node(child, by_name, children_index, base_iri, visited)
            for child in child_names
        ],
    }


def _index_children(
    canonical_classes: List[CanonicalClass],
) -> Dict[str, List[str]]:
    """Build a parent-name -> [child-names] index."""
    index: Dict[str, List[str]] = {}
    known_names = {c.name for c in canonical_classes}
    for canonical in canonical_classes:
        for parent in canonical.parents:
            if parent in known_names:
                index.setdefault(parent, []).append(canonical.name)
    return index


def _has_known_parent(
    canonical: CanonicalClass, by_name: Dict[str, CanonicalClass]
) -> bool:
    """A class is a root iff none of its declared parents are in the canonical set."""
    return any(parent in by_name for parent in canonical.parents)


def _iri_for(name: str, base_iri: str) -> str:
    """Compose the IRI for a class name."""
    return f"{base_iri}{slugify_pascal_case(name)}"


def _utc_now_iso() -> str:
    """Current UTC time formatted as an ISO-8601 string."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
