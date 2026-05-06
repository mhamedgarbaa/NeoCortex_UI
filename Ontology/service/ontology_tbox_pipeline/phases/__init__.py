"""LangGraph nodes for each pipeline phase."""

from service.ontology_tbox_pipeline.phases.phase1_classes import (
    class_dedup_node,
    class_extractor_worker_node,
    dispatch_phase1,
)
from service.ontology_tbox_pipeline.phases.phase2_data_properties import (
    data_property_dedup_node,
    data_property_extractor_worker_node,
    dispatch_phase2,
)
from service.ontology_tbox_pipeline.phases.phase3_object_properties import (
    dispatch_phase3,
    object_property_dedup_node,
    object_property_extractor_worker_node,
)
from service.ontology_tbox_pipeline.phases.phase4_assembly import phase4_assembly_node

__all__ = [
    "dispatch_phase1",
    "class_extractor_worker_node",
    "class_dedup_node",
    "dispatch_phase2",
    "data_property_extractor_worker_node",
    "data_property_dedup_node",
    "dispatch_phase3",
    "object_property_extractor_worker_node",
    "object_property_dedup_node",
    "phase4_assembly_node",
]
