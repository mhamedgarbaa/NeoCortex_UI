from .deterministic import dedup_classes, dedup_data_properties, dedup_object_properties
from .llm_alias_merger import merge_aliases_llm

__all__ = [
    "dedup_classes",
    "dedup_data_properties",
    "dedup_object_properties",
    "merge_aliases_llm",
]
