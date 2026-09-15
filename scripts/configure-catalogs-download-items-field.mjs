#!/usr/bin/env node

import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const spaceId = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID
const managementToken = process.env.STORYBLOK_MANAGEMENT_TOKEN
const cdnToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN

if (!spaceId || !managementToken || !cdnToken) {
  console.error(
    'Servono NEXT_PUBLIC_STORYBLOK_SPACE_ID, STORYBLOK_MANAGEMENT_TOKEN e NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN in .env.local',
  )
  process.exit(1)
}

const api = `https://mapi.storyblok.com/v1/spaces/${spaceId}/components`
const headers = {
  Authorization: managementToken,
  'Content-Type': 'application/json',
}

const listResponse = await fetch(api, { headers })
if (!listResponse.ok) {
  console.error('Impossibile caricare i componenti:', listResponse.status)
  process.exit(1)
}

const { components = [] } = await listResponse.json()
const component = components.find(({ name }) => name === 'catalogs_download')
if (!component) {
  console.error('Componente catalogs_download non trovato.')
  process.exit(1)
}

const currentField = component.schema?.items
if (!currentField) {
  console.error('Campo catalogs_download.items non trovato.')
  process.exit(1)
}

const schema = {
  ...component.schema,
  items: {
    ...currentField,
    type: 'custom',
    display_name: 'Cataloghi e brochure PDF',
    field_type: 'catalogs-download-items',
    options: [{ name: 'cdn_token', value: cdnToken }],
  },
}

const updateResponse = await fetch(`${api}/${component.id}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ component: { ...component, schema } }),
})
if (!updateResponse.ok) {
  console.error('Aggiornamento del campo fallito:', updateResponse.status, await updateResponse.text())
  process.exit(1)
}

console.log('catalogs_download.items configurato con catalogs-download-items.')
