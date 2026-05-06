import { motion } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'


const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    sub: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'ontology',
    label: 'Ontology',
    sub: 'Pipeline',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="3" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="3" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 5v3M8 8L3 9M8 8l5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'review',
    label: 'Review',
    sub: 'Edit & Commit',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 5.5h5M5 8h5M5 10.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="13" cy="13" r="2" fill="currentColor"/>
        <path d="M12 12l1.5 1.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'graph',
    label: 'Graph',
    sub: 'Visualization',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8"  cy="8"  r="2"   stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="2"  cy="4"  r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="4"  r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="2"  cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3.5 4.5L6.5 7M9.5 7l2.5-2.5M6.5 9l-3 3M9.5 9l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'visualization',
    label: 'Knowledge',
    sub: 'Graph',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="2" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7.2 5.8L2.8 9.8M8.8 5.8l4.2 4M3 11v-4M13 11v-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'memory',
    label: 'Memory',
    sub: 'Connectivity',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2C5.2 2 3 4 3 6.5c0 1.3.5 2.4 1.4 3.2L3 13h10l-1.4-3.3C12.5 8.9 13 7.8 13 6.5 13 4 10.8 2 8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 6.5c0-1.1.9-2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'agent',
    label: 'Agent',
    sub: 'Chat',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 14l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="5" cy="6.5" r="1" fill="currentColor"/>
        <circle cx="8" cy="6.5" r="1" fill="currentColor"/>
        <circle cx="11" cy="6.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
]

const ACCENT = {
  dashboard:     'text-cortex-blue',
  ontology:      'text-cortex-blue',
  review:        'text-cortex-purple',
  graph:         'text-cortex-cyan',
  visualization: 'text-cortex-cyan',
  memory:        'text-cortex-green',
  agent:         'text-cortex-amber',
}

const GLOW_COLOR = {
  dashboard:     'rgba(14,165,233,0.6)',
  ontology:      'rgba(14,165,233,0.6)',
  review:        'rgba(129,140,248,0.6)',
  graph:         'rgba(34,211,238,0.6)',
  visualization: 'rgba(34,211,238,0.6)',
  memory:        'rgba(16,185,129,0.6)',
  agent:         'rgba(245,158,11,0.6)',
}

export default function NavBar() {
  const page    = useNeocortex((s) => s.page)
  const setPage = useNeocortex((s) => s.setPage)
  const agentStatus = useNeocortex((s) => s.agentStatus)

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md shadow-nav"
      style={{
        background: 'rgba(4, 18, 36, 0.85)',
        borderBottom: '1px solid rgba(14,165,233,0.15)',
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between h-14">

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.png" alt="Neocortex" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-display font-semibold text-[15px]" style={{ color: '#E8F4FF' }}>
            Neocortex
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const active = page === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setPage(tab.id)}
                className={[
                  'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  active ? ACCENT[tab.id] : 'hover:text-ink-900',
                ].join(' ')}
                style={active
                  ? { background: 'rgba(14,165,233,0.08)', color: undefined }
                  : { color: 'rgba(192,216,240,0.55)' }
                }
              >
                <span style={{ color: active ? undefined : 'rgba(14,165,233,0.4)' }}>
                  {tab.icon}
                </span>
                {tab.label}

                {tab.id === 'review' && agentStatus === 'done' && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: '#818CF8', boxShadow: '0 0 6px #818CF8' }} />
                )}

                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                    style={{ background: GLOW_COLOR[tab.id], boxShadow: `0 0 8px ${GLOW_COLOR[tab.id]}` }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <div />
      </div>
    </header>
  )
}
