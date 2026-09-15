#!/usr/bin/env node

import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pluginDirectory = join(root, 'storyblok-plugins', 'catalogs-download-items')
const pluginName = 'catalogs-download-items'

loadEnv({ path: join(root, '.env.local') })

const token =
  process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN ||
  process.env.STORYBLOK_MANAGEMENT_TOKEN ||
  ''
const spaceId = Number(process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID)

if (!token) {
  console.error('Manca STORYBLOK_PERSONAL_ACCESS_TOKEN (o STORYBLOK_MANAGEMENT_TOKEN) in .env.local')
  process.exit(1)
}

if (!existsSync(join(pluginDirectory, 'dist', 'index.js'))) {
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: pluginDirectory,
    stdio: 'inherit',
    shell: true,
  })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const body = readFileSync(join(pluginDirectory, 'dist', 'index.js'), 'utf8')
const payload = {
  field_type: {
    name: pluginName,
    body,
    compiled_body: '',
    publish: 1,
    space_ids: spaceId ? [spaceId] : [],
    options: [{ name: 'cdn_token', value: '' }],
  },
}

async function request(url, method, json) {
  const response = await fetch(url, {
    method,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: json ? JSON.stringify(json) : undefined,
  })
  const data = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, data }
}

const api = 'https://mapi.storyblok.com/v1/field_types'
const listed = await request(`${api}/`, 'GET')
if (!listed.ok) {
  console.error('Impossibile elencare i field plugin:', listed.status, listed.data)
  process.exit(1)
}

const existing = listed.data?.field_types?.find((fieldType) => fieldType.name === pluginName)
const saved = existing?.id
  ? await request(`${api}/${existing.id}`, 'PUT', payload)
  : await request(`${api}/`, 'POST', payload)

if (!saved.ok) {
  console.error('Deploy fallito:', saved.status, saved.data)
  process.exit(1)
}

console.log(`Deploy completato. Installa ${pluginName} sul campo catalogs_download.items.`)
