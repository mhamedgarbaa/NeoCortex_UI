import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNeocortex } from '../store/useNeocortex.js'

// ── Token efficiency bar ─────────────────────────────────────────────────────
function TokenMeter({ raw, filtered }) {
  const ratio = Math.max(0.04, filtered / raw)
  const reduction = ((1 - ratio) * 100).toFixed(0)
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-mono text-ink-400">
        <span>Context window</span>
        <span className="text-cortex-green font-semibold">−{reduction}% compressed</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden bg-ink-200/20">
        {/* raw */}
        <div className="absolute inset-y-0 left-0 w-full bg-rose-900/40" />
        {/* filtered */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 60 }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-ink-400">
        <span>Filtered: <span className="text-cortex-green font-semibold">{filtered.toLocaleString()} tk</span></span>
        <span>Raw: <span className="text-ink-500">{raw.toLocaleString()} tk</span></span>
      </div>
    </div>
  )
}

// ── Source badge ─────────────────────────────────────────────────────────────
function SourceBadge({ layer, entity, confidence }) {
  const cfg = {
    Cognee:   { bg: 'rgba(147, 51, 234, 0.1)', color: '#A855F7', border: 'rgba(147, 51, 234, 0.2)' },
    GraphRAG: { bg: 'rgba(16, 185, 129, 0.1)', color: '#34D399', border: 'rgba(16, 185, 129, 0.2)' },
  }[layer] || { bg: 'rgba(14, 165, 233, 0.1)', color: '#38BDF8', border: 'rgba(14, 165, 233, 0.2)' }

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className="font-medium" style={{ color: cfg.color }}>{layer}</span>
      <span className="text-ink-500 truncate max-w-[140px]">{entity}</span>
      {confidence != null && (
        <span className="font-mono ml-auto" style={{ color: cfg.color }}>
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </div>
  )
}

// ── Agent message bubble ─────────────────────────────────────────────────────
function AgentMessage({ msg }) {
  const [showSources, setShowSources] = useState(false)
  const isAgent = msg.role === 'agent'

  if (!isAgent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
             style={{ background: 'linear-gradient(135deg, #0EA5E9, #0369A1)', color: '#fff', boxShadow: '0 0 20px rgba(14,165,233,0.25)' }}>
          {msg.text}
        </div>
      </motion.div>
    )
  }

  if (msg.error) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-rose-900/20 border border-rose-500/30
                        flex items-center justify-center shrink-0">
          <span className="text-rose-400 text-xs font-bold">!</span>
        </div>
        <div className="flex-1 p-3 rounded-xl bg-rose-900/20 border border-rose-500/30 text-sm text-rose-300">
          {msg.text}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cortex-purple to-cortex-blue
                      flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-white font-display font-bold text-xs">N</span>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="card p-4 text-sm text-ink-900 leading-relaxed whitespace-pre-wrap">
          {msg.text}
          {msg.mock && (
            <span className="ml-2 text-[10px] font-mono text-ink-300 align-middle">[demo]</span>
          )}
        </div>

        {/* Token meter */}
        {msg.tokensRaw > 0 && (
          <div className="card px-4 py-3">
            <TokenMeter raw={msg.tokensRaw} filtered={msg.tokensFiltered} />
          </div>
        )}

        {/* Sources toggle */}
        {msg.sources?.length > 0 && (
          <div>
            <button
              onClick={() => setShowSources((v) => !v)}
              className="text-xs text-ink-400 hover:text-ink-700 font-medium flex items-center gap-1.5 transition"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 5l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
                      style={{ transform: showSources ? 'rotate(180deg)' : 'none', transformOrigin: '6px 6px' }}/>
              </svg>
              {showSources ? 'Hide' : 'Show'} {msg.sources.length} sources
            </button>
            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-1.5 space-y-1.5"
                >
                  {msg.sources.map((s, i) => (
                    <SourceBadge key={i} {...s} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cortex-purple to-cortex-blue
                      flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-white font-display font-bold text-xs">N</span>
      </div>
      <div className="card px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-ink-300"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const messages   = useNeocortex((s) => s.chatMessages)
  const loading    = useNeocortex((s) => s.chatLoading)
  const send       = useNeocortex((s) => s.sendMessage)
  const clearChat  = useNeocortex((s) => s.clearChat)

  const cogneeConnected  = useNeocortex((s) => s.cogneeStatus  === 'connected')
  const graphragConnected= useNeocortex((s) => s.graphragStatus === 'connected')
  const mcpStatus        = useNeocortex((s) => s.mcpStatus)
  const mcpSessionId     = useNeocortex((s) => s.mcpSessionId)
  const setPage          = useNeocortex((s) => s.setPage)
  const extractedEntities = useNeocortex((s) => s.extractedEntities)

  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function submit() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    send(q)
  }

  const SUGGESTIONS = [
    'Latest compliance updates for EU contracts?',
    'How did GDPR interpretation evolve since 2024?',
    'Which customers are impacted by Policy 2026-Q2?',
    'Summarise SLA differences between Enterprise and SMB',
  ]

  const memoryReady = cogneeConnected || graphragConnected

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 shrink-0"
           style={{ borderBottom: '1px solid rgba(14,165,233,0.12)', background: 'rgba(2,10,22,0.6)', backdropFilter: 'blur(12px)' }}>
        <div>
          <h1 className="page-title">Agent Chat</h1>
          <p className="page-sub mt-0.5">Ask questions — context filtered by the adapter</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={cogneeConnected  ? 'dot-online' : 'dot-offline'} />
            <span className="text-ink-500">Cognee</span>
            <span className="text-ink-300">·</span>
            <span className={graphragConnected ? 'dot-online' : 'dot-offline'} />
            <span className="text-ink-500">GraphRAG</span>
          </div>
          {extractedEntities.length > 0 && (
            <button
              onClick={() => setPage('visualization')}
              className="text-xs px-3 py-1.5 rounded-lg bg-cortex-cyan/10 text-cortex-cyan border border-cortex-cyan/20 hover:bg-cortex-cyan/20 transition font-medium"
            >
              📊 {extractedEntities.length} entities
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-ink-400 hover:text-cortex-rose transition font-medium"
            >
              ↺ Clear chat
            </button>
          )}
        </div>
      </div>

      {/* Memory warning */}
      {!memoryReady && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-900/20 border border-amber-500/30
                        flex items-center justify-between gap-3 text-sm">
          <span className="text-amber-400">
            ⚠ Memory layer not connected — connect Cognee or GraphRAG for live context
          </span>
          <button
            onClick={() => setPage('memory')}
            className="shrink-0 text-xs font-medium text-amber-500 hover:text-amber-400 underline underline-offset-2"
          >
            Go to Memory →
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin px-6 py-6 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cortex-purple/10 to-cortex-blue/10
                              border border-cortex-purple/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">🧠</span>
              </div>
              <p className="font-semibold text-ink-200 text-lg">Ask Neocortex anything</p>
              <p className="text-sm text-ink-400">
                Context is filtered from the memory layer before reaching the agent
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="card text-left px-4 py-3 text-xs text-ink-600 hover:text-cortex-blue
                             hover:border-cortex-blue/30 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => <AgentMessage key={m.id} msg={m} />)}
            {loading && <TypingIndicator />}
          </>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 shrink-0"
           style={{ borderTop: '1px solid rgba(14,165,233,0.12)', background: 'rgba(2,10,22,0.7)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-end gap-3 p-3 rounded-2xl transition-all duration-200"
             style={{
               background: 'rgba(7,20,48,0.8)',
               border: `1px solid ${input ? 'rgba(14,165,233,0.45)' : 'rgba(14,165,233,0.15)'}`,
               boxShadow: input ? '0 0 16px rgba(14,165,233,0.15)' : 'none',
             }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            }}
            placeholder="Ask the agent… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm max-h-32 overflow-auto scrollbar-thin leading-relaxed"
            style={{ color: '#E8F4FF', height: 'auto', minHeight: '24px' }}
            onFocus={e => e.target.style.color = '#E8F4FF'}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || loading}
            className={[
              'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition',
              input.trim() && !loading
                ? 'bg-gradient-to-br from-cortex-blue to-cortex-purple text-white shadow-sm hover:opacity-90'
                : 'bg-ink-100 text-ink-300 cursor-not-allowed',
            ].join(' ')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8L3 3l2.5 5L3 13l10-5z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <p className="text-[10px] font-mono mt-2 text-center" style={{ color: 'rgba(14,165,233,0.4)' }}>
          {mcpStatus === 'connected'
            ? `MCP session active · searching Cognee graph`
            : `MCP offline — demo responses active`}
        </p>
      </div>
    </div>
  )
}
