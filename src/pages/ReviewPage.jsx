import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNeocortex } from '../store/useNeocortex.js'

// ── Line-numbered editor ─────────────────────────────────────────────────────
function CodeEditor({ value, onChange }) {
  const lines = value.split('\n')
  return (
    <div className="flex h-full min-h-0 font-mono text-[12.5px] leading-6 overflow-auto scrollbar-thin">
      {/* Line numbers */}
      <div className="select-none px-3 py-4 text-right bg-ink-50 border-r border-ink-100
                      text-ink-300 min-w-[3rem] shrink-0">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Editable area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 py-4 px-4 outline-none resize-none bg-white text-ink-800
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
          className="text-xs px-3 py-1.5 rounded-lg bg-ink-900 text-white font-medium
                     hover:bg-ink-700 transition disabled:opacity-50"
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
              ? <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-cortex-green font-medium">
                  ✓ Valid JSON-LD — no errors found
                </div>
              : result.errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-cortex-rose">
                  <span className="shrink-0 font-bold">✕</span> {e.msg}
                </div>
              ))
            }
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-cortex-amber">
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
function CommitPanel() {
  const path        = useNeocortex((s) => s.commitPath)
  const setPath     = useNeocortex((s) => s.setCommitPath)
  const commit      = useNeocortex((s) => s.commitOntology)
  const status      = useNeocortex((s) => s.commitStatus)
  const resetCommit = useNeocortex((s) => s.resetCommit)
  const validation  = useNeocortex((s) => s.validationResult)

  const canCommit = !validation || validation.ok

  return (
    <div className="space-y-3">
      <span className="section-title">Commit to Cognee</span>

      <div className="space-y-2">
        <label className="text-xs font-medium text-ink-600">Target path</label>
        <input
          className="input font-mono text-xs"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/ontology/enterprise_ontology.jsonld"
        />
      </div>

      <AnimatePresence mode="wait">
        {status === 'committed' ? (
          <motion.div
            key="committed"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cortex-green font-semibold text-sm">
                <span>✓ Committed successfully</span>
              </div>
              <button onClick={resetCommit} className="text-xs text-ink-400 hover:text-ink-600 transition">
                Reset
              </button>
            </div>
            <p className="font-mono text-xs text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
              {path}
            </p>
            <p className="text-xs text-ink-500">
              Cognee will now ingest this path for memification and graph traversal.
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
                Committing…
              </>
            ) : (
              '→ Commit to Cognee'
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {!canCommit && validation && (
        <p className="text-xs text-cortex-rose">Fix validation errors before committing.</p>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const text      = useNeocortex((s) => s.ontologyFileText)
  const setText   = useNeocortex((s) => s.setOntologyFileText)
  const path      = useNeocortex((s) => s.ontologyFilePath)
  const status    = useNeocortex((s) => s.agentStatus)
  const meta      = useNeocortex((s) => s.ontologyFile?._meta)
  const setPage   = useNeocortex((s) => s.setPage)

  const [isDirty, setIsDirty] = useState(false)
  const [charCount, setCharCount] = useState(text.length)

  useEffect(() => { setCharCount(text.length) }, [text])

  function handleChange(v) {
    setText(v)
    setIsDirty(true)
  }

  if (status !== 'done') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-ink-300">
            <path d="M9 12l2 2 4-4M7 7h10M7 12h3M7 17h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-ink-700">No ontology file yet</p>
          <p className="text-sm text-ink-400 mt-1">Run the pipeline on the Ontology page first</p>
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

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-ink-100 bg-white/70 backdrop-blur-sm
                      flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cortex-purple-tint flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-cortex-purple">
              <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 5h8M4 8h8M4 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="page-title">enterprise_ontology.jsonld</h1>
            <p className="text-xs text-ink-400 font-mono truncate">{path}</p>
          </div>
          {isDirty && <span className="badge-amber shrink-0">Unsaved changes</span>}
        </div>

        {meta && (
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-ink-400 shrink-0">
            <span>{charCount.toLocaleString()} chars</span>
            <span>{meta.totalNodes} nodes · {meta.totalEdges} edges</span>
            <span className="text-cortex-green">{meta.resolved}/{meta.conflicts} conflicts resolved</span>
          </div>
        )}
      </div>

      {/* Main split */}
      <div className="flex-1 min-h-0 flex gap-0">
        {/* Editor */}
        <div className="flex-1 min-w-0 border-r border-ink-100 bg-white flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-ink-100 bg-ink-50 flex items-center gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-amber-400/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
            </div>
            <span className="text-[11px] font-mono text-ink-400 ml-2">JSON-LD · editable</span>
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

          {/* Metadata */}
          {meta && (
            <>
              <div className="divider" />
              <div className="space-y-2">
                <span className="section-title">File metadata</span>
                {[
                  ['Generated',  new Date(meta.generated).toLocaleString()],
                  ['Agent',      meta.agent],
                  ['Format',     'JSON-LD / OWL'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-ink-400">{k}</span>
                    <span className="font-mono text-ink-700 text-right max-w-[160px] truncate">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
