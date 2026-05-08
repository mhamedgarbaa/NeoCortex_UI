import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNeocortex } from '../store/useNeocortex.js'

// ── Ontology Upload Section ──────────────────────────────────────────────────
function OntologyUploadSection() {
  const status    = useNeocortex((s) => s.ontologyUploadStatus)
  const path      = useNeocortex((s) => s.ontologyUploadPath)
  const error     = useNeocortex((s) => s.ontologyUploadError)
  const upload    = useNeocortex((s) => s.uploadOntologyFile)
  const reset     = useNeocortex((s) => s.resetOntologyUpload)
  const [over, setOver] = useState(false)
  const inputRef  = useRef(null)

  function handle(files) {
    const f = files[0]
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['ttl', 'owl'].includes(ext)) {
      alert('Only .ttl and .owl files are supported.')
      return
    }
    upload(f)
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Ontology File</h2>
          <p className="text-xs text-ink-400 mt-0.5">Upload a .ttl or .owl file to replace the active ontology</p>
        </div>
        {status === 'done' && (
          <button onClick={reset} className="text-xs text-ink-400 hover:text-cortex-rose transition">↺ Replace</button>
        )}
      </div>

      {status === 'done' ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cortex-green/10 border border-cortex-green/30">
          <span className="text-cortex-green text-lg">✓</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-cortex-green">Ontology uploaded</p>
            <p className="text-xs font-mono text-ink-500 truncate mt-0.5">{path}</p>
          </div>
        </motion.div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files) }}
          className={[
            'flex items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer',
            'transition-all duration-200 py-7 px-6',
            over ? 'border-cortex-purple bg-cortex-purple/10 scale-[1.01]'
                 : 'border-ink-200/20 hover:border-cortex-purple/50 hover:bg-cortex-purple/5 bg-transparent',
          ].join(' ')}
        >
          <input ref={inputRef} type="file" accept=".ttl,.owl" className="hidden"
                 onChange={(e) => handle(e.target.files)} />
          <div className="w-10 h-10 rounded-xl bg-surface-200/50 flex items-center justify-center shrink-0">
            <span className="text-xs font-mono font-bold text-cortex-purple">OWL</span>
          </div>
          <div className="text-left">
            {status === 'uploading' ? (
              <p className="text-sm font-medium text-cortex-purple animate-pulse">Uploading…</p>
            ) : (
              <>
                <p className="text-sm font-medium text-ink-200">
                  {over ? 'Release to upload' : 'Drop ontology file here'}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">.ttl · .owl — or <span className="text-cortex-purple underline">browse</span></p>
              </>
            )}
            {error && <p className="text-xs text-cortex-rose mt-1">{error}</p>}
          </div>
        </label>
      )}
    </div>
  )
}

