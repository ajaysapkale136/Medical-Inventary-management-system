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
    // This tells Vite to output the build directly into Spring Boot's static folder
    outDir: '../src/main/resources/static',
    emptyOutDir: true // Clears the folder before each new build
  }
})
