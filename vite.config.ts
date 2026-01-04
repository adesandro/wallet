import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Extensions are served from chrome-extension://... and assets must be resolved relatively.
  base: './',
  plugins: [react()],
})
