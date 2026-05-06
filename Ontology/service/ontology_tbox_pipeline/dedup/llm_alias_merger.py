from typing import List, Any
from pydantic import BaseModel, Field

from ..state.records import CanonicalClass
from ..llm.llm_factory import get_worker_llm
from ..config import get_config
import logging

logger = logging.getLogger(__name__)


class AliasGroup(BaseModel):
    canonical_name: str = Field(..., description="The main name to keep.")
    synonyms_to_merge: List[str] = Field(
        ...,
        description="Other names from the list that are exact semantic synonyms and should be merged.",
    )


class LLMMergeResult(BaseModel):
    merge_groups: List[AliasGroup] = Field(default_factory=list)


async def _run_llm_merge(records: List[Any], record_type: str, worker_id: int) -> LLMMergeResult:
    llm_wrapper = get_worker_llm(worker_id)
    chain = llm_wrapper.with_structured_output(LLMMergeResult)

    items_text = "\n".join([f"- {r.name}: {r.description}" for r in records])
    prompt = (
        f"You are an expert ontologist. Look at this list of {record_type}.\n"
        "Identify which items are exact semantic synonyms (e.g. Customer and Client).\n"
        "Group them, picking the best general name as the canonical_name.\n"
        "If an item has no synonyms, do not include it.\n\n"
        f"Items:\n{items_text}"
    )

    logger.info("Running LLM alias merge for %d %s", len(records), record_type)
    try:
        return await chain.ainvoke(prompt)
    except Exception as e:
        logger.error("LLM alias merge failed: %s", e)
        return LLMMergeResult(merge_groups=[])


async def merge_aliases_llm(records: List[CanonicalClass], worker_id: int = 0) -> List[CanonicalClass]:
    """Optional single-call LLM pass to merge semantic synonyms among canonical classes."""
    config = get_config()
    if not config.ENABLE_LLM_ALIAS_MERGE or len(records) < 2:
        return records

    res = await _run_llm_merge(records, "classes", worker_id)
    if not res.merge_groups:
        return records
    return _apply_class_merges(records, res.merge_groups)


def _apply_class_merges(
    records: List[CanonicalClass], merge_groups: List[AliasGroup]
) -> List[CanonicalClass]:
    target_map: dict = {}
    for group in merge_groups:
        for syn in group.synonyms_to_merge:
            target_map[syn] = group.canonical_name

    merged_buckets: dict = {}
    for r in records:
        target = target_map.get(r.name, r.name)
        merged_buckets.setdefault(target, []).append(r)

    final_list: List[CanonicalClass] = []
    for target_name, group in merged_buckets.items():
        all_aliases = set()
        all_parents = set()
        descriptions = []
        for g in group:
            descriptions.append(g.description)
            all_aliases.add(g.name)
            all_aliases.update(g.aliases)
            all_parents.update(g.parents)
        all_aliases.discard(target_name)
        best_desc = max(descriptions, key=len) if descriptions else ""

        final_list.append(CanonicalClass(
            name=target_name,
            parents=list(all_parents),
            description=best_desc,
            aliases=list(all_aliases),
        ))
    return final_list
