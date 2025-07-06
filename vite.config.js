import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      vm: 'vm-browserify',
      crypto: 'crypto-browserify',
    },
  },
  optimizeDeps: {
    include: ['stream-browserify', 'vm-browserify', 'crypto-browserify'],
  },
})