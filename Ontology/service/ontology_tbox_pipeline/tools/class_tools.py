"""LangChain tools for the class extractor and class deduplication agents."""

from __future__ import annotations

from dataclasses import asdict
from typing import List, Optional

from langchain_core.tools import StructuredTool

from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.state.records import CanonicalClass, ClassRecord
from service.ontology_tbox_pipeline.state.shared_stores import AsyncAppendOnlyStore

_LOGGER = get_logger("tools.class")


def build_class_extractor_tools(
    class_store: AsyncAppendOnlyStore[ClassRecord],
    source_chunk_id: str,
) -> List[StructuredTool]:
    """Tools the class extractor agent uses to read/write the class store."""
    snapshot_limit = get_config().SNAPSHOT_MAX_ITEMS

    async def add_class(
        name: str, parent_name: Optional[str], description: str
    ) -> str:
        """Append a newly extracted class to the shared store."""
        record = ClassRecord(
            name=name.strip(),
            parent_name=(parent_name or "").strip() or None,
            description=description.strip(),
            source_chunk_id=source_chunk_id,
        )
        await class_store.append(record)
        _LOGGER.debug("add_class: %s (parent=%s)", record.name, record.parent_name)
        return f"Added class '{record.name}'."

    async def get_class_snapshot() -> List[dict]:
        """Return the most recent class records (capped by SNAPSHOT_MAX_ITEMS)."""
        items = await class_store.snapshot(snapshot_limit)
        return [asdict(item) for item in items]

    return [
        StructuredTool.from_function(
            coroutine=add_class,
            name="add_class",
            description=(
                "Append one new class to the shared store. Use exactly once per "
                "newly identified class. Arguments: name (PascalCase), "
                "parent_name (existing class name or null for a root class), "
                "description (one or two sentences)."
            ),
        ),
        StructuredTool.from_function(
            coroutine=get_class_snapshot,
            name="get_class_snapshot",
            description=(
                "Return the latest snapshot of classes already extracted, so "
                "you can avoid duplicates and pick suitable parents."
            ),
        ),
    ]


def build_class_dedup_tools(
    output_sink: List[CanonicalClass],
    completion_flag: List[bool],
) -> List[StructuredTool]:
    """Tools the dedup agent uses to emit canonical classes and signal completion."""

    async def add_canonical_class(
        name: str,
        aliases: List[str],
        description: str,
        parents: List[str],
    ) -> str:
        """Append one canonical class to the deduplicated output."""
        canonical = CanonicalClass(
            name=name.strip(),
            parents=[p.strip() for p in (parents or []) if p and p.strip()],
            description=description.strip(),
            aliases=[a.strip() for a in (aliases or []) if a and a.strip()],
        )
        output_sink.append(canonical)
        _LOGGER.debug(
            "add_canonical_class: %s (aliases=%d, parents=%d)",
            canonical.name, len(canonical.aliases), len(canonical.parents),
        )
        return f"Added canonical class '{canonical.name}'."

    async def finalize_classes() -> str:
        """Signal that the deduplicated class list is complete."""
        completion_flag.append(True)
        _LOGGER.info("Class deduplication finalized: %d canonical classes.", len(output_sink))
        return f"Finalized {len(output_sink)} canonical classes."

    return [
        StructuredTool.from_function(
            coroutine=add_canonical_class,
            name="add_canonical_class",
            description=(
                "Append one canonical (deduplicated) class. Arguments: name "
                "(PascalCase), aliases (list of merged variants, may be empty), "
                "description (one or two sentences), parents (list of canonical "
                "parent class names, may be empty for root concepts)."
            ),
        ),
        StructuredTool.from_function(
            coroutine=finalize_classes,
            name="finalize_classes",
            description=(
                "Call exactly once after all canonical classes have been added "
                "to signal that the deduplication output is complete."
            ),
        ),
    ]
