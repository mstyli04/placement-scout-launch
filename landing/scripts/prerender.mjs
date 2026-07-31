import { build } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const pages = [
  { name: 'main', entry: 'src/entry-server-main.tsx', html: 'dist/index.html' },
  { name: 'privacy', entry: 'src/entry-server-privacy.tsx', html: 'dist/privacy/index.html' },
  { name: 'playbook', entry: 'src/entry-server-playbook.tsx', html: 'dist/playbook/index.html' },
  { name: 'methodology', entry: 'src/entry-server-methodology.tsx', html: 'dist/methodology/index.html' },
]

const ssrOutDir = 'dist-ssr'

await build({
  root,
  logLevel: 'warn',
  build: {
    ssr: true,
    outDir: ssrOutDir,
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p.name, path.resolve(root, p.entry)])),
      output: { format: 'es', entryFileNames: '[name].mjs' },
    },
  },
})

for (const page of pages) {
  const modPath = path.resolve(root, ssrOutDir, `${page.name}.mjs`)
  const mod = await import(pathToFileURL(modPath).href)
  const html = mod.render()

  const htmlPath = path.resolve(root, page.html)
  const template = fs.readFileSync(htmlPath, 'utf-8')
  if (!template.includes('<div id="root"></div>')) {
    throw new Error(`Could not find the empty root div placeholder in ${page.html}`)
  }
  fs.writeFileSync(htmlPath, template.replace('<div id="root"></div>', `<div id="root">${html}</div>`))
  console.log(`Prerendered ${page.name} -> ${page.html}`)
}
