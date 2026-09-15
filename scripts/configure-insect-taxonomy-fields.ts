import { config as loadEnv } from 'dotenv'

import {
  INSECT_MACRO_CATEGORIES,
  PEST_FAMILY_OPTIONS,
  storyblokOptions,
} from '@/lib/insects/taxonomy'

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
    components: Array<{ id: number; name: string; schema?: Record<string, unknown> }>
  }

  const component = components.find(({ name }) => name === 'insect')
  if (!component?.schema) {
    console.error('Componente insect non trovato.')
    process.exit(1)
  }

  const categoryField = component.schema.category as Record<string, unknown> | undefined
  const famigliaField = component.schema.famiglia as Record<string, unknown> | undefined

  if (!categoryField || !famigliaField) {
    console.error('Campi insect.category o insect.famiglia non trovati.')
    process.exit(1)
  }

  const schema = {
    ...component.schema,
    category: {
      ...categoryField,
      type: 'option',
      display_name: 'Macro categoria',
      description:
        'Macro categoria Guida infestanti (es. insetti volanti, roditori…).',
      options: storyblokOptions(INSECT_MACRO_CATEGORIES),
    },
    famiglia: {
      ...famigliaField,
      type: 'option',
      display_name: 'Famiglia / gruppo',
      description:
        'Famiglia infestante per icona SVG e raggruppamento target_pests sui prodotti.',
      options: storyblokOptions(PEST_FAMILY_OPTIONS),
    },
  }

  const updateResponse = await fetch(`${api}/${component.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ component: { ...component, schema } }),
  })

  if (!updateResponse.ok) {
    console.error(
      'Aggiornamento componente insect fallito:',
      updateResponse.status,
      await updateResponse.text(),
    )
    process.exit(1)
  }

  console.log('insect.category e insect.famiglia aggiornati con la tassonomia infestanti.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
