import { config as loadEnv } from 'dotenv'
import { RESOURCE_TABS, type ResourceTab } from '@/lib/downloadable/types'

const CATEGORY_LABEL: Record<ResourceTab, string> = {
  cataloghi: 'Cataloghi',
  brochure: 'Brochure',
  app: 'App',
  press: 'Press',
  altro: 'Altro',
}

const NESTED_NAME = 'resource_category_image'
const PARENT_NAME = 'downloadable_resources'
const DEFAULT_IMAGE_DESCRIPTION =
  'Hero di default, usata se la categoria non ha un’immagine propria.'
const CATEGORY_IMAGES_DESCRIPTION =
  'Un’immagine hero per categoria. Se manca, si usa Immagine.'

type SchemaField = Record<string, unknown>

type StoryblokComponent = {
  id: number
  name: string
  display_name?: string
  is_root?: boolean
  is_nestable?: boolean
  component_group_uuid?: string | null
  schema?: Record<string, SchemaField>
}

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
    components: StoryblokComponent[]
  }

  const parent = components.find(({ name }) => name === PARENT_NAME)
  if (!parent?.schema?.image) {
    console.error('Componente downloadable_resources o campo image non trovato.')
    process.exit(1)
  }

  if (parent.schema.image.type !== 'bloks') {
    console.error('downloadable_resources.image non è un campo bloks.')
    process.exit(1)
  }

  const nested = components.find(({ name }) => name === NESTED_NAME)
  if (!nested) {
    const createResponse = await fetch(api, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        component: {
          name: NESTED_NAME,
          display_name: 'Immagine categoria',
          is_root: false,
          is_nestable: true,
          component_group_uuid: parent.component_group_uuid,
          schema: nestedSchema(parent.schema.image),
        },
      }),
    })

    if (!createResponse.ok) {
      console.error(
        'Creazione resource_category_image fallita:',
        createResponse.status,
        await createResponse.text(),
      )
      process.exit(1)
    }

    await createResponse.json()
    console.log('resource_category_image creato.')
  } else {
    console.log('resource_category_image è già presente.')
  }

  const schema = { ...parent.schema }
  schema.image = {
    ...schema.image,
    description: DEFAULT_IMAGE_DESCRIPTION,
  }

  if (schema.category_images?.type === 'bloks') {
    schema.category_images = {
      ...schema.category_images,
      display_name: 'Immagini per categoria',
      description: CATEGORY_IMAGES_DESCRIPTION,
      restrict_components: true,
      component_whitelist: [NESTED_NAME],
    }
  } else {
    const imagePos = Number(schema.image.pos ?? 0)
    const categoryPos = imagePos + 1

    for (const [key, field] of Object.entries(schema)) {
      const pos = Number(field?.pos ?? 0)
      if (key !== 'image' && pos >= categoryPos) {
        schema[key] = { ...field, pos: pos + 1 }
      }
    }

    schema.category_images = {
      type: 'bloks',
      pos: categoryPos,
      display_name: 'Immagini per categoria',
      description: CATEGORY_IMAGES_DESCRIPTION,
      restrict_type: '',
      restrict_components: true,
      component_whitelist: [NESTED_NAME],
      required: false,
    }
  }

  const updateResponse = await fetch(`${api}/${parent.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ component: { ...parent, schema } }),
  })

  if (!updateResponse.ok) {
    console.error(
      'Aggiornamento downloadable_resources fallito:',
      updateResponse.status,
      await updateResponse.text(),
    )
    process.exit(1)
  }

  console.log(
    'downloadable_resources.category_images pronto (fallback su image).',
  )
}

function nestedSchema(imageField: SchemaField): Record<string, SchemaField> {
  return {
    category: {
      type: 'option',
      pos: 0,
      display_name: 'Categoria',
      description: 'Tab delle risorse a cui appartiene questa immagine hero.',
      options: RESOURCE_TABS.map((value) => ({
        name: CATEGORY_LABEL[value],
        value,
      })),
      exclude_empty_option: true,
      required: false,
    },
    image: {
      ...imageField,
      pos: 1,
      display_name: 'Immagine',
      description: 'Immagine hero di questa categoria (desktop e mobile).',
      restrict_components: true,
      component_whitelist: ['asset'],
      required: false,
    },
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
