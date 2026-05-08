import { create } from 'zustand'
import { connectivityAPI } from '../api/connectivity.js'
import { mcpClient, mcp } from '../api/mcpClient.js'

// ── Agent log lines ──────────────────────────────────────────────────────────
const AGENT_LOG = [
  { id: 1,  t: 80,   text: 'Reading preprocessed data sources…',                kind: 'info'    },
  { id: 2,  t: 700,  text: 'Extracting named entities (NLP pass 1)…',           kind: 'info'    },
  { id: 3,  t: 1400, text: 'Resolving co-references across documents…',          kind: 'info'    },
  { id: 4,  t: 2100, text: 'Classifying entity types → 9 classes found',        kind: 'success' },
  { id: 5,  t: 2800, text: 'Inferring relationships (semantic similarity ≥ 0.8)',kind: 'info'    },
  { id: 6,  t: 3500, text: '42 relationships mapped across 6 domains',           kind: 'success' },
  { id: 7,  t: 4000, text: 'Building class hierarchy (rdfs:subClassOf)…',       kind: 'info'    },
  { id: 8,  t: 4600, text: 'Detecting redundant / conflicting axioms…',          kind: 'warn'    },
  { id: 9,  t: 5200, text: 'Resolved 3 conflicts via domain-rule priority',      kind: 'success' },
  { id: 10, t: 5900, text: 'Serialising → ontology.ttl',                         kind: 'info'    },
  { id: 11, t: 6400, text: '✓ Ontology committed · /ontologies/ontology.ttl',   kind: 'done' },
]

// ── Preprocessing step labels ────────────────────────────────────────────────
export const PREPROCESS_STEPS = ['Parse', 'Clean', 'Embed', 'Classify', 'Map']
const STEP_DURATION = 900  // ms per step per file

// ── Mock agent chat responses ────────────────────────────────────────────────
const MOCK_RESPONSES = [
  {
    text: 'Based on the current ontology and memory layer, Policy 2026-Q2 introduces a mandatory subprocessor clause under GDPR Art. 28. This affects 12 of 42 EU contracts that require re-signature. No impact on US contracts or SMB segment.',
    sources: [
      { layer: 'Cognee',   entity: 'Policy 2026-Q2',  confidence: 0.97 },
      { layer: 'Cognee',   entity: 'EU Contracts',     confidence: 0.93 },
      { layer: 'GraphRAG', entity: 'Legal & Compliance cluster', confidence: 0.88 },
    ],
    tokensRaw: 11840, tokensFiltered: 1920,
  },
  {
    text: 'The GDPR compliance timeline shows three key milestones: breach notification window dropped to 72h (2025-Q1), cross-border transfers now require DPA v2 (2025-Q4), and the new subprocessor obligation under Art. 28 (2026-Q2). All EU contracts have been automatically annotated.',
    sources: [
      { layer: 'Cognee',   entity: 'GDPR',            confidence: 0.95 },
      { layer: 'Cognee',   entity: 'DPA v2',           confidence: 0.84 },
      { layer: 'GraphRAG', entity: 'Legal & Compliance cluster', confidence: 0.91 },
    ],
    tokensRaw: 14200, tokensFiltered: 2360,
  },
  {
    text: 'Enterprise customers are subject to SLA Premium which includes a 99.9% uptime SLA and dedicated support. SMB customers fall under SLA Standard. Both segments are currently compliant with Policy Q2 requirements after the latest annex propagation.',
    sources: [
      { layer: 'Cognee',   entity: 'Enterprise Seg',   confidence: 0.89 },
      { layer: 'GraphRAG', entity: 'Commercial cluster',confidence: 0.82 },
      { layer: 'GraphRAG', entity: 'Customer Segments', confidence: 0.78 },
    ],
    tokensRaw: 9600, tokensFiltered: 1640,
  },
]

let responseIdx = 0

// ── Entity type inference ────────────────────────────────────────────────────
function inferEntityType(text) {
  const lower = text.toLowerCase()
  if (/policy|regulation|gdpr|dpa|requirement/.test(lower)) return 'Policy'
  if (/contract|agreement|sla|nda|mou/.test(lower)) return 'Contract'
  if (/person|customer|employee|user|officer|ceo|director/.test(lower)) return 'Person'
  if (/company|organization|firm|corporation|enterprise|segment/.test(lower)) return 'Organization'
  if (/location|country|region|city|area|eu|us|uk/.test(lower)) return 'Location'
  if (/event|milestone|date|quarter|year|phase/.test(lower)) return 'Event'
  return 'Concept'
}

