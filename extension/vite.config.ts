import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This is the new, simplified config.
export default defineConfig({
  plugins: [react()],
})