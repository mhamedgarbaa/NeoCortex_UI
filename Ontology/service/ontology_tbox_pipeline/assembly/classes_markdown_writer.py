"""Serialize the canonical class hierarchy as a human-readable Markdown tree."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Set

from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.state.records import CanonicalClass

_LOGGER = get_logger("assembly.classes_md")


def write_classes_markdown(
    canonical_classes: List[CanonicalClass],
    output_path: Path,
) -> None:
    """Write an indented bullet-list rendering of the class forest."""
    by_name = {c.name: c for c in canonical_classes}
    children_index = _index_children(canonical_classes)
    roots = sorted(
        (c.name for c in canonical_classes if not _has_known_parent(c, by_name)),
        key=str.lower,
    )

    lines: List[str] = ["# Ontology — Class Hierarchy", ""]
    if not canonical_classes:
        lines.append("_No classes were extracted._")
    for root in roots:
        _render_node(root, by_name, children_index, depth=0, lines=lines, visited=set())

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    _LOGGER.info("Wrote %s (%d class(es)).", output_path, len(canonical_classes))


def _render_node(
    name: str,
    by_name: Dict[str, CanonicalClass],
    children_index: Dict[str, List[str]],
    depth: int,
    lines: List[str],
    visited: Set[str],
) -> None:
    """Append one bullet for the class and recurse for its children."""
    if name in visited:
        return
    visited = visited | {name}
    canonical = by_name[name]
    indent = "  " * depth
    description = canonical.description.strip()
    suffix = f" — {description}" if description else ""
    lines.append(f"{indent}- **{canonical.name}**{suffix}")
    for child in sorted(children_index.get(name, []), key=str.lower):
        _render_node(child, by_name, children_index, depth + 1, lines, visited)


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
    """A class is a root iff none of its declared parents exist in the canonical set."""
    return any(parent in by_name for parent in canonical.parents)
