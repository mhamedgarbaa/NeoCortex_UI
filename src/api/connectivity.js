const API_BASE = 'http://localhost:8001'

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
}
