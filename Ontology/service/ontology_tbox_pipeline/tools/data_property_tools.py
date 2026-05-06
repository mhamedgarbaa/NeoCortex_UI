"""LangChain tools for the data property extractor and dedup agents."""

from __future__ import annotations

from dataclasses import asdict
from typing import List

from langchain_core.tools import StructuredTool

from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.state.records import (
    CanonicalClass,
    CanonicalDataProperty,
    DataPropertyRecord,
)
from service.ontology_tbox_pipeline.state.shared_stores import AsyncAppendOnlyStore

_LOGGER = get_logger("tools.data_property")


def build_data_property_extractor_tools(
    data_property_store: AsyncAppendOnlyStore[DataPropertyRecord],
    canonical_classes: List[CanonicalClass],
    source_chunk_id: str,
) -> List[StructuredTool]:
    """Tools for the data property extractor agent."""
    snapshot_limit = get_config().SNAPSHOT_MAX_ITEMS
    class_payload = [
        {"name": c.name, "description": c.description} for c in canonical_classes
    ]

    async def add_data_property(
        name: str, domain: str, range_xsd: str, description: str
    ) -> str:
        """Append a newly extracted data property to the shared store."""
        record = DataPropertyRecord(
            name=name.strip(),
            domain=domain.strip(),
            range_xsd=range_xsd.strip(),
            description=description.strip(),
            source_chunk_id=source_chunk_id,
        )
        await data_property_store.append(record)
        _LOGGER.debug(
            "add_data_property: %s (%s -> %s)", record.name, record.domain, record.range_xsd
        )
        return f"Added data property '{record.name}' on '{record.domain}'."

    async def get_data_property_snapshot() -> List[dict]:
        """Return the most recent data property records."""
        items = await data_property_store.snapshot(snapshot_limit)
        return [asdict(item) for item in items]

    async def get_class_list() -> List[dict]:
        """Return the canonical class list (frozen for this phase)."""
        return list(class_payload)

    return [
        StructuredTool.from_function(
            coroutine=add_data_property,
            name="add_data_property",
            description=(
                "Append one new data property. Arguments: name (camelCase), "
                "domain (canonical class name from get_class_list), range_xsd "
                "(one of xsd:string, xsd:integer, xsd:decimal, xsd:boolean, "
                "xsd:date, xsd:dateTime, xsd:anyURI), description."
            ),
        ),
        StructuredTool.from_function(
            coroutine=get_data_property_snapshot,
            name="get_data_property_snapshot",
            description="Return the latest snapshot of extracted data properties.",
        ),
        StructuredTool.from_function(
            coroutine=get_class_list,
            name="get_class_list",
            description="Return the canonical class list usable as data property domains.",
        ),
    ]


def build_data_property_dedup_tools(
    output_sink: List[CanonicalDataProperty],
    completion_flag: List[bool],
) -> List[StructuredTool]:
    """Tools the dedup agent uses to emit canonical data properties."""

    async def add_canonical_data_property(
        name: str,
        domain: str,
        range_xsd: str,
        description: str,
        aliases: List[str],
    ) -> str:
        """Append one canonical data property to the deduplicated output."""
        canonical = CanonicalDataProperty(
            name=name.strip(),
            domain=domain.strip(),
            range_xsd=range_xsd.strip(),
            description=description.strip(),
            aliases=[a.strip() for a in (aliases or []) if a and a.strip()],
        )
        output_sink.append(canonical)
        _LOGGER.debug(
            "add_canonical_data_property: %s (%s -> %s)",
            canonical.name, canonical.domain, canonical.range_xsd,
        )
        return f"Added canonical data property '{canonical.name}'."

    async def finalize_data_properties() -> str:
        """Signal that the deduplicated data property list is complete."""
        completion_flag.append(True)
        _LOGGER.info(
            "Data property deduplication finalized: %d canonical entries.",
            len(output_sink),
        )
        return f"Finalized {len(output_sink)} canonical data properties."

    return [
        StructuredTool.from_function(
            coroutine=add_canonical_data_property,
            name="add_canonical_data_property",
            description=(
                "Append one canonical data property. Arguments: name (camelCase), "
                "domain (canonical class name), range_xsd, description, aliases "
                "(list of merged variant names)."
            ),
        ),
        StructuredTool.from_function(
            coroutine=finalize_data_properties,
            name="finalize_data_properties",
            description="Call exactly once after all canonical data properties are added.",
        ),
    ]
