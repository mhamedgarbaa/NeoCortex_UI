"""Typed records shared across phases of the pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass(frozen=True)
class ClassRecord:
    """One class extracted from a single chunk by a single worker."""

    name: str
    parent_name: Optional[str]
    description: str
    source_chunk_id: str


@dataclass(frozen=True)
class DataPropertyRecord:
    """One data property extracted from a single chunk."""

    name: str
    domain: str
    range_xsd: str
    description: str
    source_chunk_id: str


@dataclass(frozen=True)
class ObjectPropertyRecord:
    """One object property extracted from a single chunk."""

    name: str
    domain: str
    range: str
    description: str
    inverse_of: Optional[str]
    source_chunk_id: str


@dataclass(frozen=True)
class CanonicalClass:
    """A deduplicated class, possibly merging several extracted records."""

    name: str
    parents: List[str] = field(default_factory=list)
    description: str = ""
    aliases: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class CanonicalDataProperty:
    """A deduplicated data property."""

    name: str
    domain: str
    range_xsd: str
    description: str = ""
    aliases: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class CanonicalObjectProperty:
    """A deduplicated object property."""

    name: str
    domain: str
    range: str
    description: str = ""
    inverse_of: Optional[str] = None
    aliases: List[str] = field(default_factory=list)
