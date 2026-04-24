// Cognee — temporal memory. Entity evolution over time.
export const timelinePoints = [
  { t: '2024-Q1', label: 'Initial policy'       },
  { t: '2024-Q3', label: 'Amendment A'          },
  { t: '2025-Q1', label: 'GDPR alignment'       },
  { t: '2025-Q4', label: 'Cross-border clause'  },
  { t: '2026-Q2', label: 'Current (Policy Q2)'  },
]

export const entityHistory = {
  'policy-q2': [
    { t: '2024-Q1', fact: 'Retention window: 24 months',                state: 'outdated' },
    { t: '2024-Q3', fact: 'Retention window: 18 months',                state: 'outdated' },
    { t: '2025-Q1', fact: 'GDPR-aligned breach notification: 72h',      state: 'stable'   },
    { t: '2025-Q4', fact: 'Cross-border transfer requires DPA v2',      state: 'stable'   },
    { t: '2026-Q2', fact: 'New subprocessor clause (Art. 28)',          state: 'current'  },
  ],
  'eu-contracts': [
    { t: '2024-Q1', fact: 'Template v3 — paper-based signing',          state: 'outdated' },
    { t: '2025-Q1', fact: 'e-Sign migration complete',                  state: 'stable'   },
    { t: '2026-Q2', fact: 'Auto-propagated Policy Q2 annex',            state: 'current'  },
  ],
}

export const entityList = [
  { id: 'policy-q2',    label: 'Policy 2026-Q2' },
  { id: 'eu-contracts', label: 'EU Contracts'   },
]
