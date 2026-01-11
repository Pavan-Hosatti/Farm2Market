import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // You might need to import this

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This tells Vite: "When you see 'react-leaflet', look exactly here"
      'react-leaflet': path.resolve(__dirname, 'node_modules/react-leaflet/lib/index.js'),
      'leaflet': path.resolve(__dirname, 'node_modules/leaflet/dist/leaflet.js'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      // If the alias doesn't work, we tell Rollup to expect these as external
      // but the alias usually solves the 'failed to resolve' error.
    }
  }
})
