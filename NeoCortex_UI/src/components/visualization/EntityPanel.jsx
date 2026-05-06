import { motion } from 'framer-motion'

const TYPE_COLORS = {
  Person:     { bg: '#FEF3C7', color: '#B45309', label: '👤' },
  Organization: { bg: '#DBEAFE', color: '#0369A1', label: '🏢' },
  Location:   { bg: '#DCFCE7', color: '#15803D', label: '📍' },
  Event:      { bg: '#F3E8FF', color: '#7C3AED', label: '📅' },
  Concept:    { bg: '#F0F9FF', color: '#0EA5E9', label: '💡' },
  Policy:     { bg: '#FEE2E2', color: '#DC2626', label: '📋' },
  Contract:   { bg: '#FEF3C7', color: '#92400E', label: '📄' },
}

const DEFAULT_TYPE_CONFIG = { bg: '#F3F4F6', color: '#6B7280', label: '🔹' }

export default function EntityPanel({
  entities,
  entityTypes,
  selectedEntity,
  onSelectEntity,
  filterType,
  onFilterChange,
}) {
  const typeConfig = (type) => TYPE_COLORS[type] || DEFAULT_TYPE_CONFIG

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-100 shrink-0">
        <h3 className="text-sm font-semibold text-ink-900 mb-3">
          Extracted Entities ({entities.length})
        </h3>

        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {entityTypes.map((type) => {
            const cfg = typeConfig(type)
            const isActive = filterType === type
            return (
              <button
                key={type}
                onClick={() => onFilterChange(type)}
                className={[
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition',
                  isActive
                    ? 'ring-2 ring-offset-1'
                    : 'opacity-60 hover:opacity-100',
                ].join(' ')}
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  ...(isActive && { boxShadow: `0 0 0 2px ${cfg.color}20` }),
                }}
              >
                {cfg.label} {type === 'all' ? 'All' : type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Entity list */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {entities.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-xs text-ink-400 text-center">
              No entities extracted yet. Process documents to build the knowledge graph.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {entities.map((entity) => {
              const cfg = typeConfig(entity.type)
              const isSelected = selectedEntity?.id === entity.id
              return (
                <motion.button
                  key={entity.id}
                  onClick={() => onSelectEntity(isSelected ? null : entity)}
                  whileHover={{ x: 2 }}
                  className={[
                    'w-full text-left px-4 py-3 transition-all',
                    isSelected ? 'bg-ink-50' : 'hover:bg-ink-50/50',
                  ].join(' ')}
                >
                  <div className="space-y-1.5">
                    {/* Entity name with type */}
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{cfg.label}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-ink-900 truncate">
                          {entity.name}
                        </p>
                        <p className="text-[10px] text-ink-400">
                          {entity.type}
                          {entity.confidence && (
                            <span className="ml-1 font-mono">
                              · {(entity.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {entity.description && (
                      <p className="text-xs text-ink-600 line-clamp-2 pl-6">
                        {entity.description}
                      </p>
                    )}

                    {/* Metadata */}
                    {isSelected && entity.metadata && Object.keys(entity.metadata).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pl-6 pt-2 border-t border-ink-200 mt-2"
                      >
                        {Object.entries(entity.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-2 text-[10px] py-1">
                            <span className="text-ink-500 font-mono">{key}:</span>
                            <span className="text-ink-700 text-right max-w-xs truncate">
                              {typeof value === 'object'
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Relationships */}
                    {isSelected && entity.relationships?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pl-6 pt-2 border-t border-ink-200 mt-2 space-y-1"
                      >
                        <p className="text-[10px] font-semibold text-ink-600">Relations:</p>
                        {entity.relationships.map((rel, i) => (
                          <div
                            key={i}
                            className="text-[10px] text-ink-600 bg-ink-50 rounded px-2 py-1"
                          >
                            <span className="font-mono text-cortex-blue">{rel.type}</span>
                            {' → '}
                            <span className="font-medium">{rel.target}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="px-4 py-3 border-t border-ink-100 bg-ink-50 text-[10px] text-ink-500 shrink-0">
        <p>Click entities to view details and relationships</p>
      </div>
    </div>
  )
}
