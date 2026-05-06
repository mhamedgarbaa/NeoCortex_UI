import { useNeocortex } from '../store/useNeocortex.js'

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const map = {
    connected:    { color: '#10B981', glow: 'rgba(16,185,129,0.5)',  label: 'Connected'    },
    syncing:      { color: '#F59E0B', glow: 'rgba(245,158,11,0.5)',  label: 'Syncing…'     },
    connecting:   { color: '#F59E0B', glow: 'rgba(245,158,11,0.5)',  label: 'Connecting…'  },
    disconnected: { color: '#5590C0', glow: 'transparent',           label: 'Disconnected' },
    error:        { color: '#FB7185', glow: 'rgba(251,113,133,0.5)', label: 'Error'        },
  }
  const s = map[status] ?? map.disconnected
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0"
            style={{ background: s.color, boxShadow: `0 0 6px ${s.glow}` }} />
      <span className="text-xs font-mono" style={{ color: s.color }}>{s.label}</span>
    </span>
  )
}

function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'rgba(4,18,36,0.7)',
        border: '1px solid rgba(14,165,233,0.12)',
        backdropFilter: 'blur(12px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function StatCard({ label, value, sub, accent }) {
  const colors = {
    blue:   '#0EA5E9',
    purple: '#818CF8',
    cyan:   '#22D3EE',
    green:  '#10B981',
    amber:  '#F59E0B',
  }
  const color = colors[accent] ?? colors.blue
  return (
    <div
      className="rounded-2xl p-5 overflow-hidden relative"
      style={{
        background: 'rgba(4,18,36,0.7)',
        border: '1px solid rgba(14,165,233,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
           style={{ background: color, opacity: 0.6 }} />
      <p className="text-xs font-mono uppercase tracking-widest mb-2"
         style={{ color: 'rgba(192,216,240,0.45)' }}>{label}</p>
      <p className="text-3xl font-display font-bold" style={{ color }}>{value ?? '—'}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'rgba(192,216,240,0.35)' }}>{sub}</p>}
    </div>
  )
}