function _parseTurtleStats(ttl) {
  const count = (re) => (ttl.match(re) || []).length
  const classes     = count(/\ba\s+owl:Class\b/g)
  const objProps    = count(/\ba\s+owl:ObjectProperty\b/g)
  const dataProps   = count(/\ba\s+owl:DatatypeProperty\b/g)
  return { classes, objProps, dataProps }
}

export const useNeocortex = create((set, get) => ({

  // ── Page routing ────────────────────────────────────────────────────────────
  page: 'ontology',
  setPage: (p) => set({ page: p }),

  // ── Ingested files (per-file preprocessing) ─────────────────────────────────
  ingestedFiles: [],

  addFiles: (rawFiles) => {
    const newFiles = rawFiles.map((f, i) => ({
      id:       `${Date.now()}-${i}`,
      file:     f,
      name:     f.name,
      size:     f.size,
      type:     f.type || 'application/octet-stream',
      steps:    PREPROCESS_STEPS.map((s) => ({ label: s, status: 'queued', progress: 0 })),
      done:     false,
      addedAt:  Date.now(),
    }))
    set((s) => ({ ingestedFiles: [...s.ingestedFiles, ...newFiles] }))
    newFiles.forEach((f) => get()._runPreprocess(f.id))
  },

  _runPreprocess: async (fileId) => {
    for (let si = 0; si < PREPROCESS_STEPS.length; si++) {
      // Mark step active
      set((s) => ({
        ingestedFiles: s.ingestedFiles.map((f) =>
          f.id !== fileId ? f : {
            ...f,
            steps: f.steps.map((st, i) =>
              i === si ? { ...st, status: 'active', progress: 10 } : st
            ),
          }
        ),
      }))

      // Animate progress 10 → 100
      for (let p = 20; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, STEP_DURATION / 5))
        set((s) => ({
          ingestedFiles: s.ingestedFiles.map((f) =>
            f.id !== fileId ? f : {
              ...f,
              steps: f.steps.map((st, i) =>
                i === si ? { ...st, progress: p } : st
              ),
            }
          ),
        }))
      }

      // Mark step done
      set((s) => ({
        ingestedFiles: s.ingestedFiles.map((f) =>
          f.id !== fileId ? f : {
            ...f,
            steps: f.steps.map((st, i) =>
              i === si ? { ...st, status: 'done', progress: 100 } : st
            ),
          }
        ),
      }))
    }

    // Mark file done
    set((s) => ({
      ingestedFiles: s.ingestedFiles.map((f) =>
        f.id !== fileId ? f : { ...f, done: true }
      ),
    }))

    // Check if ALL files are done → auto-run agent
    const all = get().ingestedFiles
    if (all.every((f) => f.done) && get().agentStatus === 'idle') {
      await new Promise((r) => setTimeout(r, 600))
      get().runOntologyAgent()
    }
  },

  clearFiles: () => set({ ingestedFiles: [] }),

  // ── Ontology Agent ───────────────────────────────────────────────────────────
  agentStatus: 'idle',      // 'idle' | 'running' | 'done' | 'error'
  agentLog:    [],
  ontologyFile: null,
  ontologyFilePath: null,
  ontologyFileText: '',     // editable string for ReviewPage
  ontologyStats: null,      // { concepts, relations, classes, individuals }

  _appendAgentLog: (text, kind = 'info') =>
    set((s) => ({
      agentLog: [...s.agentLog, { id: Date.now() + Math.random(), text, kind }],
    })),

  runOntologyAgent: async () => {
    const pdfFiles = get().ingestedFiles
      .map((f) => f.file)
      .filter((f) => f && f.type === 'application/pdf')

    set({ agentStatus: 'running', agentLog: [] })
    const log = (text, kind = 'info') => get()._appendAgentLog(text, kind)

    log(`Uploading ${pdfFiles.length} PDF file(s) to pipeline…`)
    log('This may take several minutes — the LLM extraction pipeline is running…')

    try {
      const blob = await connectivityAPI.generateOntology(pdfFiles)
      const ttlText = await blob.text()
      const stats = _parseTurtleStats(ttlText)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'ontology.ttl'
      anchor.click()
      URL.revokeObjectURL(url)
      log(`✓ Ontology generated — ${stats.classes} classes, ${stats.objProps + stats.dataProps} properties.`, 'success')
      log('ontology.ttl download started.', 'success')
      set({
        agentStatus:      'done',
        ontologyFileText: ttlText,
        ontologyFilePath: 'ontology.ttl',
        ontologyStats:    stats,
      })
    } catch (err) {
      log(`✗ Pipeline failed: ${err.message}`, 'error')
      set({ agentStatus: 'idle' })
    }
  },

  resetAgent: () => set({
    agentStatus: 'idle', agentLog: [],
    ontologyFile: null, ontologyFilePath: null, ontologyFileText: '', ontologyStats: null,
  }),

  // ── Review / edit ────────────────────────────────────────────────────────────
  setOntologyFileText: (t) => set({ ontologyFileText: t }),

  commitStatus: 'idle',     // 'idle' | 'committing' | 'committed' | 'error'
  commitPath:   '/ontologies/ontology.ttl',
  setCommitPath: (p) => set({ commitPath: p }),

  commitOntology: async () => {
    set({ commitStatus: 'committing' })
    try {
      const text = get().ontologyFileText
      const result = await connectivityAPI.commitOntologyContent(text)
      set({
        commitStatus:     'committed',
        ontologyFilePath: result.path,
        ontologyUploadStatus: 'done',
        ontologyUploadPath:   result.path,
      })
    } catch (err) {
      set({ commitStatus: 'error', commitError: err.message })
    }
  },

  resetCommit: () => set({ commitStatus: 'idle', commitError: null }),

  // ── Validation ───────────────────────────────────────────────────────────────
  validationResult: null,

  validateOntology: async () => {
    set({ validationResult: null })
    await new Promise((r) => setTimeout(r, 400))
    const text = get().ontologyFileText.trim()
    const errors = []
    const warnings = []
    if (!text) {
      errors.push({ msg: 'File is empty.' })
    } else {
      const hasPrefix  = /@prefix\s/i.test(text) || /^PREFIX\s/im.test(text)
      const hasTriple  = /[<\w].*\s+[<\w].*\s+[<\w"'].+\s*[.;,]/.test(text)
      const hasClass   = /owl:Class|rdfs:Class|a\s+owl:Class/i.test(text)
      if (!hasPrefix)  warnings.push({ msg: 'No @prefix / PREFIX declarations found — may not be valid Turtle.' })
      if (!hasTriple)  errors.push({ msg: 'No RDF triples detected — file does not look like Turtle/OWL.' })
      if (!hasClass)   warnings.push({ msg: 'No owl:Class declarations found — ontology may have no types.' })
    }
    set({ validationResult: { errors, warnings, ok: errors.length === 0 } })
  },

  // ── Ontology upload (real) ───────────────────────────────────────────────────
  ontologyUploadStatus: 'idle',   // 'idle' | 'uploading' | 'done' | 'error'
  ontologyUploadPath:   null,
  ontologyUploadError:  null,

  uploadOntologyFile: async (file) => {
    set({ ontologyUploadStatus: 'uploading', ontologyUploadError: null })
    try {
      // Read text so the ReviewPage editor can show the uploaded content
      let text = ''
      try { text = await file.text() } catch { /* binary — skip */ }
      const result = await connectivityAPI.uploadOntologyFile(file)
      set({
        ontologyUploadStatus: 'done',
        ontologyUploadPath:   result.path,
        ontologyFilePath:     result.path,
        ...(text ? { ontologyFileText: text, commitStatus: 'idle' } : {}),
      })
    } catch (err) {
      set({ ontologyUploadStatus: 'error', ontologyUploadError: err.message })
    }
  },

  resetOntologyUpload: () => set({
    ontologyUploadStatus: 'idle', ontologyUploadPath: null, ontologyUploadError: null,
  }),

  // ── Cognify data (real — MCP) ────────────────────────────────────────────────
  cognifyRunning: false,
  cognifyLog:     [],             // [{id, text, kind}]
  cognifyQueue:   [],             // [{id, name, status, chars}]

  _appendCognifyLog: (text, kind = 'info') =>
    set((s) => ({
      cognifyLog: [...s.cognifyLog, { id: Date.now() + Math.random(), text, kind }],
    })),

  clearCognifyLog: () => set({ cognifyLog: [], cognifyQueue: [] }),

  cognifyText: async (text, label = 'text input') => {
    const { _appendCognifyLog } = get()
    set({ cognifyRunning: true })
    _appendCognifyLog(`Cognifying "${label}" (${text.length} chars)…`)
    try {
      const result = await connectivityAPI.cognifyData(text)
      _appendCognifyLog(`✓ ${label} ingested into graph`, 'success')
      if (result.response) _appendCognifyLog(String(result.response).slice(0, 120), 'info')
    } catch (err) {
      _appendCognifyLog(`✗ ${label}: ${err.message}`, 'error')
    } finally {
      set({ cognifyRunning: false })
    }
  },

  cognifyFiles: async (files) => {
    const { _appendCognifyLog, cognifyText } = get()
    set({ cognifyRunning: true })
    const TEXT_EXTS = new Set(['.txt', '.md', '.csv', '.json', '.xml', '.html', '.ttl', '.owl'])

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      _appendCognifyLog(`Reading ${file.name}…`)
      try {
        let text
        if (TEXT_EXTS.has(ext)) {
          text = await file.text()
        } else {
          // Binary file — send to backend for extraction
          _appendCognifyLog(`Extracting text from ${file.name} via backend…`)
          const result = await connectivityAPI.extractFileText(file)
          text = result.text
          _appendCognifyLog(`Extracted ${result.chars} chars from ${file.name}`)
        }
        await get().cognifyText(text, file.name)
      } catch (err) {
        _appendCognifyLog(`✗ ${file.name}: ${err.message}`, 'error')
      }
    }
    set({ cognifyRunning: false })
  },

  // ── Cognee connectivity (REST → 8001, MCP → 8002) ───────────────────────────
  cogneeStatus:     'disconnected',
  cogneeStats:      null,
  cogneePingMs:     null,
  mcpStatus:        'disconnected',   // 'disconnected' | 'connecting' | 'connected' | 'error'
  mcpSessionId:     null,

  connectCognee: async () => {
    set({ cogneeStatus: 'syncing', cogneeStats: null, cogneePingMs: null,
          mcpStatus: 'connecting', mcpSessionId: null })

    // 1. MCP session init (port 8002) — primary; required for agent chat
    let mcpOk = false
    try {
      const sessionId = await mcp.connect()
      const displayId = (sessionId && sessionId !== '__stateless__') ? sessionId : null
      set({ mcpStatus: 'connected', mcpSessionId: displayId })
      mcpOk = true
    } catch (mcpErr) {
      console.warn('MCP session init failed:', mcpErr)
      set({ mcpStatus: 'error', mcpSessionId: null })
    }

    // 2. REST health check (port 8001) — optional; only for stats panel
    try {
      const start  = Date.now()
      const health = await connectivityAPI.checkHealth()
      const stats  = health.status === 'connected' ? await connectivityAPI.getGraphStats() : null
      set({
        cogneeStatus: 'connected',
        cogneePingMs: health.pingMs ?? (Date.now() - start),
        cogneeStats: {
          entities:      stats?.entities      ?? health.details?.entities      ?? '—',
          relations:     stats?.relations     ?? health.details?.relations     ?? '—',
          memifiedNodes: stats?.memifiedNodes ?? health.details?.memified_nodes ?? '—',
          ontologyPath:  get().ontologyFilePath || '/ontologies/ontology.ttl',
          lastSync:      new Date().toISOString(),
        },
      })
    } catch {
      // REST unavailable — still mark connected if MCP succeeded
      if (mcpOk) {
        set({
          cogneeStatus: 'connected',
          cogneePingMs: null,
          cogneeStats: {
            entities: '—', relations: '—', memifiedNodes: '—',
            ontologyPath: get().ontologyFilePath || '/ontologies/ontology.ttl',
            lastSync: new Date().toISOString(),
          },
        })
      } else {
        set({ cogneeStatus: 'error', cogneePingMs: null, cogneeStats: null })
      }
    }
  },

  disconnectCognee: () => {
    mcpClient.disconnect()
    set({ cogneeStatus: 'disconnected', cogneeStats: null, cogneePingMs: null,
          mcpStatus: 'disconnected', mcpSessionId: null })
  },

  // ── GraphRAG connectivity ────────────────────────────────────────────────────
  graphragStatus:   'disconnected',
  graphragStats:    null,
  graphragPingMs:   null,
  connectGraphRAG: async () => {
    set({ graphragStatus: 'syncing', graphragStats: null, graphragPingMs: null })
    await new Promise((r) => setTimeout(r, 1900))
    set({
      graphragStatus: 'connected', graphragPingMs: 62,
      graphragStats: { communities: 18, nodes: 634, edges: 2291, lastIndex: new Date().toISOString() },
    })
  },
  disconnectGraphRAG: () => set({ graphragStatus: 'disconnected', graphragStats: null, graphragPingMs: null }),

  // ── Agent chat ───────────────────────────────────────────────────────────────
  chatMessages: [],
  chatLoading:  false,
  chatError:    null,

  sendMessage: async (text) => {
    const userMsg = { id: Date.now(), role: 'user', text, ts: new Date() }
    set((s) => ({ chatMessages: [...s.chatMessages, userMsg], chatLoading: true, chatError: null }))

    const mcpReady = get().mcpStatus === 'connected'

    if (mcpReady) {
      try {
        const raw = await mcp.search(text)
        const tokensRaw      = Math.round(raw.length / 4)
        const tokensFiltered = Math.round(tokensRaw * 0.18)
        const agentMsg = {
          id:             Date.now() + 1,
          role:           'agent',
          text:           raw,
          sources:        [{ layer: 'Cognee', entity: 'Graph search', confidence: null }],
          tokensRaw,
          tokensFiltered,
          ts:             new Date(),
        }
        set((s) => ({ chatMessages: [...s.chatMessages, agentMsg], chatLoading: false }))
        get().extractEntitiesFromMessages()
      } catch (err) {
        const errMsg = {
          id:   Date.now() + 1,
          role: 'agent',
          text: `Search failed: ${err.message}`,
          error: true,
          ts:   new Date(),
        }
        set((s) => ({ chatMessages: [...s.chatMessages, errMsg], chatLoading: false, chatError: err.message }))
      }
    } else {
      // Fallback to mock when MCP not connected
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
      const resp = MOCK_RESPONSES[responseIdx % MOCK_RESPONSES.length]
      responseIdx++
      const agentMsg = { id: Date.now() + 1, role: 'agent', ...resp, ts: new Date(), mock: true }
      set((s) => ({ chatMessages: [...s.chatMessages, agentMsg], chatLoading: false }))
      get().extractEntitiesFromMessages()
    }
  },

  clearChat: () => set({ chatMessages: [], chatError: null, extractedEntities: [] }),

  // ── Graph visualization ──────────────────────────────────────────────────────
  graphHTML:       null,
  graphLoading:    false,
  graphError:      null,
  extractedEntities: [],

  loadVisualizationGraph: async () => {
    set({ graphLoading: true, graphError: null })
    try {
      const response = await mcp.visualizeGraph()
      // Response contains path/URL to the generated HTML file
      // MCP returns: /graph/cognee_graph.html or http://localhost:8000/graph/cognee_graph.html
      let graphUrl = response.trim()

      // Convert to relative path for Vite proxy in dev mode
      if (graphUrl.includes('localhost:8000') || graphUrl.includes('/graph/')) {
        graphUrl = graphUrl.includes('/graph/')
          ? graphUrl.substring(graphUrl.indexOf('/graph/'))
          : '/graph/cognee_graph.html'
      }

      set({ graphHTML: graphUrl || '/graph/cognee_graph.html', graphLoading: false })
    } catch (err) {
      set({ graphError: err.message, graphLoading: false })
      console.error('Failed to load graph:', err)
    }
  },

  // ── Entity extraction ────────────────────────────────────────────────────────
  extractEntitiesFromMessages: () => {
    const messages = get().chatMessages
    const entities = new Map()

    messages.forEach((msg) => {
      if (msg.sources?.length > 0) {
        msg.sources.forEach((source) => {
          const key = `${source.layer}:${source.entity}`
          if (!entities.has(key)) {
            entities.set(key, {
              id: key,
              name: source.entity,
              type: inferEntityType(source.entity),
              confidence: source.confidence,
              layer: source.layer,
              description: null,
              metadata: {},
              relationships: [],
            })
          }
        })
      }
    })

    set({ extractedEntities: Array.from(entities.values()) })
  },
}))
