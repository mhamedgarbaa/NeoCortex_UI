import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNeocortex } from '../store/useNeocortex.js'

// ── Line-numbered editor ─────────────────────────────────────────────────────
function CodeEditor({ value, onChange }) {
  const lines = value.split('\n')
  return (
    <div className="flex h-full min-h-0 font-mono text-[12.5px] leading-6 overflow-auto scrollbar-thin">
      {/* Line numbers */}
      <div className="select-none px-3 py-4 text-right bg-ink-200/5 border-r border-ink-100/10
                      text-ink-400 min-w-[3rem] shrink-0">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Editable area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 py-4 px-4 outline-none resize-none bg-transparent text-ink-700
                   font-mono text-[12.5px] leading-6 whitespace-pre"
        style={{ minHeight: `${Math.max(lines.length * 24 + 32, 300)}px` }}
      />
    </div>
  )
}

// ── Validation panel ─────────────────────────────────────────────────────────
function ValidationPanel() {
  const result   = useNeocortex((s) => s.validationResult)
  const validate = useNeocortex((s) => s.validateOntology)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    await validate()
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="section-title">Validation</span>
        <button
          onClick={run}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-cortex-blue text-white font-medium
                     hover:bg-blue-600 transition disabled:opacity-50"
        >
          {loading ? 'Validating…' : '▷ Run Validation'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {result.ok
              ? <div className="flex items-center gap-2 p-3 rounded-lg bg-cortex-green/10 border border-cortex-green/30 text-sm text-cortex-green font-medium">
                  ✓ Valid Turtle — no errors found
                </div>
              : result.errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-rose-900/20 border border-rose-500/30 text-sm text-rose-400">
                  <span className="shrink-0 font-bold">✕</span> {e.msg}
                </div>
              ))
            }
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-900/20 border border-amber-500/30 text-sm text-amber-400">
                <span className="shrink-0 font-bold">⚠</span> {w.msg}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Commit panel ─────────────────────────────────────────────────────────────
const COMMIT_PATH = '/ontologies/ontology.ttl'

function CommitPanel() {
  const commit      = useNeocortex((s) => s.commitOntology)
  const status      = useNeocortex((s) => s.commitStatus)
  const commitError = useNeocortex((s) => s.commitError)
  const resetCommit = useNeocortex((s) => s.resetCommit)
  const validation  = useNeocortex((s) => s.validationResult)

  const canCommit = !validation || validation.ok

  return (
    <div className="space-y-3">
      <span className="section-title">Inject into Cognee</span>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-200/50 border border-ink-100/10">
        <span className="text-[10px] font-mono text-cortex-purple font-bold shrink-0">TTL</span>
        <span className="font-mono text-xs text-ink-500 truncate">{COMMIT_PATH}</span>
      </div>

      <AnimatePresence mode="wait">
        {status === 'committed' ? (
          <motion.div
            key="committed"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-cortex-green/10 border border-cortex-green/30 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cortex-green font-semibold text-sm">
                <span>✓ Injected into Cognee</span>
              </div>
              <button onClick={resetCommit} className="text-xs text-ink-300 hover:text-ink-100 transition">
                Reset
              </button>
            </div>
            <p className="font-mono text-xs text-cortex-green bg-cortex-green/20 px-3 py-1.5 rounded-lg border border-cortex-green/10">
              {COMMIT_PATH}
            </p>
            <p className="text-xs text-ink-400">
              Active ontology updated — next cognify call will use the new schema.
            </p>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            whileTap={{ scale: 0.98 }}
            onClick={commit}
            disabled={status === 'committing' || !canCommit}
            className={[
              'w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2',
              canCommit && status !== 'committing'
                ? 'bg-gradient-to-r from-cortex-purple to-cortex-blue text-white hover:opacity-90 shadow-sm'
                : 'bg-ink-100 text-ink-300 cursor-not-allowed',
            ].join(' ')}
          >
            {status === 'committing' ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/>
                </svg>
                Injecting…
              </>
            ) : (
              '→ Inject into Cognee'
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {status === 'error' && commitError && (
        <p className="text-xs text-cortex-rose">{commitError}</p>
      )}
      {!canCommit && validation && (
        <p className="text-xs text-cortex-rose">Fix validation errors before committing.</p>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const text         = useNeocortex((s) => s.ontologyFileText)
  const setText      = useNeocortex((s) => s.setOntologyFileText)
  const path         = useNeocortex((s) => s.ontologyFilePath)
  const agentStatus  = useNeocortex((s) => s.agentStatus)
  const uploadStatus = useNeocortex((s) => s.ontologyUploadStatus)
  const setPage      = useNeocortex((s) => s.setPage)

  const [isDirty, setIsDirty] = useState(false)
  const [charCount, setCharCount] = useState(text.length)

  useEffect(() => { setCharCount(text.length) }, [text])

  function handleChange(v) {
    setText(v)
    setIsDirty(true)
  }

  const hasContent = text.trim().length > 0
  const source = agentStatus === 'done' ? 'generated'
               : uploadStatus === 'done' ? 'uploaded'
               : null

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-ink-300">
            <path d="M9 12l2 2 4-4M7 7h10M7 12h3M7 17h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-ink-700">No ontology loaded</p>
          <p className="text-sm text-ink-400 mt-1">
            Upload a .ttl / .owl file or run the generation pipeline
          </p>
        </div>
        <button
          onClick={() => setPage('ontology')}
          className="px-5 py-2 rounded-lg bg-cortex-blue text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          ← Go to Pipeline
        </button>
      </div>
    )
  }

  const filename = path ? path.split('/').pop() : 'ontology.ttl'

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-ink-100/10 bg-surface-100/70 backdrop-blur-sm
                      flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cortex-purple-tint flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-cortex-purple">
              <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 5h8M4 8h8M4 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="page-title">{filename}</h1>
            <p className="text-xs text-ink-400 font-mono truncate">{path || '/ontologies/ontology.ttl'}</p>
          </div>
          {source && (
            <span className={`badge shrink-0 ${source === 'uploaded' ? 'badge-blue' : 'badge-green'}`}>
              {source === 'uploaded' ? '↑ uploaded' : '⚡ generated'}
            </span>
          )}
          {isDirty && <span className="badge-amber shrink-0">Unsaved changes</span>}
        </div>

        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-ink-400 shrink-0">
          <span>{charCount.toLocaleString()} chars</span>
          <span>{text.split('\n').length} lines</span>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 min-h-0 flex gap-0">
        {/* Editor */}
        <div className="flex-1 min-w-0 border-r border-ink-100/10 bg-surface-50 flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-ink-100/10 bg-surface-100 flex items-center gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-amber-400/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
            </div>
            <span className="text-[11px] font-mono text-ink-400 ml-2">Turtle / OWL · editable</span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
            <CodeEditor value={text} onChange={handleChange} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 shrink-0 flex flex-col min-h-0 overflow-auto scrollbar-thin p-5 space-y-6 bg-surface-100">
          <ValidationPanel />
          <div className="divider" />
          <CommitPanel />
        </div>
      </div>
    </div>
  )
}