// ── Cognify Data Section ─────────────────────────────────────────────────────
function CognifyDataSection() {
  const running  = useNeocortex((s) => s.cognifyRunning)
  const log      = useNeocortex((s) => s.cognifyLog)
  const files_fn = useNeocortex((s) => s.cognifyFiles)
  const text_fn  = useNeocortex((s) => s.cognifyText)
  const clearLog = useNeocortex((s) => s.clearCognifyLog)

  const [over, setOver]   = useState(false)
  const [text, setText]   = useState('')
  const logRef            = useRef(null)
  const inputRef          = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  function handleDrop(fileList) {
    const arr = Array.from(fileList)
    if (arr.length) files_fn(arr)
  }

  function handleText() {
    if (!text.trim()) return
    text_fn(text.trim(), 'text input')
    setText('')
  }

  const kindClass = { info: 'text-ink-400', success: 'text-cortex-green', error: 'text-cortex-rose' }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Cognify Data</h2>
          <p className="text-xs text-ink-400 mt-0.5">
            Upload files or paste text — content is extracted and ingested into the knowledge graph
          </p>
        </div>
        {log.length > 0 && !running && (
          <button onClick={clearLog} className="text-xs text-ink-400 hover:text-cortex-rose transition">
            Clear log
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File drop */}
        <label
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); handleDrop(e.dataTransfer.files) }}
          className={[
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed',
            'cursor-pointer transition-all duration-200 py-8 px-4 text-center',
            running ? 'opacity-50 pointer-events-none' : '',
            over ? 'border-cortex-blue bg-cortex-blue/10 scale-[1.01]'
                 : 'border-ink-200 hover:border-cortex-blue/50 hover:bg-cortex-blue/5 bg-ink-200/5',
          ].join(' ')}
        >
          <input ref={inputRef} type="file" multiple className="hidden"
                 onChange={(e) => handleDrop(e.target.files)} disabled={running} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
               className={over ? 'text-cortex-blue' : 'text-ink-400'}>
            <path d="M4 16l4-4 4 4M12 12V4M8 8l4-4 4 4M4 20h16"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm font-medium text-ink-200">
            {over ? 'Release to cognify' : 'Drop files to cognify'}
          </p>
          <p className="text-xs text-ink-400">PDF · CSV · JSON · TXT · MD · XML</p>
          <span className="text-xs text-cortex-blue underline underline-offset-2">or browse</span>
        </label>

        {/* Text input */}
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={running}
            placeholder="Or paste text, a document excerpt, or any knowledge you want to store in the graph…"
            className={[
              'flex-1 min-h-[140px] resize-none rounded-xl border border-ink-200 bg-ink-200/5 px-4 py-3',
              'text-sm text-ink-200 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-cortex-blue/30',
              'focus:border-cortex-blue transition',
              running ? 'opacity-50' : '',
            ].join(' ')}
          />
          <button
            onClick={handleText}
            disabled={!text.trim() || running}
            className={[
              'w-full py-2.5 rounded-xl text-sm font-medium transition',
              text.trim() && !running
                ? 'bg-cortex-blue text-white hover:bg-blue-700 shadow-sm'
                : 'bg-ink-100 text-ink-400 cursor-not-allowed',
            ].join(' ')}
          >
            {running ? 'Cognifying…' : '▷ Cognify text'}
          </button>
        </div>
      </div>

      {/* Log terminal */}
      <AnimatePresence>
        {log.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div ref={logRef} className="terminal h-36 overflow-auto">
              {log.map((line) => (
                <div key={line.id} className={`flex gap-2 text-xs font-mono ${kindClass[line.kind] || 'text-ink-400'}`}>
                  <span className="opacity-40 select-none">
                    {line.kind === 'success' ? '✓' : line.kind === 'error' ? '✗' : '›'}
                  </span>
                  {line.text}
                </div>
              ))}
              {running && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity }}
                  className="text-cyan-400 text-xs font-mono"
                >█</motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── File type icons ──────────────────────────────────────────────────────────
function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  const colors = { pdf: 'text-red-500', csv: 'text-emerald-600',
                   json: 'text-amber-500', docx: 'text-blue-500', sql: 'text-purple-500' }
  return (
    <span className={`font-mono text-[10px] font-bold uppercase ${colors[ext] || 'text-ink-400'}`}>
      {ext}
    </span>
  )
}

