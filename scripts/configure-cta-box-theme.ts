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

  const ctaBox = components.find(({ name }) => name === 'cta_box')
  if (!ctaBox?.schema) {
    console.error('Componente cta_box non trovato.')
    process.exit(1)
  }

  if (ctaBox.schema.theme?.type === 'option') {
    console.log('cta_box.theme è già presente.')
    return
  }

  const themePos = 0

  const schema = {
    ...ctaBox.schema,
  }

  for (const [key, field] of Object.entries(schema)) {
    const pos = Number(field?.pos ?? 0)
    schema[key] = { ...field, pos: pos + 1 }
  }

  schema.theme = {
    type: 'option',
    pos: themePos,
    display_name: 'Tema',
    description: 'Contrasto delle card. Dark: la box nera usa il nero soft. Default: light.',
    options: [
      { name: 'Light', value: 'light' },
      { name: 'Dark', value: 'dark' },
    ],
    default_value: 'light',
    required: false,
  }

  const updateResponse = await fetch(`${api}/${ctaBox.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ component: { ...ctaBox, schema } }),
  })

  if (!updateResponse.ok) {
    console.error(
      'Aggiornamento componente cta_box fallito:',
      updateResponse.status,
      await updateResponse.text(),
    )
    process.exit(1)
  }

  console.log('cta_box.theme aggiunto (light | dark, default light).')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
