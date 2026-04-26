import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    entry: 'electron/main.ts',
    build: {
      lib: {
        entry: 'electron/main.ts',
        formats: ['cjs']
      },
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  preload: {
    entry: 'electron/preload.ts',
    build: {
      lib: {
        entry: 'electron/preload.ts',
        formats: ['cjs']
      },
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    root: 'src',
    input: 'src/index.html',
    build: {
      rollupOptions: {
        input: 'src/index.html'
      }
    },
    plugins: [react()]
  }
})
