import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Forces Vite to always resolve React from a single location,
  // even if a dependency (recharts, react-router, etc.) tries to
  // pull its own copy. This is what prevents the "null useContext"
  // crash in <ResponsiveContainer>.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },

  // Forces React + Recharts to be pre-bundled together in the same
  // pass, which keeps them on the same React dispatcher instance.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'recharts',
    ],
  },
  // ───────────────────────────────────────────────────────────

  server: {
    allowedHosts: ['shirsattechhub.cloud', 'www.shirsattechhub.cloud'],
    host: true,
    strictPort: false,
    // ADD THIS SECTION:
    hmr: {
      host: 'shirsattechhub.cloud',
      clientPort: 443, // Important for HTTPS
      protocol: 'wss', // WebSocket Secure
    },
    // Add this proxy configuration
    proxy: {
      '/socket.io': {
        target: 'http://localhost:5000', // your backend server
        ws: true, // important for WebSocket
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
