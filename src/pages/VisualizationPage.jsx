import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNeocortex } from '../store/useNeocortex.js'
import { mcp } from '../api/mcpClient.js'
import EntityPanel from '../components/visualization/EntityPanel.jsx'

export default function VisualizationPage() {
  const mcpConnected = useNeocortex((s) => s.mcpStatus === 'connected')
  const mcpSessionId = useNeocortex((s) => s.mcpSessionId)
  const extractedEntities = useNeocortex((s) => s.extractedEntities)
  const graphLoading = useNeocortex((s) => s.graphLoading)
  const graphError = useNeocortex((s) => s.graphError)
  const graphHTML = useNeocortex((s) => s.graphHTML)

  const loadGraph = useNeocortex((s) => s.loadVisualizationGraph)
  const setPage = useNeocortex((s) => s.setPage)

  const [selectedEntity, setSelectedEntity] = useState(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (mcpConnected && !graphHTML && !graphLoading) {
      loadGraph()
    }
  }, [mcpConnected, graphHTML, graphLoading, loadGraph])

  const filteredEntities = filterType === 'all'
    ? extractedEntities
    : extractedEntities.filter((e) => e.type === filterType)

  const entityTypes = ['all', ...new Set(extractedEntities.map((e) => e.type))]

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-ink-50 to-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Knowledge Graph</h1>
            <p className="page-sub mt-0.5">
              {mcpConnected
                ? 'Interactive visualization of extracted entities and relationships'
                : 'Connect Cognee to visualize the knowledge graph'}
            </p>
          </div>
          {mcpConnected && (
            <div className="flex items-center gap-3">
              <button
                onClick={loadGraph}
                disabled={graphLoading}
                className={[
                  'px-3 py-2 text-sm font-medium rounded-lg transition',
                  graphLoading
                    ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                    : 'bg-cortex-blue text-white hover:opacity-90',
                ].join(' ')}
              >
                {graphLoading ? '⟳ Loading…' : '↻ Reload Graph'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connection warning */}
      {!mcpConnected && (
        <div className="px-6 pt-4 pb-0">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200
                          flex items-center justify-between gap-3 text-sm">
            <span className="text-cortex-amber">
              ⚠ Connect Cognee to load the knowledge graph visualization
            </span>
            <button
              onClick={() => setPage('memory')}
              className="shrink-0 text-xs font-medium text-cortex-amber underline underline-offset-2 whitespace-nowrap"
            >
              Connect Now →
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Graph container */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-ink-100">
          {graphError && (
            <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
              Failed to load graph: {graphError}
            </div>
          )}

          {graphLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cortex-blue animate-pulse" />
                  <span className="text-ink-600 font-medium">Generating graph visualization…</span>
                </div>
                <p className="text-xs text-ink-400">This may take a moment on large datasets</p>
              </div>
            </div>
          )}

          {graphHTML && mcpConnected && (
            <iframe
              src={graphHTML}
              className="flex-1 border-0"
              title="Cognee Knowledge Graph"
              allow="clipboard-read; clipboard-write"
            />
          )}

          {!graphHTML && !graphLoading && mcpConnected && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-ink-500">Graph visualization not yet loaded</p>
                <button
                  onClick={loadGraph}
                  className="px-4 py-2 rounded-lg bg-cortex-blue text-white text-sm
                             hover:opacity-90 transition"
                >
                  Load Graph
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Entity panel */}
        {mcpConnected && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 border-l border-ink-100 bg-white flex flex-col overflow-hidden"
            >
              <EntityPanel
                entities={filteredEntities}
                entityTypes={entityTypes}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                filterType={filterType}
                onFilterChange={setFilterType}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
