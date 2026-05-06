import { useEffect, useRef } from 'react'

const GRAPH_URL  = '/graph'
const BUILD_URL  = '/graph/build?limit=2000'

export default function VisualizationPage() {
  const iframeRef = useRef(null)

  useEffect(() => {
    fetch(BUILD_URL, { method: 'POST' })
      .then(() => {
        setTimeout(() => {
          if (iframeRef.current)
            iframeRef.current.src = `${GRAPH_URL}?t=${Date.now()}`
        }, 4000)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="h-full flex flex-col" style={{ background: 'transparent' }}>
      <iframe
        ref={iframeRef}
        src={GRAPH_URL}
        className="w-full flex-1 border-0"
        title="NEURO-LINK CORE — Knowledge Graph"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
