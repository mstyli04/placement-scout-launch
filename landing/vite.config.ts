import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { generatedRoutes } from './scripts/page-routes.mjs'

// Generated page HTML shells — facet pages at explore/<sector>/<region>/
// and firm profiles at explore/firm/<company-number>-<name>/ — are written
// by scripts/generate-page-shells.mjs, which must run before `vite build`
// (see package.json's build script). This just needs their names/paths for
// the multi-page input map below; scripts/page-routes.mjs is the single
// source of truth both read.
const generatedInputs = Object.fromEntries(
  generatedRoutes().map((r) => [r.name, path.resolve(__dirname, r.dir, 'index.html')]),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        privacy: path.resolve(__dirname, 'privacy/index.html'),
        playbook: path.resolve(__dirname, 'playbook/index.html'),
        methodology: path.resolve(__dirname, 'methodology/index.html'),
        explore: path.resolve(__dirname, 'explore/index.html'),
        removal: path.resolve(__dirname, 'removal/index.html'),
        signals: path.resolve(__dirname, 'signals/index.html'),
        ...generatedInputs,
      },
    },
  },
})