// ── Per-file card ────────────────────────────────────────────────────────────
function FileCard({ file }) {
  const done = file.done
  const activeIdx = file.steps.findIndex((s) => s.status === 'active')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'card p-4 space-y-3 transition-all duration-300',
        done ? 'border-cortex-green/30 bg-cortex-green/5' : '',
      ].join(' ')}
    >
      {/* File header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-ink-100 flex items-center justify-center shrink-0">
            {fileIcon(file.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{file.name}</p>
            <p className="text-xs text-ink-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
        {done
          ? <span className="badge-green shrink-0">✓ Ready</span>
          : activeIdx >= 0
          ? <span className="badge-blue shrink-0 animate-pulse">Processing…</span>
          : <span className="badge-gray shrink-0">Queued</span>
        }
      </div>

      {/* Step pipeline */}
      <div className="space-y-1.5">
        {file.steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <span className={[
              'w-14 text-[10px] font-mono shrink-0',
              step.status === 'done'   ? 'text-cortex-green'
              : step.status === 'active' ? 'text-cortex-blue'
              : 'text-ink-300',
            ].join(' ')}>
              {step.status === 'done' ? '✓' : step.status === 'active' ? '›' : '·'} {step.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <motion.div
                className={[
                  'h-full rounded-full',
                  step.status === 'done'   ? 'bg-cortex-green'
                  : step.status === 'active' ? 'bg-cortex-blue'
                  : 'bg-transparent',
                ].join(' ')}
                initial={{ width: 0 }}
                animate={{ width: `${step.progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-mono text-ink-300 w-8 text-right">
              {step.status === 'done' ? '100%' : step.status === 'active' ? `${step.progress}%` : ''}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Agent log terminal ───────────────────────────────────────────────────────
function AgentTerminal() {
  const log    = useNeocortex((s) => s.agentLog)
  const status = useNeocortex((s) => s.agentStatus)
  const setPage = useNeocortex((s) => s.setPage)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [log])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={[
            'w-2 h-2 rounded-full',
            status === 'running' ? 'bg-cortex-blue animate-pulse'
            : status === 'done'  ? 'bg-cortex-green'
            : 'bg-ink-300',
          ].join(' ')} />
          <span className="section-title">
            {status === 'running' ? 'Agent running…' : status === 'done' ? 'Agent complete' : 'Agent idle'}
          </span>
        </div>
        {status === 'done' && (
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setPage('review')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cortex-purple text-white
                       text-sm font-medium hover:bg-purple-700 transition shadow-sm"
          >
            Review & Edit →
          </motion.button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="terminal h-44 overflow-auto"
      >
        {log.length === 0 && status === 'idle' && (
          <span className="t-info">Waiting for preprocessing to complete…</span>
        )}
        {log.map((line) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex gap-2 t-${line.kind}`}
          >
            <span className="opacity-40 select-none">
              {line.kind === 'success' ? '✓' : line.kind === 'warn' ? '⚠' : line.kind === 'done' ? '●' : '›'}
            </span>
            {line.text}
          </motion.div>
        ))}
        {status === 'running' && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.55, repeat: Infinity }}
            className="text-cyan-400"
          >█</motion.span>
        )}
      </div>
    </div>
  )
}

