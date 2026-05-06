// GraphRAG — community-based knowledge clustering.
// Each community has its own accent + members.

export const communities = [
  {
    id: 'c-legal',
    name: 'Legal & Compliance',
    color: '#10D9A0',
    members: [
      { id: 'gdpr',        label: 'GDPR'        },
      { id: 'dpa-v2',      label: 'DPA v2'      },
      { id: 'ccpa',        label: 'CCPA'        },
      { id: 'sox',         label: 'SOX'         },
      { id: 'policy-q2',   label: 'Policy Q2'   },
    ],
  },
  {
    id: 'c-commercial',
    name: 'Commercial',
    color: '#3B82F6',
    members: [
      { id: 'eu-contracts',label: 'EU Contracts' },
      { id: 'us-contracts',label: 'US Contracts' },
      { id: 'sla-standard',label: 'SLA Std'      },
      { id: 'sla-premium', label: 'SLA Premium'  },
    ],
  },
  {
    id: 'c-customer',
    name: 'Customer Segments',
    color: '#A855F7',
    members: [
      { id: 'enterprise-c',label: 'Enterprise'   },
      { id: 'smb-c',       label: 'SMB'          },
      { id: 'startup-c',   label: 'Startup'      },
    ],
  },
]

// Inter-community edges (semantic neighborhoods)
export const communityLinks = [
  { source: 'gdpr',         target: 'eu-contracts', weight: 0.92 },
  { source: 'policy-q2',    target: 'eu-contracts', weight: 0.88 },
  { source: 'dpa-v2',       target: 'eu-contracts', weight: 0.71 },
  { source: 'ccpa',         target: 'us-contracts', weight: 0.67 },
  { source: 'sla-premium',  target: 'enterprise-c', weight: 0.61 },
  { source: 'sla-standard', target: 'smb-c',        weight: 0.55 },
]
