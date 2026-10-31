import { cp, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('../', import.meta.url)
const files = await readdir(new URL('dist/assets/', root))
if (!files.some(name => name.startsWith('StandaloneApp-'))) throw new Error('Run npm run build:demo before staging.')
const index = await readFile(new URL('dist/index.html', root), 'utf8')
if (!index.includes('SmartSpend')) throw new Error('Unexpected build output.')
const destination = await mkdtemp(join(tmpdir(), 'smartspend-public-'))
await cp(new URL('dist/', root), destination, { recursive: true })
await writeFile(join(destination, 'vercel.json'), JSON.stringify({
  framework: null, buildCommand: null, installCommand: null,
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
  headers: [{ source: '/(.*)', headers: [
    { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'" },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ] }],
}, null, 2) + '\n')
console.log(destination)
