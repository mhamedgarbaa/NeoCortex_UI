import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeader from '../ui/SectionHeader.jsx'
import FileUploader from './FileUploader.jsx'
import PipelineTracker from './PipelineTracker.jsx'
import OntologyAgent from './OntologyAgent.jsx'
import OntologyFilePreview from './OntologyFilePreview.jsx'
import ParticleFlow from '../ui/ParticleFlow.jsx'
import { useNeocortex } from '../../store/useNeocortex.js'

const STEPS = [
  { id: 'ingest',  label: '01 · Ingest'   },
  { id: 'preprocess', label: '02 · Preprocess' },
  { id: 'agent',   label: '03 · Generate' },
]

export default function OntologyPanel() {
  const agentStatus = useNeocortex((s) => s.agentStatus)
  const [section, setSection] = useState('agent')

  // Auto-advance section indicator as work progresses
  const allSteps = useNeocortex((s) => s.ontologySteps)
  const pipelineDone = allSteps.every((s) => s.status === 'done')

  const activeStep =
    agentStatus === 'done' ? 'agent'
    : pipelineDone         ? 'agent'
    : 'preprocess'

  return (
    <div className="panel h-full flex flex-col">
      <SectionHeader
        tone="blue"
        title="Structure Cortex"
        subtitle="Ontology · generation pipeline"
        right={<span className="chip text-cortex-blue border-cortex-blue/30">Layer 01</span>}
      />

      {/* Step breadcrumb */}
      <div className="flex items-center gap-0 border-b border-white/5 bg-void-700/20">
        {STEPS.map((s, i) => {
          const isActive = s.id === activeStep
          const isDone   =
            (s.id === 'ingest'      && true) ||
            (s.id === 'preprocess'  && pipelineDone) ||
            (s.id === 'agent'       && agentStatus === 'done')
          return (
            <div key={s.id} className="flex items-center">
              {i > 0 && (
                <span className="text-[10px] text-ink-400 font-mono px-0.5">›</span>
              )}
              <button
                onClick={() => setSection(s.id)}
                className={[
                  'px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition',
                  isActive
                    ? 'text-cortex-blue'
                    : isDone
                    ? 'text-cortex-green'
                    : 'text-ink-400 hover:text-ink-200',
                ].join(' ')}
              >
                {isDone && !isActive ? '✓ ' : ''}{s.label}
              </button>
            </div>
          )
        })}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-neural">
        {/* ── 01: Ingest ────────────────────────────────── */}
        <div className="border-b border-white/5">
          <button
            onClick={() => setSection(section === 'ingest' ? null : 'ingest')}
            className="w-full flex items-center justify-between px-3.5 py-2
                       text-[10px] font-mono uppercase tracking-[0.2em] text-ink-200
                       hover:bg-white/3 transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-cortex-blue">01</span> Data Ingestion
            </span>
            <span className="text-ink-400">{section === 'ingest' ? '−' : '+'}</span>
          </button>
          <AnimatePresence initial={false}>
            {section === 'ingest' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <FileUploader />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 02: Preprocess ────────────────────────────── */}
        <div className="border-b border-white/5">
          <button
            onClick={() => setSection(section === 'preprocess' ? null : 'preprocess')}
            className="w-full flex items-center justify-between px-3.5 py-2
                       text-[10px] font-mono uppercase tracking-[0.2em] text-ink-200
                       hover:bg-white/3 transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-cortex-blue">02</span> Preprocessing Pipeline
            </span>
            <span className="text-ink-400">{section === 'preprocess' ? '−' : '+'}</span>
          </button>
          <AnimatePresence initial={false}>
            {section === 'preprocess' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <PipelineTracker />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 03: Agent + File Output ───────────────────── */}
        <div className="border-b border-white/5">
          <button
            onClick={() => setSection(section === 'agent' ? null : 'agent')}
            className="w-full flex items-center justify-between px-3.5 py-2
                       text-[10px] font-mono uppercase tracking-[0.2em] text-ink-200
                       hover:bg-white/3 transition"
          >
            <span className="flex items-center gap-2">
              <span className={agentStatus === 'done' ? 'text-cortex-green' : 'text-cortex-blue'}>03</span>
              Ontology Agent
              {agentStatus === 'running' && (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-cortex-cyan"
                >●</motion.span>
              )}
            </span>
            <span className="text-ink-400">{section === 'agent' ? '−' : '+'}</span>
          </button>
          <AnimatePresence initial={false}>
            {section === 'agent' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <OntologyAgent />
                <OntologyFilePreview />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Flow hint ─────────────────────────────────── */}
        <div className="px-3.5 py-3 space-y-2">
          <p className="text-[10px] font-mono text-ink-400 leading-relaxed">
            The generated <span className="text-cortex-green font-semibold">enterprise_ontology.jsonld</span> file path
            is consumed by <span className="text-cortex-purple">Cognee</span> in the Memory layer
            for memification and graph traversal optimisation.
          </p>
        </div>
      </div>

      <ParticleFlow direction="horizontal" tone="blue" count={5} speed={3.5} />
    </div>
  )
}
