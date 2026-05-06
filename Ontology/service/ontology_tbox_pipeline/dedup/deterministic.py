from typing import List, Dict, Set
import unicodedata
import re

from ..state.records import (
    ClassRecord,
    DataPropertyRecord,
    ObjectPropertyRecord,
    CanonicalClass,
    CanonicalDataProperty,
    CanonicalObjectProperty,
)


def _normalize_name(name: str) -> str:
    name = ''.join(c for c in unicodedata.normalize('NFKD', name) if unicodedata.category(c) != 'Mn')
    name = re.sub(r'[\W_]+', '', name)
    return name.lower()


def _most_common(items: List[str]) -> str:
    counts: Dict[str, int] = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return max(counts, key=counts.__getitem__)


def dedup_classes(records: List[ClassRecord]) -> List[CanonicalClass]:
    """Group raw ClassRecords by normalized name and collapse into CanonicalClass objects."""
    buckets: Dict[str, List[ClassRecord]] = {}
    for r in records:
        key = _normalize_name(r.name)
        buckets.setdefault(key, []).append(r)

    result: List[CanonicalClass] = []
    for group in buckets.values():
        canonical_name = _most_common([g.name for g in group])
        all_parents: Set[str] = {g.parent_name for g in group if g.parent_name}
        all_aliases: Set[str] = {g.name for g in group}
        all_aliases.discard(canonical_name)
        descriptions = [g.description for g in group]
        best_desc = max(descriptions, key=len) if descriptions else ""

        result.append(CanonicalClass(
            name=canonical_name,
            parents=list(all_parents),
            description=best_desc,
            aliases=list(all_aliases),
        ))
    return result


def dedup_data_properties(records: List[DataPropertyRecord]) -> List[CanonicalDataProperty]:
    """Group raw DataPropertyRecords and collapse into CanonicalDataProperty objects."""
    buckets: Dict[str, List[DataPropertyRecord]] = {}
    for r in records:
        key = f"{_normalize_name(r.name)}::{_normalize_name(r.domain)}"
        buckets.setdefault(key, []).append(r)

    xsd_order = {
        "xsd:string": 1, "xsd:integer": 2, "xsd:decimal": 3,
        "xsd:boolean": 4, "xsd:date": 5, "xsd:dateTime": 6,
    }

    result: List[CanonicalDataProperty] = []
    for group in buckets.values():
        canonical_name = _most_common([g.name for g in group])
        canonical_domain = _most_common([g.domain for g in group])
        all_aliases: Set[str] = {g.name for g in group}
        all_aliases.discard(canonical_name)
        descriptions = [g.description for g in group]
        best_desc = max(descriptions, key=len) if descriptions else ""

        best_range = max(group, key=lambda g: xsd_order.get(g.range_xsd, 0)).range_xsd

        result.append(CanonicalDataProperty(
            name=canonical_name,
            domain=canonical_domain,
            range_xsd=best_range,
            description=best_desc,
            aliases=list(all_aliases),
        ))
    return result


def dedup_object_properties(records: List[ObjectPropertyRecord]) -> List[CanonicalObjectProperty]:
    """Group raw ObjectPropertyRecords and collapse into CanonicalObjectProperty objects."""
    buckets: Dict[str, List[ObjectPropertyRecord]] = {}
    for r in records:
        key = (
            f"{_normalize_name(r.name)}::"
            f"{_normalize_name(r.domain)}::"
            f"{_normalize_name(r.range)}"
        )
        buckets.setdefault(key, []).append(r)

    result: List[CanonicalObjectProperty] = []
    for group in buckets.values():
        canonical_name = _most_common([g.name for g in group])
        canonical_domain = _most_common([g.domain for g in group])
        canonical_range = _most_common([g.range for g in group])
        all_aliases: Set[str] = {g.name for g in group}
        all_aliases.discard(canonical_name)
        descriptions = [g.description for g in group]
        best_desc = max(descriptions, key=len) if descriptions else ""
        inverses: Set[str] = {g.inverse_of for g in group if g.inverse_of}
        best_inverse = next(iter(inverses), None)

        result.append(CanonicalObjectProperty(
            name=canonical_name,
            domain=canonical_domain,
            range=canonical_range,
            description=best_desc,
            inverse_of=best_inverse,
            aliases=list(all_aliases),
        ))
    return result
