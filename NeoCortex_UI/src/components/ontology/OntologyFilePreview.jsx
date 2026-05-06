import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'
import GlowButton from '../ui/GlowButton.jsx'
import PulseDot from '../ui/PulseDot.jsx'

function StatChip({ label, value, tone = 'blue' }) {
  const textTone = {
    blue:   'text-cortex-blue',
    green:  'text-cortex-green',
    purple: 'text-cortex-purple',
    amber:  'text-cortex-amber',
    cyan:   'text-cortex-cyan',
  }[tone] || 'text-cortex-blue'
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-md bg-void-700/60
                    border border-white/8 min-w-[54px]">
      <span className={`text-[15px] font-mono font-semibold ${textTone}`}>{value}</span>
      <span className="text-[9px] font-mono uppercase tracking-wider text-ink-300 mt-0.5">{label}</span>
    </div>
  )
}

// Lightweight JSON syntax highlighter
function JsonHighlight({ obj }) {
  const lines = JSON.stringify(obj, null, 2).split('\n')
  return (
    <div className="font-mono text-[10.5px] leading-[1.7]">
      {lines.map((line, i) => {
        const highlighted = line
          // string values
          .replace(/"([^"]+)":\s/g, (_, k) => `<span class="text-cortex-blue">"${k}"</span>: `)
          // boolean / number values
          .replace(/:\s(-?\d+\.?\d*|true|false)/g, (_, v) => `: <span class="text-cortex-amber">${v}</span>`)
          // standalone strings
          .replace(/: "([^"]+)"/g, (_, v) => `: <span class="text-cortex-green">"${v}"</span>`)
          // brackets / punctuation
          .replace(/([{}[\]])/g, '<span class="text-ink-300">$1</span>')
        return (
          <div
            key={i}
            className="whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        )
      })}
    </div>
  )
}

export default function OntologyFilePreview() {
  const file     = useNeocortex((s) => s.ontologyFile)
  const path     = useNeocortex((s) => s.ontologyFilePath)
  const status   = useNeocortex((s) => s.agentStatus)
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  if (status !== 'done' || !file) return null

  const meta = file._meta

  function copyPath() {
    navigator.clipboard.writeText(path).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-3.5 pb-3 space-y-2"
    >
      {/* File path banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                      bg-cortex-green/8 border border-cortex-green/25">
        <PulseDot tone="green" size={7} />
        <span className="font-mono text-[11px] text-cortex-green flex-1 truncate">
          {path}
        </span>
        <button
          onClick={copyPath}
          className="shrink-0 text-[10px] font-mono text-ink-300 hover:text-cortex-green
                     transition px-2 py-0.5 rounded border border-white/8 hover:border-cortex-green/30"
        >
          {copied ? '✓ copied' : 'copy path'}
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 flex-wrap">
        <StatChip label="Nodes"      value={meta.totalNodes}  tone="blue"   />
        <StatChip label="Edges"      value={meta.totalEdges}  tone="purple" />
        <StatChip label="Classes"    value={meta.classes}     tone="cyan"   />
        <StatChip label="Individuals"value={meta.individuals} tone="green"  />
        <StatChip label="Conflicts"  value={`${meta.resolved}/${meta.conflicts}`} tone="amber" />
      </div>

      {/* File viewer */}
      <div className="rounded-lg border border-white/8 bg-void-900/80 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5
                        border-b border-white/6 bg-void-700/40">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-300">
              enterprise_ontology.jsonld
            </span>
            <span className="chip text-cortex-green border-cortex-green/30">JSON-LD</span>
          </div>
          <GlowButton tone="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? '− collapse' : '+ expand'}
          </GlowButton>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 180 }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 h-[180px] overflow-auto scrollbar-neural">
                <JsonHighlight obj={file} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generation timestamp */}
      <p className="text-[10px] font-mono text-ink-400 pl-1">
        Generated {meta.generated} · agent {meta.agent}
      </p>
    </motion.div>
  )
}
