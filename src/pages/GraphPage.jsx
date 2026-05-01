import * as d3 from 'd3'
import { AnimatePresence, motion } from 'framer-motion'
import { Parser } from 'n3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNeocortex } from '../store/useNeocortex.js'

// ── RDF namespaces ────────────────────────────────────────────────────────────
const RDF  = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'
const OWL  = 'http://www.w3.org/2002/07/owl#'
const XSD  = 'http://www.w3.org/2001/XMLSchema#'

function shortLabel(uri = '') {
  const idx = Math.max(uri.lastIndexOf('#'), uri.lastIndexOf('/'))
  return idx >= 0 ? uri.substring(idx + 1) : uri
}

// ── TTL → graph data ──────────────────────────────────────────────────────────
function parseTTL(ttlText) {
  let quads
  try { quads = new Parser().parse(ttlText) }
  catch (e) { return { nodes: [], links: [], error: e.message } }

  const labelMap = {}, classes = new Set(), hierarchy = []
  const domainMap = {}, rangeMap = {}, propUris = new Set()

  for (const q of quads) {
    const s = q.subject.value, p = q.predicate.value, o = q.object.value
    if (p === RDFS + 'label' && q.object.termType === 'Literal') labelMap[s] = q.object.value
    if (p === RDF + 'type') {
      if (o === OWL + 'Class' || o === RDFS + 'Class') classes.add(s)
      if (o === OWL + 'ObjectProperty') propUris.add(s)
    }
    if (p === RDFS + 'subClassOf' && q.object.termType === 'NamedNode') {
      classes.add(s); classes.add(o)
      hierarchy.push({ source: s, target: o, type: 'hierarchy', label: 'subClassOf' })
    }
    if (p === RDFS + 'domain') domainMap[s] = o
    if (p === RDFS + 'range' && !o.startsWith(XSD)) rangeMap[s] = o
  }

  const lbl = (u) => labelMap[u] || shortLabel(u)
  const nodeSet = new Set(classes)
  const nodes = Array.from(nodeSet).map((id) => ({ id, label: lbl(id) }))
  const links = [...hierarchy]

  propUris.forEach((p) => {
    const domain = domainMap[p], range = rangeMap[p]
    if (!domain || !range) return
    if (!nodeSet.has(domain)) { nodeSet.add(domain); nodes.push({ id: domain, label: lbl(domain) }) }
    if (!nodeSet.has(range))  { nodeSet.add(range);  nodes.push({ id: range,  label: lbl(range)  }) }
    links.push({ source: p, target: range, type: 'property', label: lbl(p) })
  })

  return { nodes, links, error: null }
}

