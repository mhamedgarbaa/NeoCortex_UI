import { useMemo, useState } from 'react'
import ReactFlow, {
  Background, Handle, Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { communities, communityLinks } from '../../data/mockGraphRAG.js'

function MemberNode({ data }) {
  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      animate={data.active ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 1.6, repeat: data.active ? Infinity : 0 }}
      className="px-2.5 py-1 rounded-lg backdrop-blur-md border cursor-pointer select-none"
      style={{
        background: `${data.color}14`,
        borderColor: data.active ? `${data.color}` : `${data.color}55`,
        boxShadow: data.active ? `0 0 14px ${data.color}` : `0 0 6px ${data.color}55`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: data.color }} />
      <p className="text-[11px] font-medium" style={{ color: data.color }}>{data.label}</p>
      <Handle type="source" position={Position.Bottom} style={{ background: data.color }} />
    </motion.div>
  )
}

function CommunityCenter({ data }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      className="flex items-center justify-center rounded-full border backdrop-blur-md"
      style={{
        width: 110, height: 110,
        borderColor: `${data.color}66`,
        background: `radial-gradient(circle, ${data.color}22, transparent 70%)`,
        boxShadow: `0 0 30px ${data.color}55`,
      }}
    >
      <span
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-center px-2"
        style={{ color: data.color, transform: 'rotate(0deg)' }}
      >
        {data.name}
      </span>
    </motion.div>
  )
}

const nodeTypes = { member: MemberNode, community: CommunityCenter }

// Radial layout: each community is a hub with members orbiting around it.
function buildLayout(active) {
  const hubPositions = [
    { x: 120, y: 170 },   // legal
    { x: 480, y: 120 },   // commercial
    { x: 820, y: 220 },   // customer
  ]
  const nodes = []
  const edges = []

  communities.forEach((c, ci) => {
    const hub = hubPositions[ci]
    nodes.push({
      id: c.id,
      type: 'community',
      position: hub,
      data: { name: c.name, color: c.color },
      draggable: false,
      selectable: false,
    })

    const n = c.members.length
    c.members.forEach((m, mi) => {
      const angle = (mi / n) * Math.PI * 2 - Math.PI / 2
      const radius = 110
      nodes.push({
        id: m.id,
        type: 'member',
        position: {
          x: hub.x + Math.cos(angle) * radius,
          y: hub.y + Math.sin(angle) * radius,
        },
        data: {
          label: m.label,
          color: c.color,
          active: active === c.id || active === m.id,
        },
      })
      edges.push({
        id: `${c.id}-${m.id}`,
        source: c.id,
        target: m.id,
        style: { stroke: c.color, strokeWidth: 1, opacity: 0.35 },
      })
    })
  })

  communityLinks.forEach((l, i) => {
    edges.push({
      id: `link-${i}`,
      source: l.source,
      target: l.target,
      animated: true,
      style: { stroke: '#22D3EE', strokeWidth: 0.8 + l.weight, opacity: 0.55 },
    })
  })

  return { nodes, edges }
}

export default function CommunityGraph() {
  const [active, setActive] = useState(null)
  const { nodes, edges } = useMemo(() => buildLayout(active), [active])

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-3.5 py-2 flex items-center gap-2 flex-wrap border-b border-white/5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300 mr-1">
          Clusters
        </p>
        {communities.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(active === c.id ? null : c.id)}
            className="px-2 py-0.5 rounded-full text-[10px] font-mono border transition"
            style={{
              color: c.color,
              borderColor: active === c.id ? c.color : `${c.color}44`,
              background: active === c.id ? `${c.color}22` : 'transparent',
              boxShadow: active === c.id ? `0 0 12px ${c.color}55` : 'none',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          panOnScroll
          nodesDraggable={false}
          nodesConnectable={false}
          minZoom={0.5}
          maxZoom={1.5}
          onNodeClick={(_, n) => setActive(n.id)}
        >
          <Background color="#10D9A0" gap={28} size={1} style={{ opacity: 0.2 }} />
        </ReactFlow>
      </div>
    </div>
  )
}
