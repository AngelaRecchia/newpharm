/**
 * Aggiunge `nome_scientifico` al content type insect su Storyblok.
 *
 * Idempotente. Posizionato subito dopo `title`.
 *
 * Uso: npm run configure:insect-scientific-name
 */

import { config as loadEnv } from 'dotenv'

async function main() {
  loadEnv({ path: '.env.local' })

  const spaceId = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID
  const managementToken = process.env.STORYBLOK_MANAGEMENT_TOKEN

  if (!spaceId || !managementToken) {
    console.error(
      'Servono NEXT_PUBLIC_STORYBLOK_SPACE_ID e STORYBLOK_MANAGEMENT_TOKEN in .env.local',
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

  const { components = [] } = (await listResponse.json()) as {
    components: Array<{
      id: number
      name: string
      schema?: Record<string, Record<string, unknown>>
    }>
  }

  const insect = components.find(({ name }) => name === 'insect')
  if (!insect?.schema) {
    console.error('Componente insect non trovato.')
    process.exit(1)
  }

  if (insect.schema.nome_scientifico?.type === 'text') {
    console.log('insect.nome_scientifico è già presente.')
    return
  }

  const titlePos = Number(insect.schema.title?.pos ?? 0)
  const fieldPos = titlePos + 1

  const schema = { ...insect.schema }

  for (const [key, field] of Object.entries(schema)) {
    const pos = Number(field?.pos ?? 0)
    if (key !== 'title' && pos >= fieldPos) {
      schema[key] = { ...field, pos: pos + 1 }
    }
  }

  schema.nome_scientifico = {
    type: 'text',
    pos: fieldPos,
    display_name: 'Nome scientifico',
    description:
      'Binomio latino (es. Culex pipiens). In scheda prodotto tra parentesi; in listing sotto il titolo.',
    translatable: true,
    required: false,
  }

  const updateResponse = await fetch(`${api}/${insect.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ component: { ...insect, schema } }),
  })

  if (!updateResponse.ok) {
    console.error(
      'Aggiornamento componente insect fallito:',
      updateResponse.status,
      await updateResponse.text(),
    )
    process.exit(1)
  }

  console.log('insect.nome_scientifico aggiunto.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
