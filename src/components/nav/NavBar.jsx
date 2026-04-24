import { motion } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'

const TABS = [
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
  ontology: 'text-cortex-blue',
  review:   'text-cortex-purple',
  graph:    'text-cortex-cyan',
  memory:   'text-cortex-green',
  agent:    'text-cortex-amber',
}

const ACCENT_BG = {
  ontology: 'bg-cortex-blue',
  review:   'bg-cortex-purple',
  graph:    'bg-cortex-cyan',
  memory:   'bg-cortex-green',
  agent:    'bg-cortex-amber',
}

export default function NavBar() {
  const page    = useNeocortex((s) => s.page)
  const setPage = useNeocortex((s) => s.setPage)

  // Badge for review tab when file is ready
  const agentStatus = useNeocortex((s) => s.agentStatus)

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-ink-100 shadow-nav">
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between h-14">

        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cortex-blue via-cortex-purple to-cortex-green opacity-90" />
            <span className="relative text-white font-display font-bold text-xs">N</span>
          </div>
          <div className="leading-tight">
            <span className="font-display font-semibold text-[15px] text-ink-900">Neocortex</span>
            <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-ink-300">
              v2.0
            </span>
          </div>
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
                  active
                    ? `${ACCENT[tab.id]} bg-ink-100/60`
                    : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100/40',
                ].join(' ')}
              >
                <span className={active ? ACCENT[tab.id] : 'text-ink-400'}>
                  {tab.icon}
                </span>
                {tab.label}

                {/* Review badge when ontology ready */}
                {tab.id === 'review' && agentStatus === 'done' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cortex-purple animate-pulse" />
                )}

                {/* Active underline */}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${ACCENT_BG[tab.id]}`}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right: MCP status */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink-400">
          <span className="dot-online" />
          <span>MCP · Ready</span>
        </div>
      </div>
    </header>
  )
}
