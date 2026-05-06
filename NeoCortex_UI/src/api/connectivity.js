const API_BASE = 'http://localhost:8000'

export const connectivityAPI = {
  async checkHealth() {
    try {
      const start = Date.now()
      const resp  = await fetch(`${API_BASE}/health`)
      const pingMs = Date.now() - start
      return {
        status: resp.ok ? 'connected' : 'error',
        pingMs,
        details: await resp.json(),
      }
    } catch (error) {
      return { status: 'disconnected', error: error.message }
    }
  },

  async getGraphStats() {
    try {
      const resp = await fetch(`${API_BASE}/graph/stats`)
      if (!resp.ok) throw new Error('Failed to fetch stats')
      return await resp.json()
    } catch {
      return null
    }
  },

  async testIngest(testData) {
    try {
      const resp = await fetch(`${API_BASE}/add`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(testData),
      })
      return {
        status:   resp.ok ? 'success' : 'failed',
        response: await resp.json(),
      }
    } catch (error) {
      return { status: 'error', error: error.message }
    }
  },

  async testSearch(query) {
    try {
      const resp = await fetch(`${API_BASE}/search`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query }),
      })
      return {
        status:  resp.ok ? 'success' : 'failed',
        results: await resp.json(),
      }
    } catch (error) {
      return { status: 'error', error: error.message }
    }
  },

  async getOntologyInfo() {
    try {
      const resp = await fetch(`${API_BASE}/ontology/info`)
      return resp.ok ? await resp.json() : null
    } catch {
      return null
    }
  },

  async uploadOntologyFile(file) {
    const form = new FormData()
    form.append('file', file)
    const resp = await fetch(`${API_BASE}/ontology/upload`, { method: 'POST', body: form })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'Upload failed')
    return data   // { path, filename, size }
  },

  async commitOntologyContent(content) {
    const resp = await fetch(`${API_BASE}/ontology/commit`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'Commit failed')
    return data   // { path, size, injected }
  },

  async cognifyData(text) {
    const resp = await fetch(`${API_BASE}/add`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: text }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'Cognify failed')
    return data
  },

  async extractFileText(file) {
    const form = new FormData()
    form.append('file', file)
    const resp = await fetch(`${API_BASE}/cognify/extract`, { method: 'POST', body: form })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'Extraction failed')
    return data   // { text, filename, chars }
  },

  async generateOntology(files) {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    const resp = await fetch('/api/v1/ontology/generate', { method: 'POST', body: form })
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      throw new Error(data.detail || `Pipeline failed (HTTP ${resp.status})`)
    }
    return resp.blob()
  },
}
