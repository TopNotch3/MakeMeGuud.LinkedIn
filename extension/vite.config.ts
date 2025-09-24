import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// This is a custom configuration for our Chrome Extension
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // We define our content script as an additional input
      input: {
        main: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.js'),
      },
      output: {
        // This ensures the output filename is predictable
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'content' ? 'content.js' : 'assets/[name].js';
        },
      },
    },
  },
})