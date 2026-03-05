import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: true,
    allowedHosts: ['sistemamedico-production-860d.up.railway.app', '.railway.app'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
