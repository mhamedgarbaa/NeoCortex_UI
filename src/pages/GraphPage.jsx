import { useMemo, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap, Handle, Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { ontologyNodes, ontologyEdges } from '../data/mockOntology.js'

const KIND_CFG = {
  root:   { bg: '#EFF6FF', border: '#2563EB', text: '#1D4ED8', glow: '#2563EB' },
  domain: { bg: '#F5F3FF', border: '#7C3AED', text: '#6D28D9', glow: '#7C3AED' },
  entity: { bg: '#ECFDF5', border: '#059669', text: '#047857', glow: '#059669' },
}

function ConceptNode({ data, selected }) {
  const cfg = KIND_CFG[data.kind] || KIND_CFG.entity
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="rounded-xl px-3.5 py-2.5 shadow-card min-w-[100px] text-center cursor-pointer"
      style={{
        background:   cfg.bg,
        border:       `1.5px solid ${selected ? cfg.glow : cfg.border}`,
        boxShadow:    selected ? `0 0 0 3px ${cfg.glow}33, 0 4px 12px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.07)',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <p className="text-[12px] font-semibold" style={{ color: cfg.text }}>{data.label}</p>
      <p className="text-[10px] font-mono text-ink-400 mt-0.5">{data.count} refs</p>
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  )
}

const nodeTypes = { concept: ConceptNode }

// ── Selected node inspector ──────────────────────────────────────────────────
function Inspector({ node, edges }) {
  if (!node) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
      <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-ink-300">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 7v3m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm text-ink-400">Click a node to inspect</p>
    </div>
  )

  const cfg = KIND_CFG[node.data.kind] || KIND_CFG.entity
  const outgoing = edges.filter((e) => e.source === node.id)
  const incoming = edges.filter((e) => e.target === node.id)

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-5 space-y-4"
    >
      <div
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}
      >
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.glow }} />
        <div>
          <p className="font-semibold text-sm text-ink-900">{node.data.label}</p>
          <p className="text-xs font-mono" style={{ color: cfg.text }}>{node.data.kind}</p>
        </div>
        <span className="ml-auto text-sm font-mono font-semibold" style={{ color: cfg.text }}>
          {node.data.count}
        </span>
      </div>

      {outgoing.length > 0 && (
        <div>
          <p className="section-title mb-2">Outgoing ({outgoing.length})</p>
          <div className="space-y-1">
            {outgoing.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-surface-200">
                <span className="font-mono text-ink-400">{e.label || '→'}</span>
                <span className="text-ink-700 font-medium">{e.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {incoming.length > 0 && (
        <div>
          <p className="section-title mb-2">Incoming ({incoming.length})</p>
          <div className="space-y-1">
            {incoming.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-surface-200">
                <span className="text-ink-700 font-medium">{e.source}</span>
                <span className="font-mono text-ink-400">{e.label || '→'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function GraphPage() {
  const [selected, setSelected] = useState(null)

  const nodes = useMemo(() => ontologyNodes, [])
  const edges = useMemo(() =>
    ontologyEdges.map((e) => ({
      ...e,
      style: {
        stroke: e.label ? '#7C3AED' : '#2563EB',
        strokeWidth: 1.5,
      },
      labelStyle: { fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' },
      labelBgStyle: { fill: 'white', opacity: 0.9 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
    })),
  [])

  const selectedNode = nodes.find((n) => n.id === selected) ?? null

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 bg-white/70 backdrop-blur-sm
                      flex items-center justify-between shrink-0">
        <div>
          <h1 className="page-title">Ontology Graph</h1>
          <p className="page-sub mt-0.5">{nodes.length} concepts · {edges.length} relationships</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#EFF6FF] border border-[#2563EB]" />
            <span className="text-ink-500">Root</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#F5F3FF] border border-[#7C3AED]" />
            <span className="text-ink-500">Domain</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#ECFDF5] border border-[#059669]" />
            <span className="text-ink-500">Entity</span>
          </div>
          <div className="h-4 w-px bg-ink-200" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-px border-t-2 border-cortex-blue" />
            <span className="text-ink-500">subClassOf</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-px border-t-2 border-dashed border-cortex-purple" />
            <span className="text-ink-500">relation</span>
          </div>
        </div>
      </div>

      {/* Graph + inspector */}
      <div className="flex-1 min-h-0 flex">
        {/* Graph */}
        <div className="flex-1 min-w-0 relative bg-surface-100">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, n) => setSelected(n.id)}
            onPaneClick={() => setSelected(null)}
            panOnScroll
            minZoom={0.3}
            maxZoom={2}
          >
            <Background color="#CBD5E1" gap={22} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(n) => KIND_CFG[n.data?.kind]?.glow ?? '#CBD5E1'}
              maskColor="rgba(248,250,255,0.75)"
              style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8 }}
            />
          </ReactFlow>
        </div>

        {/* Inspector panel */}
        <div className="w-72 shrink-0 border-l border-ink-100 bg-white overflow-auto scrollbar-thin">
          <div className="px-4 py-3 border-b border-ink-100">
            <p className="section-title">Node Inspector</p>
          </div>
          <Inspector node={selectedNode} edges={ontologyEdges} />
        </div>
      </div>
    </div>
  )
}
