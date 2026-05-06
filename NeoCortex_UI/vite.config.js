import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy ontology pipeline API (FastAPI on port 7777)
      '/api/v1': {
        target:      'http://localhost:7777',
        changeOrigin: true,
      },
      // Proxy MCP wrapper (avoids CORS — browser sees same origin)
      '/mcp': {
        target:      'http://localhost:8002',
        changeOrigin: true,
      },
      // Proxy Cognee REST API
      '/api/cognee': {
        target:      'http://localhost:8001',
        changeOrigin: true,
        rewrite:     (path) => path.replace(/^\/api\/cognee/, ''),
      },
      // Proxy Cognee graph visualization
      '/graph': {
        target:      'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
