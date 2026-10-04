
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Vercel builds frontend into dist.
    // Local builds remain compatible with Spring Boot.
    outDir: process.env.VERCEL
      ? 'dist'
      : '../src/main/resources/static',

    emptyOutDir: true,
  },
})
