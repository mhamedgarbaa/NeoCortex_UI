"""LangChain tools for the object property extractor and dedup agents."""

from __future__ import annotations

from dataclasses import asdict
from typing import List, Optional

from langchain_core.tools import StructuredTool

from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.state.records import (
    CanonicalClass,
    CanonicalObjectProperty,
    ObjectPropertyRecord,
)
from service.ontology_tbox_pipeline.state.shared_stores import AsyncAppendOnlyStore

_LOGGER = get_logger("tools.object_property")


def build_object_property_extractor_tools(
    object_property_store: AsyncAppendOnlyStore[ObjectPropertyRecord],
    canonical_classes: List[CanonicalClass],
    source_chunk_id: str,
) -> List[StructuredTool]:
    """Tools for the object property extractor agent."""
    snapshot_limit = get_config().SNAPSHOT_MAX_ITEMS
    class_payload = [
        {"name": c.name, "description": c.description} for c in canonical_classes
    ]

    async def add_object_property(
        name: str,
        domain: str,
        range: str,
        description: str,
        inverse_of: Optional[str],
    ) -> str:
        """Append a newly extracted object property to the shared store."""
        record = ObjectPropertyRecord(
            name=name.strip(),
            domain=domain.strip(),
            range=range.strip(),
            description=description.strip(),
            inverse_of=(inverse_of or "").strip() or None,
            source_chunk_id=source_chunk_id,
        )
        await object_property_store.append(record)
        _LOGGER.debug(
            "add_object_property: %s (%s -> %s)", record.name, record.domain, record.range
        )
        return f"Added object property '{record.name}' on '{record.domain}'."

    async def get_object_property_snapshot() -> List[dict]:
        """Return the most recent object property records."""
        items = await object_property_store.snapshot(snapshot_limit)
        return [asdict(item) for item in items]

    async def get_class_list() -> List[dict]:
        """Return the canonical class list (frozen for this phase)."""
        return list(class_payload)

    return [
        StructuredTool.from_function(
            coroutine=add_object_property,
            name="add_object_property",
            description=(
                "Append one new object property. Arguments: name (camelCase verb "
                "phrase), domain and range (canonical class names), description, "
                "inverse_of (the inverse property name, or null)."
            ),
        ),
        StructuredTool.from_function(
            coroutine=get_object_property_snapshot,
            name="get_object_property_snapshot",
            description="Return the latest snapshot of extracted object properties.",
        ),
        StructuredTool.from_function(
            coroutine=get_class_list,
            name="get_class_list",
            description="Return the canonical class list usable as domain or range.",
        ),
    ]


def build_object_property_dedup_tools(
    output_sink: List[CanonicalObjectProperty],
    completion_flag: List[bool],
) -> List[StructuredTool]:
    """Tools the dedup agent uses to emit canonical object properties."""

    async def add_canonical_object_property(
        name: str,
        domain: str,
        range: str,
        description: str,
        inverse_of: Optional[str],
        aliases: List[str],
    ) -> str:
        """Append one canonical object property to the deduplicated output."""
        canonical = CanonicalObjectProperty(
            name=name.strip(),
            domain=domain.strip(),
            range=range.strip(),
            description=description.strip(),
            inverse_of=(inverse_of or "").strip() or None,
            aliases=[a.strip() for a in (aliases or []) if a and a.strip()],
        )
        output_sink.append(canonical)
        _LOGGER.debug(
            "add_canonical_object_property: %s (%s -> %s)",
            canonical.name, canonical.domain, canonical.range,
        )
        return f"Added canonical object property '{canonical.name}'."

    async def finalize_object_properties() -> str:
        """Signal that the deduplicated object property list is complete."""
        completion_flag.append(True)
        _LOGGER.info(
            "Object property deduplication finalized: %d canonical entries.",
            len(output_sink),
        )
        return f"Finalized {len(output_sink)} canonical object properties."

    return [
        StructuredTool.from_function(
            coroutine=add_canonical_object_property,
            name="add_canonical_object_property",
            description=(
                "Append one canonical object property. Arguments: name "
                "(camelCase verb phrase), domain, range, description, "
                "inverse_of (or null), aliases (list of merged variants)."
            ),
        ),
        StructuredTool.from_function(
            coroutine=finalize_object_properties,
            name="finalize_object_properties",
            description="Call exactly once after all canonical object properties are added.",
        ),
    ]
