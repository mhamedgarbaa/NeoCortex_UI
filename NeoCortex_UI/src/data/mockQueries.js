export const querySuggestions = [
  'Latest compliance updates affecting EU contracts',
  'Which customers are impacted by Policy 2026-Q2?',
  'How did GDPR interpretation evolve since 2024?',
  'Summarize current SLA differences between Enterprise and SMB',
]

export const sampleBlocks = {
  entities: [
    { label: 'EU Contracts',    type: 'entity',  confidence: 0.97 },
    { label: 'Policy 2026-Q2',  type: 'entity',  confidence: 0.93 },
    { label: 'GDPR',            type: 'entity',  confidence: 0.95 },
    { label: 'DPA v2',          type: 'entity',  confidence: 0.84 },
  ],
  temporal: [
    { t: '2025-Q1', fact: 'GDPR-aligned 72h breach notification became binding.'      },
    { t: '2025-Q4', fact: 'Cross-border transfer requires DPA v2 across all regions.' },
    { t: '2026-Q2', fact: 'New subprocessor clause (Art. 28) attached to Policy Q2.'  },
  ],
  community: [
    { cluster: 'Legal & Compliance', note: 'Policy Q2 and DPA v2 co-occur with GDPR in 88% of retrieved chunks.' },
    { cluster: 'Commercial',         note: 'EU Contracts is the primary downstream surface for Policy Q2.'       },
  ],
  filtered: [
    'Policy 2026-Q2 introduces a subprocessor clause under GDPR Art. 28.',
    'EU Contracts auto-propagate the Q2 annex; re-signature required for 12 of 42.',
    'No material impact on US Contracts or SMB segment.',
  ],
  rejected: [
    { fact: 'Retention window: 24 months',               reason: 'Outdated · superseded 2024-Q3' },
    { fact: 'Paper-based signing workflow',               reason: 'Outdated · replaced by e-Sign' },
    { fact: 'Policy draft comment thread #1204',          reason: 'Low signal · unresolved draft' },
    { fact: 'Unrelated CCPA retention note',              reason: 'Off-scope · US jurisdiction' },
  ],
}