// ── D3 force graph ────────────────────────────────────────────────────────────
function OntologyForceGraph({ nodes, links, onSelect }) {
  const svgRef  = useRef(null)
  const gRef    = useRef(null)
  const simRef  = useRef(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg  = d3.select(svgRef.current)
    const { width: W, height: H } = svgRef.current.getBoundingClientRect()

    svg.selectAll('*').remove()

    // ── defs: arrowheads ──────────────────────────────────────────────────
    const defs = svg.append('defs')
    const arrow = (id, color) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 14).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', color)
    }
    arrow('arrow-hier', '#3B82F6')
    arrow('arrow-prop', '#8B5CF6')

    // ── root group (zoom target) ──────────────────────────────────────────
    const g = svg.append('g')
    gRef.current = g

    svg.call(
      d3.zoom().scaleExtent([0.1, 4]).on('zoom', (e) => g.attr('transform', e.transform))
    )

    // ── deep-clone data so D3 mutation doesn't corrupt React state ────────
    const nodeData = nodes.map((n) => ({ ...n }))
    const idIndex  = Object.fromEntries(nodeData.map((n) => [n.id, n]))
    const linkData = links.map((l) => ({
      ...l,
      source: idIndex[l.source] ?? l.source,
      target: idIndex[l.target] ?? l.target,
    }))

    // ── simulation ────────────────────────────────────────────────────────
    const sim = d3.forceSimulation(nodeData)
      .force('link',   d3.forceLink(linkData).id((d) => d.id).distance(120).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('x',      d3.forceX(W / 2).strength(0.04))
      .force('y',      d3.forceY(H / 2).strength(0.04))
      .force('collide',d3.forceCollide(60))
    simRef.current = sim

    // ── edges ─────────────────────────────────────────────────────────────
    const linkSel = g.append('g').attr('class', 'links').selectAll('line')
      .data(linkData).join('line')
      .attr('stroke',           (d) => d.type === 'property' ? '#8B5CF6' : '#3B82F6')
      .attr('stroke-width',     1.4)
      .attr('stroke-opacity',   0.7)
      .attr('stroke-dasharray', (d) => d.type === 'property' ? '5,3' : null)
      .attr('marker-end',       (d) => d.type === 'property' ? 'url(#arrow-prop)' : 'url(#arrow-hier)')

    // ── edge labels ───────────────────────────────────────────────────────
    const linkLabelSel = g.append('g').attr('class', 'link-labels').selectAll('text')
      .data(linkData.filter((l) => l.type === 'property')).join('text')
      .attr('font-size', 9)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#8B5CF6')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text((d) => d.label)

    // ── nodes ─────────────────────────────────────────────────────────────
    const NODE_RX = 6, NODE_PY = 6, NODE_PX = 12
    const FS = 11

    const nodeSel = g.append('g').attr('class', 'nodes').selectAll('g')
      .data(nodeData).join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )
      .on('click', (e, d) => { e.stopPropagation(); onSelect(d) })

    nodeSel.append('rect')
      .attr('rx', NODE_RX).attr('ry', NODE_RX)
      .attr('fill', '#EFF6FF')
      .attr('stroke', '#2563EB')
      .attr('stroke-width', 1.4)
      .attr('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))')

    nodeSel.append('text')
      .attr('font-size', FS)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#1E40AF')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text((d) => d.label)

    // Size rects from text bounding box
    nodeSel.each(function() {
      const grp  = d3.select(this)
      const txt  = grp.select('text').node()
      if (!txt) return
      const bb   = txt.getBBox()
      const rw   = bb.width  + NODE_PX * 2
      const rh   = bb.height + NODE_PY * 2
      grp.select('rect').attr('width', rw).attr('height', rh)
        .attr('x', -rw / 2).attr('y', -rh / 2)
      grp.datum()._rw = rw; grp.datum()._rh = rh
    })

    svg.on('click', () => onSelect(null))

    // ── tick ──────────────────────────────────────────────────────────────
    sim.on('tick', () => {
      linkSel
        .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y)

      linkLabelSel
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2)

      nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => { sim.stop(); svg.selectAll('*').remove() }
  }, [nodes, links])

  // Highlight selected node
  useEffect(() => {
    if (!gRef.current) return
    gRef.current.selectAll('.nodes g rect')
      .attr('fill',         (d) => d._selected ? '#BFDBFE' : '#EFF6FF')
      .attr('stroke',       (d) => d._selected ? '#1D4ED8' : '#2563EB')
      .attr('stroke-width', (d) => d._selected ? 2.2 : 1.4)
  })

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #EFF6FF 0%, #F8FAFF 100%)' }}
    />
  )
}

