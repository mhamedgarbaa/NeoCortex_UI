"""Build an in-memory ``rdflib.Graph`` representing the OWL TBox.

The graph contains: an ``owl:Ontology`` declaration, ``owl:Class`` triples
with subclass links, ``owl:DatatypeProperty`` triples with domains/ranges,
and ``owl:ObjectProperty`` triples with domains/ranges/inverses. No
individuals, no data assertions.
"""

from __future__ import annotations

from typing import Iterable, List, Optional, Set

from rdflib import RDF, RDFS, XSD, Graph, Literal, Namespace, URIRef
from rdflib.namespace import OWL

from service.ontology_tbox_pipeline.assembly.iri_utils import (
    slugify_camel_case,
    slugify_pascal_case,
)
from service.ontology_tbox_pipeline.logging_config import get_logger
from service.ontology_tbox_pipeline.state.records import (
    CanonicalClass,
    CanonicalDataProperty,
    CanonicalObjectProperty,
)

_LOGGER = get_logger("assembly.builder")

_XSD_LOOKUP = {
    "xsd:string": XSD.string,
    "xsd:integer": XSD.integer,
    "xsd:decimal": XSD.decimal,
    "xsd:boolean": XSD.boolean,
    "xsd:date": XSD.date,
    "xsd:datetime": XSD.dateTime,
    "xsd:anyuri": XSD.anyURI,
}


def build_ontology_graph(
    canonical_classes: List[CanonicalClass],
    canonical_data_properties: List[CanonicalDataProperty],
    canonical_object_properties: List[CanonicalObjectProperty],
    base_iri: str,
    prefix: str,
) -> Graph:
    """Assemble the rdflib graph for the TBox."""
    graph = Graph()
    namespace = Namespace(base_iri)
    graph.bind(prefix, namespace)
    graph.bind("owl", OWL)
    graph.bind("rdfs", RDFS)
    graph.bind("xsd", XSD)

    _add_ontology_declaration(graph, base_iri)
    class_iri_index = _add_classes(graph, namespace, canonical_classes)
    lower_class_index = {k.lower(): v for k, v in class_iri_index.items()}
    _add_data_properties(graph, namespace, canonical_data_properties, class_iri_index, lower_class_index)
    _add_object_properties(graph, namespace, canonical_object_properties, class_iri_index, lower_class_index)
    return graph


def _add_ontology_declaration(graph: Graph, base_iri: str) -> None:
    """Declare the ``owl:Ontology`` resource itself."""
    ontology_iri = URIRef(base_iri.rstrip("#").rstrip("/"))
    graph.add((ontology_iri, RDF.type, OWL.Ontology))


def _add_classes(
    graph: Graph,
    namespace: Namespace,
    canonical_classes: Iterable[CanonicalClass],
) -> dict:
    """Emit ``owl:Class`` triples and return a name -> IRI index."""
    canonical_classes = list(canonical_classes)
    iri_by_name: dict = {}
    for canonical in canonical_classes:
        iri = namespace[slugify_pascal_case(canonical.name)]
        iri_by_name[canonical.name] = iri
        for alias in canonical.aliases:
            iri_by_name.setdefault(alias, iri)

    for canonical in canonical_classes:
        iri = iri_by_name[canonical.name]
        graph.add((iri, RDF.type, OWL.Class))
        graph.add((iri, RDFS.label, Literal(canonical.name)))
        if canonical.description:
            graph.add((iri, RDFS.comment, Literal(canonical.description)))
        for parent_name in canonical.parents:
            parent_iri = iri_by_name.get(parent_name)
            if parent_iri is None:
                _LOGGER.warning(
                    "Parent class %r of %r is not in the canonical list; skipping.",
                    parent_name, canonical.name,
                )
                continue
            graph.add((iri, RDFS.subClassOf, parent_iri))
    return iri_by_name


def _add_data_properties(
    graph: Graph,
    namespace: Namespace,
    canonical_properties: Iterable[CanonicalDataProperty],
    class_iri_index: dict,
    lower_class_index: dict,
) -> None:
    """Emit ``owl:DatatypeProperty`` triples."""
    seen: Set[str] = set()
    for canonical in canonical_properties:
        property_iri = namespace[slugify_camel_case(canonical.name)]
        domain_iri = class_iri_index.get(canonical.domain) or lower_class_index.get(
            canonical.domain.lower() if canonical.domain else ""
        )
        if domain_iri is None:
            _LOGGER.warning(
                "Data property %r references unknown domain class %r; skipping.",
                canonical.name, canonical.domain,
            )
            continue
        range_iri = _resolve_xsd(canonical.range_xsd)
        if range_iri is None:
            _LOGGER.warning(
                "Data property %r has unsupported range %r; defaulting to xsd:string.",
                canonical.name, canonical.range_xsd,
            )
            range_iri = XSD.string

        if str(property_iri) not in seen:
            graph.add((property_iri, RDF.type, OWL.DatatypeProperty))
            graph.add((property_iri, RDFS.label, Literal(canonical.name)))
            if canonical.description:
                graph.add((property_iri, RDFS.comment, Literal(canonical.description)))
            seen.add(str(property_iri))
        graph.add((property_iri, RDFS.domain, domain_iri))
        graph.add((property_iri, RDFS.range, range_iri))


def _add_object_properties(
    graph: Graph,
    namespace: Namespace,
    canonical_properties: Iterable[CanonicalObjectProperty],
    class_iri_index: dict,
    lower_class_index: dict,
) -> None:
    """Emit ``owl:ObjectProperty`` triples with domains, ranges, inverses."""
    seen: Set[str] = set()
    canonical_list = list(canonical_properties)
    name_to_iri: dict = {}
    for canonical in canonical_list:
        name_to_iri[canonical.name] = namespace[slugify_camel_case(canonical.name)]

    for canonical in canonical_list:
        property_iri = name_to_iri[canonical.name]
        domain_iri = class_iri_index.get(canonical.domain) or lower_class_index.get(
            canonical.domain.lower() if canonical.domain else ""
        )
        range_iri = class_iri_index.get(canonical.range) or lower_class_index.get(
            canonical.range.lower() if canonical.range else ""
        )
        if domain_iri is None or range_iri is None:
            _LOGGER.warning(
                "Object property %r references unknown class(es) (%r, %r); skipping.",
                canonical.name, canonical.domain, canonical.range,
            )
            continue

        if str(property_iri) not in seen:
            graph.add((property_iri, RDF.type, OWL.ObjectProperty))
            graph.add((property_iri, RDFS.label, Literal(canonical.name)))
            if canonical.description:
                graph.add((property_iri, RDFS.comment, Literal(canonical.description)))
            seen.add(str(property_iri))
        graph.add((property_iri, RDFS.domain, domain_iri))
        graph.add((property_iri, RDFS.range, range_iri))

        inverse_iri = _resolve_inverse(canonical.inverse_of, name_to_iri, namespace)
        if inverse_iri is not None:
            graph.add((property_iri, OWL.inverseOf, inverse_iri))


def _resolve_xsd(range_label: str) -> Optional[URIRef]:
    """Map a textual XSD label (e.g. 'xsd:date') to its rdflib URIRef."""
    if not range_label:
        return None
    return _XSD_LOOKUP.get(range_label.strip().lower())


def _resolve_inverse(
    inverse_name: Optional[str], name_to_iri: dict, namespace: Namespace
) -> Optional[URIRef]:
    """Look up the IRI of a property's inverse, falling back to a fresh slug."""
    if not inverse_name:
        return None
    if inverse_name in name_to_iri:
        return name_to_iri[inverse_name]
    return namespace[slugify_camel_case(inverse_name)]
