import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <div className="relative h-2 rounded-full overflow-hidden bg-ink-100">
        {/* raw */}
        <div className="absolute inset-y-0 left-0 w-full bg-red-100" />
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
    Cognee:   { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
    GraphRAG: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  }[layer] || { bg: '#F8FAFF', color: '#475569', border: '#E2E8F0' }

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className="font-medium" style={{ color: cfg.color }}>{layer}</span>
      <span className="text-ink-500 truncate max-w-[140px]">{entity}</span>
      <span className="font-mono ml-auto" style={{ color: cfg.color }}>
        {(confidence * 100).toFixed(0)}%
      </span>
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
        <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm
                        bg-gradient-to-br from-cortex-blue to-blue-700 text-white text-sm leading-relaxed shadow-sm">
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
        <div className="card p-4 text-sm text-ink-800 leading-relaxed">
          {msg.text}
        </div>

        {/* Token meter */}
        <div className="card px-4 py-3">
          <TokenMeter raw={msg.tokensRaw} filtered={msg.tokensFiltered} />
        </div>

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
  const setPage          = useNeocortex((s) => s.setPage)

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
      <div className="px-6 py-4 border-b border-ink-100 bg-white/70 backdrop-blur-sm
                      flex items-center justify-between gap-4 shrink-0">
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
        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200
                        flex items-center justify-between gap-3 text-sm">
          <span className="text-cortex-amber">
            ⚠ Memory layer not connected — connect Cognee or GraphRAG for live context
          </span>
          <button
            onClick={() => setPage('memory')}
            className="shrink-0 text-xs font-medium text-cortex-amber underline underline-offset-2"
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
              <p className="font-semibold text-ink-800">Ask Neocortex anything</p>
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
      <div className="px-6 py-4 border-t border-ink-100 bg-white/80 backdrop-blur-sm shrink-0">
        <div className={[
          'flex items-end gap-3 p-3 rounded-2xl border transition-all duration-200 bg-white',
          input ? 'border-cortex-blue shadow-glow-blue' : 'border-ink-200',
        ].join(' ')}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            }}
            placeholder="Ask the agent… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm text-ink-900
                       placeholder:text-ink-300 max-h-32 overflow-auto scrollbar-thin leading-relaxed"
            style={{ height: 'auto', minHeight: '24px' }}
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
        <p className="text-[10px] text-ink-300 font-mono mt-2 text-center">
          Context compressed via Neocortex adapter · MCP connected
        </p>
      </div>
    </div>
  )
}
