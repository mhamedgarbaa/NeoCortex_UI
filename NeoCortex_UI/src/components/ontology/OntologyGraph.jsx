import { useMemo } from 'react'
import ReactFlow, {
  Background, Controls, Handle, Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { ontologyNodes, ontologyEdges } from '../../data/mockOntology.js'

const kindStyle = {
  root:   { glow: 'shadow-glow-cyan',   border: 'border-cortex-cyan/50',   text: 'text-cortex-cyan'   },
  domain: { glow: 'shadow-glow-blue',   border: 'border-cortex-blue/50',   text: 'text-cortex-blue'   },
  entity: { glow: 'shadow-glow-purple', border: 'border-cortex-purple/40', text: 'text-cortex-purple' },
}

function ConceptNode({ data }) {
  const s = kindStyle[data.kind] || kindStyle.entity
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className={[
        'px-3 py-1.5 rounded-lg border bg-void-700/90 backdrop-blur',
        'min-w-[92px] text-center cursor-pointer select-none',
        s.border, s.glow,
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} />
      <p className={['text-[11px] font-semibold tracking-wide', s.text].join(' ')}>
        {data.label}
      </p>
      <p className="text-[9px] font-mono text-ink-300">
        {data.count} refs
      </p>
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  )
}

const nodeTypes = { concept: ConceptNode }

const defaultEdgeOptions = {
  style: { stroke: '#22D3EE', strokeWidth: 1.2 },
  animated: true,
}

export default function OntologyGraph() {
  const nodes = useMemo(() => ontologyNodes, [])
  const edges = useMemo(
    () =>
      ontologyEdges.map((e) => ({
        ...e,
        style: { stroke: e.label ? '#A855F7' : '#3B82F6', strokeWidth: 1.2, opacity: 0.85 },
        labelStyle: { fill: '#B8C2E0', fontSize: 9, fontFamily: 'JetBrains Mono' },
        labelBgStyle: { fill: '#0F1424', opacity: 0.85 },
      })),
    []
  )

  return (
    <div className="relative flex-1 min-h-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Background color="#3B82F6" gap={22} size={1} style={{ opacity: 0.25 }} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