// ── Drop zone ────────────────────────────────────────────────────────────────
function DropZone({ onFiles }) {
  const [over, setOver] = useState(false)
  const inputRef = useRef(null)

  function handle(list) {
    const arr = Array.from(list)
    if (arr.length) onFiles(arr)
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files) }}
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed',
        'cursor-pointer transition-all duration-200 py-12 px-8 text-center',
        over
          ? 'border-cortex-blue bg-cortex-blue/10 scale-[1.01]'
          : 'border-ink-200/20 hover:border-cortex-blue/50 hover:bg-cortex-blue/5 bg-transparent',
      ].join(' ')}
    >
      <input ref={inputRef} type="file" multiple className="hidden"
             onChange={(e) => handle(e.target.files)} />
      <div className={[
        'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
        over ? 'bg-cortex-blue/10' : 'bg-surface-200/50',
      ].join(' ')}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             className={over ? 'text-cortex-blue' : 'text-ink-400'}>
          <path d="M4 16l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 20h16M12 12V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-ink-200">
          {over ? 'Release to ingest' : 'Drop enterprise data here'}
        </p>
        <p className="text-xs text-ink-400 mt-1">
          CSV · JSON · PDF · DOCX · SQL · REST endpoint
        </p>
      </div>
      <span className="text-xs text-cortex-blue font-medium underline underline-offset-2">
        or browse files
      </span>
    </label>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function OntologyPage() {
  const files        = useNeocortex((s) => s.ingestedFiles)
  const addFiles     = useNeocortex((s) => s.addFiles)
  const clearFiles   = useNeocortex((s) => s.clearFiles)
  const resetAgent   = useNeocortex((s) => s.resetAgent)
  const agentStatus  = useNeocortex((s) => s.agentStatus)
  const runAgent     = useNeocortex((s) => s.runOntologyAgent)
  const ontologyStats = useNeocortex((s) => s.ontologyStats)

  const allDone = files.length > 0 && files.every((f) => f.done)

  function handleReset() {
    clearFiles()
    resetAgent()
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Ontology Pipeline</h1>
          <p className="page-sub mt-1">
            Ingest enterprise data → preprocess → generate ontology file
          </p>
        </div>
        {files.length > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-ink-400 hover:text-cortex-rose transition font-medium"
          >
            ↺ Reset pipeline
          </button>
        )}
      </div>

      {/* Ontology upload */}
      <OntologyUploadSection />

      {/* Flow indicator */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: 'Ingest',        done: files.length > 0,  active: files.length === 0,   color: 'blue'   },
          { label: 'Preprocess',    done: allDone,            active: files.length > 0 && !allDone, color: 'blue' },
          { label: 'Generate',      done: agentStatus === 'done', active: allDone && agentStatus !== 'done', color: 'purple' },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            {i > 0 && <div className="w-8 h-px bg-ink-200" />}
            <div className={[
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
              step.done   ? 'bg-emerald-900/30 text-cortex-green border-cortex-green/30'
              : step.active ? `bg-cortex-${step.color}/20 text-cortex-${step.color} border-cortex-${step.color}/30 animate-pulse`
              : 'bg-ink-100/30 text-ink-400 border-ink-200/30',
            ].join(' ')}>
              {step.done ? '✓' : step.active ? '…' : '○'} {step.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* LEFT: Ingest + file list */}
        <div className="space-y-4">
          <h2 className="section-title">01 · Data Sources</h2>

          <DropZone onFiles={addFiles} />

          <AnimatePresence initial={false}>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="section-title">{files.length} file{files.length !== 1 ? 's' : ''} · {files.filter(f => f.done).length} ready</span>
                </div>
                {files.map((f) => <FileCard key={f.id} file={f} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Agent + output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">02 · Ontology Agent</h2>
            {allDone && agentStatus === 'idle' && (
              <button
                onClick={runAgent}
                className="text-xs px-3 py-1.5 rounded-lg bg-cortex-blue text-white
                           font-medium hover:bg-blue-700 transition"
              >
                ▷ Run manually
              </button>
            )}
          </div>

          <div className="card p-5">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-ink-300">
                    <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v4m0 4v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm text-ink-400">
                  Ingest data first — agent starts automatically after preprocessing
                </p>
              </div>
            ) : (
              <AgentTerminal />
            )}
          </div>

          {/* Stats after generation */}
          <AnimatePresence>
            {agentStatus === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <p className="section-title mb-3">Generated Ontology · Summary</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Classes',     value: ontologyStats?.classes    ?? '—', color: 'text-cortex-blue'   },
                    { label: 'Obj Props',   value: ontologyStats?.objProps   ?? '—', color: 'text-cortex-purple' },
                    { label: 'Data Props',  value: ontologyStats?.dataProps  ?? '—', color: 'text-cortex-cyan'   },
                    { label: 'Properties',  value: ontologyStats ? ontologyStats.objProps + ontologyStats.dataProps : '—', color: 'text-cortex-amber' },
                    { label: 'Conflicts',   value: 0,                                color: 'text-cortex-green'  },
                  ].map((s) => (
                    <div key={s.label} className="card-inset p-3 text-center">
                      <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cognify data */}
      <CognifyDataSection />

    </div>
  )
}
