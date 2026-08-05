#!/usr/bin/env node
/**
 * Deploy field plugin listing-items to Storyblok (My Plugins).
 *
 * Richiede un Personal Access Token da https://app.storyblok.com/#/me/account
 *
 * Uso:
 *   node scripts/deploy-listing-items-plugin.mjs
 *   STORYBLOK_PERSONAL_ACCESS_TOKEN=xxx node scripts/deploy-listing-items-plugin.mjs
 *
 * Fallback: STORYBLOK_MANAGEMENT_TOKEN in .env.local se coincide con il PAT account.
 */

import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PLUGIN_DIR = join(ROOT, 'storyblok-plugins', 'listing-items')

loadEnv({ path: join(ROOT, '.env.local') })

const token =
  process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN ||
  process.env.STORYBLOK_MANAGEMENT_TOKEN ||
  ''

async function deployViaApi() {
  const listRes = await fetch('https://mapi.storyblok.com/v1/field_types/', {
    headers: { Authorization: token },
  })
  if (!listRes.ok) return false

  const list = await listRes.json()
  const existing = list.field_types?.find((ft) => ft.name === 'listing-items')
  if (!existing?.id) return false

  const body = readFileSync(join(PLUGIN_DIR, 'dist', 'index.js'), 'utf8')
  const updateRes = await fetch(
    `https://mapi.storyblok.com/v1/field_types/${existing.id}`,
    {
      method: 'PUT',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_type: { name: 'listing-items', body } }),
    },
  )

  return updateRes.ok
}

if (!token) {
  console.error(
    'Manca STORYBLOK_PERSONAL_ACCESS_TOKEN (o STORYBLOK_MANAGEMENT_TOKEN) in .env.local',
  )
  process.exit(1)
}

if (!existsSync(join(PLUGIN_DIR, 'dist', 'index.js'))) {
  console.log('Build plugin...')
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: PLUGIN_DIR,
    stdio: 'inherit',
    shell: true,
  })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

console.log('Deploy listing-items con PAT...')
const deploy = spawnSync(
  'npx',
  [
    '@storyblok/field-plugin-cli@latest',
    'deploy',
    '--name',
    'listing-items',
    '--skipPrompts',
    '--scope',
    'my-plugins',
    '--token',
    token,
    '--dir',
    PLUGIN_DIR,
  ],
  { stdio: 'inherit', shell: true },
)

if (deploy.status !== 0) {
  console.warn('CLI deploy fallito, tentativo upload via Management API...')
  const apiOk = await deployViaApi()
  if (apiOk) {
    console.log(`
Deploy completato (via API).
Prossimi passi:
  1. Storyblok > Settings > Field Plugins > Install > listing-items (se non già installato)
`)
    process.exit(0)
  }

  console.error(`
Deploy fallito. Il token in STORYBLOK_MANAGEMENT_TOKEN potrebbe essere un token space,
non il Personal Access Token account richiesto per /v1/field_types.

Crea un PAT su https://app.storyblok.com/#/me/account e lancia:
  STORYBLOK_PERSONAL_ACCESS_TOKEN=<pat> node scripts/deploy-listing-items-plugin.mjs
`)
  process.exit(deploy.status ?? 1)
}

console.log(`
Deploy completato.
Prossimi passi:
  1. Storyblok > Settings > Field Plugins > Install > listing-items
`)