// ── Inspector panel ───────────────────────────────────────────────────────────
function Inspector({ node, links, onClose }) {
  if (!node) return null
  const id       = node.id
  const outgoing = links.filter((l) => (l.source?.id ?? l.source) === id)
  const incoming = links.filter((l) => (l.target?.id ?? l.target) === id)

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-5 left-5 w-72 bg-surface-100/95 backdrop-blur-sm rounded-2xl
                 shadow-xl border border-ink-100/20 overflow-hidden z-10 flex flex-col max-h-80"
    >
      <div className="px-4 py-3 border-b border-ink-100/10 flex items-start justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-ink-900">{node.label}</p>
          <p className="text-[10px] font-mono text-ink-400 break-all mt-0.5">{id}</p>
        </div>
        <button onClick={onClose} className="text-ink-300 hover:text-ink-500 shrink-0 text-sm mt-0.5">✕</button>
      </div>
      <div className="overflow-auto p-4 space-y-3">
        {outgoing.length > 0 && (
          <div>
            <p className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-wider mb-1.5">
              Outgoing ({outgoing.length})
            </p>
            {outgoing.map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-slate-50 mb-1">
                <span className={`font-mono text-[10px] shrink-0 ${l.type === 'property' ? 'text-cortex-purple' : 'text-cortex-blue'}`}>
                  {l.label}
                </span>
                <span className="text-ink-700 truncate">{shortLabel(l.target?.id ?? l.target)}</span>
              </div>
            ))}
          </div>
        )}
        {incoming.length > 0 && (
          <div>
            <p className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-wider mb-1.5">
              Incoming ({incoming.length})
            </p>
            {incoming.map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-slate-50 mb-1">
                <span className="text-ink-700 truncate">{shortLabel(l.source?.id ?? l.source)}</span>
                <span className={`font-mono text-[10px] shrink-0 ${l.type === 'property' ? 'text-cortex-purple' : 'text-cortex-blue'}`}>
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        )}
        {!outgoing.length && !incoming.length && (
          <p className="text-xs text-ink-400 text-center py-3">No relationships</p>
        )}
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GraphPage() {
  const ontologyText = useNeocortex((s) => s.ontologyFileText)
  const setPage      = useNeocortex((s) => s.setPage)
  const [selected, setSelected] = useState(null)

  const { nodes, links, error } = useMemo(
    () => ontologyText.trim() ? parseTTL(ontologyText) : { nodes: [], links: [], error: null },
    [ontologyText],
  )

  const handleSelect = (node) => {
    if (node) node._selected = true
    setSelected((prev) => { if (prev) prev._selected = false; return node })
  }

  if (!ontologyText.trim()) return (
    <EmptyState icon="graph" title="No ontology loaded" sub="Upload or generate a .ttl ontology first"
      action="← Go to Pipeline" onClick={() => setPage('ontology')} />
  )
  if (error) return (
    <EmptyState icon="error" title="Failed to parse ontology" sub={error}
      action="← Fix in Review" onClick={() => setPage('review')} />
  )
  if (nodes.length === 0) return (
    <EmptyState icon="empty" title="No classes found"
      sub="The ontology parsed successfully but contains no owl:Class or rdfs:subClassOf triples."
      action="← Review Ontology" onClick={() => setPage('review')} />
  )

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-ink-100/10 bg-surface-100/80 backdrop-blur-sm
                      flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="page-title">Ontology Graph</h1>
          <p className="page-sub mt-0.5">{nodes.length} classes · {links.length} relationships</p>
        </div>
        <div className="flex items-center gap-5 text-xs font-mono text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#EFF6FF] border border-[#2563EB]" />
            Class
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="8" viewBox="0 0 20 8">
              <line x1="0" y1="4" x2="14" y2="4" stroke="#3B82F6" strokeWidth="1.5"/>
              <polygon points="14,1 20,4 14,7" fill="#3B82F6"/>
            </svg>
            subClassOf
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="8" viewBox="0 0 20 8">
              <line x1="0" y1="4" x2="14" y2="4" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="4,2"/>
              <polygon points="14,1 20,4 14,7" fill="#8B5CF6"/>
            </svg>
            objectProperty
          </span>
        </div>
      </div>

      {/* Graph area */}
      <div className="flex-1 min-h-0 relative">
        <OntologyForceGraph nodes={nodes} links={links} onSelect={handleSelect} />
        <AnimatePresence>
          {selected && (
            <Inspector node={selected} links={links} onClose={() => handleSelect(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Reusable empty/error state ────────────────────────────────────────────────
function EmptyState({ title, sub, action, onClick }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-8">
      <div>
        <p className="text-base font-semibold text-ink-700">{title}</p>
        <p className="text-sm text-ink-400 mt-1 max-w-sm">{sub}</p>
      </div>
      <button onClick={onClick}
        className="px-5 py-2 rounded-lg bg-cortex-blue text-white text-sm font-medium hover:bg-blue-700 transition">
        {action}
      </button>
    </div>
  )
}
