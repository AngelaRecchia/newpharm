#!/usr/bin/env node
/**
 * Deploy field plugin target-pests to Storyblok (My Plugins) and assign it to the space.
 *
 * Uso:
 *   node scripts/deploy-target-pests-plugin.mjs
 */

import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PLUGIN_DIR = join(ROOT, 'storyblok-plugins', 'target-pests')
const PLUGIN_NAME = 'target-pests'
const API = 'https://mapi.storyblok.com/v1/field_types'

loadEnv({ path: join(ROOT, '.env.local') })

const token =
  process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN ||
  process.env.STORYBLOK_MANAGEMENT_TOKEN ||
  ''
const spaceId = Number(process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID)

if (!token) {
  console.error('Manca STORYBLOK_PERSONAL_ACCESS_TOKEN (o STORYBLOK_MANAGEMENT_TOKEN) in .env.local')
  process.exit(1)
}

if (!existsSync(join(PLUGIN_DIR, 'dist', 'index.js'))) {
  console.log('Build plugin...')
  const build = spawnSync('npm', ['run', 'build'], { cwd: PLUGIN_DIR, stdio: 'inherit', shell: true })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const body = readFileSync(join(PLUGIN_DIR, 'dist', 'index.js'), 'utf8')

const payload = {
  field_type: {
    name: PLUGIN_NAME,
    body,
    compiled_body: '',
    publish: 1,
    space_ids: spaceId ? [spaceId] : [],
    options: [{ name: 'cdn_token', value: '' }],
  },
}

async function api(url, method, json) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: json ? JSON.stringify(json) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  return { ok: res.ok, status: res.status, data }
}

console.log('Deploy target-pests via Management API...')

const list = await api(`${API}/`, 'GET')
if (!list.ok) {
  console.error('Impossibile elencare i field plugin:', list.status, list.data)
  process.exit(1)
}

const existing = list.data?.field_types?.find((ft) => ft.name === PLUGIN_NAME)

const saved = existing?.id
  ? await api(`${API}/${existing.id}`, 'PUT', payload)
  : await api(`${API}/`, 'POST', payload)

if (!saved.ok) {
  console.error('Deploy fallito:', saved.status, JSON.stringify(saved.data, null, 2))
  process.exit(1)
}

const id = saved.data?.field_type?.id ?? existing?.id
console.log(`Deploy completato (id ${id}). Plugin assegnato allo space ${spaceId || '(n/d)'}.`)
console.log('Prossimo passo: npm run update:insect-components')
