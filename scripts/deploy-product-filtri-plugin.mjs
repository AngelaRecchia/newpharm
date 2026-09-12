#!/usr/bin/env node
/**
 * Deploy field plugin product-filtri to Storyblok (My Plugins).
 *
 * Richiede un Personal Access Token da https://app.storyblok.com/#/me/account
 * (non il token space/Management API usato per stories e datasource).
 *
 * Uso:
 *   node scripts/deploy-product-filtri-plugin.mjs
 *   STORYBLOK_PERSONAL_ACCESS_TOKEN=xxx node scripts/deploy-product-filtri-plugin.mjs
 *
 * Fallback: imposta STORYBLOK_PERSONAL_ACCESS_TOKEN in .env.local oppure
 * passa STORYBLOK_MANAGEMENT_TOKEN se coincide con il PAT account.
 */

import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PLUGIN_DIR = join(ROOT, 'storyblok-plugins', 'product-filtri')

loadEnv({ path: join(ROOT, '.env.local') })

const token =
  process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN ||
  process.env.STORYBLOK_MANAGEMENT_TOKEN ||
  ''

if (!token) {
  console.error('Manca STORYBLOK_PERSONAL_ACCESS_TOKEN (o STORYBLOK_MANAGEMENT_TOKEN) in .env.local')
  process.exit(1)
}

if (!existsSync(join(PLUGIN_DIR, 'dist', 'index.js'))) {
  console.log('Build plugin...')
  const build = spawnSync('npm', ['run', 'build'], { cwd: PLUGIN_DIR, stdio: 'inherit', shell: true })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

console.log('Deploy product-filtri...')
const deploy = spawnSync(
  'npx',
  [
    '@storyblok/field-plugin-cli@latest',
    'deploy',
    '--name',
    'product-filtri',
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
  console.error(`
Deploy fallito. Il token in STORYBLOK_MANAGEMENT_TOKEN potrebbe essere un token space,
non il Personal Access Token account richiesto per /v1/field_types.

Crea un PAT su https://app.storyblok.com/#/me/account e lancia:
  STORYBLOK_PERSONAL_ACCESS_TOKEN=<pat> node scripts/deploy-product-filtri-plugin.mjs

Poi in Storyblok: Settings > Field Plugins > Install > product-filtri
`)
  process.exit(deploy.status ?? 1)
}

console.log(`
Deploy completato.
Prossimi passi:
  1. Storyblok > Settings > Field Plugins > Install > product-filtri
`)