const NAV_ITEMS = [
  {
    id: 'ontology', label: 'Ontology Pipeline', sub: 'Ingest files & run the agent',
    accent: 'blue',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="3" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="3" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 5v3M8 8L3 9M8 8l5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'review', label: 'Review', sub: 'Edit & commit the ontology',
    accent: 'purple',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 5.5h5M5 8h5M5 10.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="13" cy="13" r="2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'graph', label: 'Ontology Graph', sub: 'Force-graph class hierarchy',
    accent: 'cyan',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
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
    id: 'visualization', label: 'Knowledge Graph', sub: 'Cognee live graph',
    accent: 'cyan',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="2" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7.2 5.8L2.8 9.8M8.8 5.8l4.2 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'memory', label: 'Memory', sub: 'Cognee + GraphRAG connectivity',
    accent: 'green',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M8 2C5.2 2 3 4 3 6.5c0 1.3.5 2.4 1.4 3.2L3 13h10l-1.4-3.3C12.5 8.9 13 7.8 13 6.5 13 4 10.8 2 8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 6.5c0-1.1.9-2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'agent', label: 'Agent Chat', sub: 'Query the knowledge graph',
    accent: 'amber',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 14l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="5" cy="6.5" r="1" fill="currentColor"/>
        <circle cx="8" cy="6.5" r="1" fill="currentColor"/>
        <circle cx="11" cy="6.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
]

const ACCENT_COLOR = {
  blue:   '#0EA5E9',
  purple: '#818CF8',
  cyan:   '#22D3EE',
  green:  '#10B981',
  amber:  '#F59E0B',
}

function LogLine({ entry }) {
  const color = {
    info:    'rgba(192,216,240,0.6)',
    success: '#10B981',
    warn:    '#F59E0B',
    error:   '#FB7185',
    done:    '#22D3EE',
  }[entry.kind] ?? 'rgba(192,216,240,0.6)'
  return (
    <div className="flex items-start gap-2 text-xs font-mono py-1 border-b"
         style={{ borderColor: 'rgba(14,165,233,0.06)', color }}>
      <span style={{ color: 'rgba(192,216,240,0.25)', flexShrink: 0 }}>›</span>
      <span>{entry.text}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const setPage         = useNeocortex((s) => s.setPage)
  const cogneeStatus    = useNeocortex((s) => s.cogneeStatus)
  const cogneeStats     = useNeocortex((s) => s.cogneeStats)
  const cogneePingMs    = useNeocortex((s) => s.cogneePingMs)
  const graphragStatus  = useNeocortex((s) => s.graphragStatus)
  const graphragStats   = useNeocortex((s) => s.graphragStats)
  const ingestedFiles   = useNeocortex((s) => s.ingestedFiles)
  const agentStatus     = useNeocortex((s) => s.agentStatus)
  const agentLog        = useNeocortex((s) => s.agentLog)
  const cognifyLog      = useNeocortex((s) => s.cognifyLog)
  const chatMessages    = useNeocortex((s) => s.chatMessages)
  const ontologyFilePath= useNeocortex((s) => s.ontologyFilePath)
  const connectCognee   = useNeocortex((s) => s.connectCognee)
  const connectGraphRAG = useNeocortex((s) => s.connectGraphRAG)

  const filesReady  = ingestedFiles.filter((f) => f.done).length
  const totalFiles  = ingestedFiles.length

  // Merge activity logs, most recent last → show last 8
  const activity = [
    ...agentLog.map((e) => ({ ...e, source: 'Agent' })),
    ...cognifyLog.map((e) => ({ ...e, source: 'Cognee' })),
  ].slice(-8)

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: '#E8F4FF' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(192,216,240,0.5)' }}>
          System overview · Neocortex knowledge platform
        </p>
      </div>

      {/* ── Status row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Cognee */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-widest"
                  style={{ color: 'rgba(34,211,238,0.6)' }}>Cognee</span>
            <StatusDot status={cogneeStatus} />
          </div>
          <div className="space-y-1.5 text-xs font-mono" style={{ color: 'rgba(192,216,240,0.55)' }}>
            <div className="flex justify-between">
              <span>Entities</span>
              <span style={{ color: '#E8F4FF' }}>{cogneeStats?.entities ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Relations</span>
              <span style={{ color: '#E8F4FF' }}>{cogneeStats?.relations ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Ping</span>
              <span style={{ color: '#E8F4FF' }}>{cogneePingMs != null ? `${cogneePingMs} ms` : '—'}</span>
            </div>
          </div>
          {cogneeStatus === 'disconnected' || cogneeStatus === 'error' ? (
            <button
              onClick={connectCognee}
              className="mt-4 w-full py-1.5 text-xs font-medium rounded-lg transition"
              style={{ background: 'rgba(34,211,238,0.1)', color: '#22D3EE', border: '1px solid rgba(34,211,238,0.25)' }}
            >
              Connect
            </button>
          ) : null}
        </Card>

        {/* GraphRAG */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-widest"
                  style={{ color: 'rgba(129,140,248,0.6)' }}>GraphRAG</span>
            <StatusDot status={graphragStatus} />
          </div>
          <div className="space-y-1.5 text-xs font-mono" style={{ color: 'rgba(192,216,240,0.55)' }}>
            <div className="flex justify-between">
              <span>Communities</span>
              <span style={{ color: '#E8F4FF' }}>{graphragStats?.communities ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Nodes</span>
              <span style={{ color: '#E8F4FF' }}>{graphragStats?.nodes ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Edges</span>
              <span style={{ color: '#E8F4FF' }}>{graphragStats?.edges ?? '—'}</span>
            </div>
          </div>
          {graphragStatus === 'disconnected' || graphragStatus === 'error' ? (
            <button
              onClick={connectGraphRAG}
              className="mt-4 w-full py-1.5 text-xs font-medium rounded-lg transition"
              style={{ background: 'rgba(129,140,248,0.1)', color: '#818CF8', border: '1px solid rgba(129,140,248,0.25)' }}
            >
              Connect
            </button>
          ) : null}
        </Card>

        {/* Pipeline summary */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-widest"
                  style={{ color: 'rgba(14,165,233,0.6)' }}>Pipeline</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: agentStatus === 'done'    ? 'rgba(16,185,129,0.15)'  :
                                agentStatus === 'running' ? 'rgba(245,158,11,0.15)'  :
                                                            'rgba(14,165,233,0.08)',
                    color:      agentStatus === 'done'    ? '#10B981' :
                                agentStatus === 'running' ? '#F59E0B' :
                                                            'rgba(192,216,240,0.4)',
                  }}>
              {agentStatus}
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono" style={{ color: 'rgba(192,216,240,0.55)' }}>
            <div className="flex justify-between">
              <span>Files ingested</span>
              <span style={{ color: '#E8F4FF' }}>{filesReady}/{totalFiles || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Ontology</span>
              <span style={{ color: '#E8F4FF' }} className="truncate ml-4 text-right max-w-[120px]">
                {ontologyFilePath ? ontologyFilePath.split('/').pop() : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Chat messages</span>
              <span style={{ color: '#E8F4FF' }}>{chatMessages.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Entities"     value={cogneeStats?.entities}      accent="cyan"   sub="in Cognee graph" />
        <StatCard label="Relations"    value={cogneeStats?.relations}     accent="blue"   sub="mapped links"    />
        <StatCard label="GR Nodes"     value={graphragStats?.nodes}       accent="purple" sub="GraphRAG index"  />
        <StatCard label="Files"        value={totalFiles || 0}            accent="green"  sub={`${filesReady} processed`} />
        <StatCard label="Chat"         value={chatMessages.length}        accent="amber"  sub="messages total"  />
      </div>

      {/* ── Quick actions + Activity ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick actions */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-3"
             style={{ color: 'rgba(192,216,240,0.4)' }}>Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {NAV_ITEMS.map((item) => {
              const color = ACCENT_COLOR[item.accent]
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className="flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-150 group"
                  style={{
                    background: 'rgba(4,18,36,0.7)',
                    border: `1px solid rgba(14,165,233,0.1)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = `1px solid ${color}44`
                    e.currentTarget.style.background = `${color}08`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(14,165,233,0.1)'
                    e.currentTarget.style.background = 'rgba(4,18,36,0.7)'
                  }}
                >
                  <span style={{ color }} className="mt-0.5 shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#E8F4FF' }}>{item.label}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(192,216,240,0.45)' }}>{item.sub}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-3"
             style={{ color: 'rgba(192,216,240,0.4)' }}>Recent Activity</p>
          <Card className="h-full" style={{ minHeight: '240px' }}>
            {activity.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-xs font-mono" style={{ color: 'rgba(192,216,240,0.25)' }}>
                  No activity yet — run the pipeline to get started
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {activity.map((entry, i) => (
                  <LogLine key={entry.id ?? i} entry={entry} />
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
