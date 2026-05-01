import { motion } from 'framer-motion'
import SectionHeader from '../ui/SectionHeader.jsx'
import ConnectivityCard from './ConnectivityCard.jsx'
import ParticleFlow from '../ui/ParticleFlow.jsx'
import { useNeocortex } from '../../store/useNeocortex.js'

export default function MemoryPanel() {
  // Cognee
  const cogneeStatus     = useNeocortex((s) => s.cogneeStatus)
  const cogneeStats      = useNeocortex((s) => s.cogneeStats)
  const cogneePingMs     = useNeocortex((s) => s.cogneePingMs)
  const connectCognee    = useNeocortex((s) => s.connectCognee)
  const disconnectCognee = useNeocortex((s) => s.disconnectCognee)

  // GraphRAG
  const graphragStatus     = useNeocortex((s) => s.graphragStatus)
  const graphragStats      = useNeocortex((s) => s.graphragStats)
  const graphragPingMs     = useNeocortex((s) => s.graphragPingMs)
  const connectGraphRAG    = useNeocortex((s) => s.connectGraphRAG)
  const disconnectGraphRAG = useNeocortex((s) => s.disconnectGraphRAG)

  // Ontology file path from completed agent
  const ontologyFilePath = useNeocortex((s) => s.ontologyFilePath)

  // Format stats objects for display
  const cogneeStatDisplay = cogneeStats ? {
    'entities':        cogneeStats.entities,
    'relations':       cogneeStats.relations,
    'memified nodes':  cogneeStats.memifiedNodes,
    'last sync':       new Date(cogneeStats.lastSync).toLocaleTimeString(),
  } : null

  const graphragStatDisplay = graphragStats ? {
    'communities': graphragStats.communities,
    'nodes':       graphragStats.nodes,
    'edges':       graphragStats.edges,
    'last index':  new Date(graphragStats.lastIndex).toLocaleTimeString(),
  } : null

  const bothConnected = cogneeStatus === 'connected' && graphragStatus === 'connected'

  return (
    <div className="panel h-full flex flex-col">
      <SectionHeader
        tone="purple"
        title="Temporal Cortex"
        subtitle="Memory layer · connectivity"
        right={
          <span className={[
            'chip',
            bothConnected ? 'text-cortex-green border-cortex-green/30' : 'text-ink-300',
          ].join(' ')}>
            {bothConnected ? '● all systems live' : 'Layer 02'}
          </span>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-neural p-3.5 space-y-4">

        {/* Architecture hint */}
        <div className="rounded-lg border border-white/6 bg-void-700/30 px-3.5 py-2.5 space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300">
            Data flow
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-200 flex-wrap">
            <span className="text-cortex-blue">Ontology file</span>
            <span className="text-ink-400">→</span>
            <span className="text-cortex-purple">Cognee memify</span>
            <span className="text-ink-400">→</span>
            <span className="text-cortex-green">GraphRAG index</span>
            <span className="text-ink-400">→</span>
            <span className="text-cortex-cyan">Context Adapter</span>
          </div>
          <p className="text-[10px] text-ink-400 font-mono leading-relaxed">
            Cognee ingests the ontology file at the path below and memifies entities and
            relations for temporal-aware graph traversal. GraphRAG independently indexes
            communities for semantic neighbourhood search.
          </p>
        </div>

        {/* Cognee card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-cortex-purple mb-2 px-0.5">
            ▸ Cognee · Temporal Memory
          </p>
          <ConnectivityCard
            name="Cognee"
            subtitle="graph-based temporal memory · memification"
            accent="purple"
            status={cogneeStatus}
            pingMs={cogneePingMs}
            stats={cogneeStatDisplay}
            ontologyPath={ontologyFilePath || null}
            onConnect={connectCognee}
            onDisconnect={disconnectCognee}
          />
        </motion.div>

        {/* Divider with particle flow */}
        <div className="relative py-1">
          <ParticleFlow direction="horizontal" tone="purple" count={4} speed={4} />
        </div>

        {/* GraphRAG card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-cortex-green mb-2 px-0.5">
            ▸ GraphRAG · Community Memory
          </p>
          <ConnectivityCard
            name="GraphRAG"
            subtitle="community-based knowledge clustering"
            accent="green"
            status={graphragStatus}
            pingMs={graphragPingMs}
            stats={graphragStatDisplay}
            onConnect={connectGraphRAG}
            onDisconnect={disconnectGraphRAG}
          />
        </motion.div>

        {/* MCP note */}
        <div className="rounded-lg border border-cortex-amber/15 bg-cortex-amber/5 px-3.5 py-2.5">
          <p className="text-[10px] font-mono text-cortex-amber uppercase tracking-wider mb-1">
            MCP Integration
          </p>
          <p className="text-[11px] text-ink-200 font-mono leading-relaxed">
            Agents connect via the MCP server. The Context Adapter queries both Cognee
            and GraphRAG through this layer, filters the results, and returns only the
            minimum necessary context to the agent.
          </p>
        </div>
      </div>

      <ParticleFlow direction="horizontal" tone="green" count={5} speed={3.2} />
    </div>
  )
}
