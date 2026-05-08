// ── Ontology graph nodes/edges (React Flow visualization) ────────────────────

export const ontologyNodes = [
  { id: 'root',         position: { x: 260, y: 20 },  type: 'concept', data: { label: 'Enterprise',     kind: 'root',   count: 412 } },
  { id: 'contracts',    position: { x: 60,  y: 120 }, type: 'concept', data: { label: 'Contracts',      kind: 'domain', count: 98  } },
  { id: 'compliance',   position: { x: 260, y: 120 }, type: 'concept', data: { label: 'Compliance',     kind: 'domain', count: 74  } },
  { id: 'customers',    position: { x: 460, y: 120 }, type: 'concept', data: { label: 'Customers',      kind: 'domain', count: 240 } },
  { id: 'eu-contracts', position: { x: -20, y: 230 }, type: 'concept', data: { label: 'EU Contracts',   kind: 'entity', count: 42  } },
  { id: 'us-contracts', position: { x: 140, y: 230 }, type: 'concept', data: { label: 'US Contracts',   kind: 'entity', count: 56  } },
  { id: 'gdpr',         position: { x: 230, y: 230 }, type: 'concept', data: { label: 'GDPR',           kind: 'entity', count: 31  } },
  { id: 'policy-q2',    position: { x: 340, y: 230 }, type: 'concept', data: { label: 'Policy 2026-Q2', kind: 'entity', count: 12  } },
  { id: 'enterprise-c', position: { x: 440, y: 230 }, type: 'concept', data: { label: 'Enterprise Seg', kind: 'entity', count: 89  } },
  { id: 'smb-c',        position: { x: 560, y: 230 }, type: 'concept', data: { label: 'SMB',            kind: 'entity', count: 151 } },
]

export const ontologyEdges = [
  { id: 'e1', source: 'root',         target: 'contracts'   },
  { id: 'e2', source: 'root',         target: 'compliance'  },
  { id: 'e3', source: 'root',         target: 'customers'   },
  { id: 'e4', source: 'contracts',    target: 'eu-contracts' },
  { id: 'e5', source: 'contracts',    target: 'us-contracts' },
  { id: 'e6', source: 'compliance',   target: 'gdpr'        },
  { id: 'e7', source: 'compliance',   target: 'policy-q2'   },
  { id: 'e8', source: 'customers',    target: 'enterprise-c' },
  { id: 'e9', source: 'customers',    target: 'smb-c'       },
  { id: 'x1', source: 'eu-contracts', target: 'gdpr',         label: 'governed_by' },
  { id: 'x2', source: 'policy-q2',    target: 'eu-contracts', label: 'affects'     },
]

// ── Generated ontology file (JSON-LD) ─────────────────────────────────────────
// This is what the agent produces and writes to ONTOLOGY_PATH.

export const generatedOntologyFile = {
  "@context": {
    "@vocab": "https://neocortex.enterprise/ontology#",
    "rdfs":   "http://www.w3.org/2000/01/rdf-schema#",
    "owl":    "http://www.w3.org/2002/07/owl#",
    "xsd":    "http://www.w3.org/2001/XMLSchema#"
  },
  "@graph": [
    {
      "@id":   "nc:Enterprise",
      "@type": "owl:Class",
      "rdfs:label": "Enterprise",
      "rdfs:comment": "Top-level enterprise knowledge domain",
      "nc:entityCount": 412,
      "nc:subDomains": ["nc:Contracts", "nc:Compliance", "nc:Customers"]
    },
    {
      "@id":   "nc:Contracts",
      "@type": "owl:Class",
      "rdfs:subClassOf": "nc:Enterprise",
      "rdfs:label": "Contracts",
      "nc:entityCount": 98,
      "nc:members": ["nc:EUContracts", "nc:USContracts"]
    },
    {
      "@id":   "nc:Compliance",
      "@type": "owl:Class",
      "rdfs:subClassOf": "nc:Enterprise",
      "rdfs:label": "Compliance",
      "nc:entityCount": 74,
      "nc:members": ["nc:GDPR", "nc:Policy2026Q2"]
    },
    {
      "@id":   "nc:Customers",
      "@type": "owl:Class",
      "rdfs:subClassOf": "nc:Enterprise",
      "rdfs:label": "Customers",
      "nc:entityCount": 240,
      "nc:segments": ["nc:EnterpriseSeg", "nc:SMB"]
    },
    {
      "@id":   "nc:EUContracts",
      "@type": "owl:NamedIndividual",
      "rdfs:label": "EU Contracts",
      "nc:governedBy": "nc:GDPR",
      "nc:entityCount": 42
    },
    {
      "@id":   "nc:GDPR",
      "@type": "owl:NamedIndividual",
      "rdfs:label": "GDPR",
      "nc:entityCount": 31
    },
    {
      "@id":   "nc:Policy2026Q2",
      "@type": "owl:NamedIndividual",
      "rdfs:label": "Policy 2026-Q2",
      "nc:affects": "nc:EUContracts",
      "nc:entityCount": 12
    }
  ],
  "_meta": {
    "generated":   "2026-04-24T12:31:00Z",
    "agent":       "neocortex-ontology-agent-v2",
    "totalNodes":  10,
    "totalEdges":  11,
    "classes":     4,
    "conflicts":   3,
    "resolved":    3
  }
}
