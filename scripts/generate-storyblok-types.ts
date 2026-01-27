#!/usr/bin/env tsx
/**
 * Script per generare TypeScript types dai componenti Storyblok
 * 
 * Questo script:
 * 1. Scarica gli schemi dei componenti da Storyblok usando Management API
 * 2. Genera interfacce TypeScript per ogni componente
 * 3. Salva i types in types/storyblok.d.ts
 * 
 * Uso: npm run generate:types
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import StoryblokClient from 'storyblok-js-client'

dotenv.config({ path: '.env.local' })

const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || '289806242201975'
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''

if (!MANAGEMENT_TOKEN) {
  console.error('❌ STORYBLOK_MANAGEMENT_TOKEN non trovato nel file .env.local')
  console.error('   Ottieni il token da: https://app.storyblok.com/#/me/account')
  process.exit(1)
}

const storyblok = new StoryblokClient({
  oauthToken: MANAGEMENT_TOKEN,
})

interface StoryblokField {
  name: string
  type: string
  required?: boolean
  options?: any[]
  pos?: number
  [key: string]: any
}

interface StoryblokComponent {
  name: string
  display_name: string
  schema: {
    [key: string]: StoryblokField
  }
  is_root?: boolean
  is_nestable?: boolean
}

/**
 * Converte un tipo Storyblok in tipo TypeScript
 */
function storyblokTypeToTS(field: StoryblokField): string {
  const { type, required, options } = field

  let tsType = 'any'

  switch (type) {
    case 'text':
    case 'textarea':
    case 'markdown':
    case 'richtext':
      tsType = 'string'
      break
    case 'number':
      tsType = 'number'
      break
    case 'boolean':
      tsType = 'boolean'
      break
    case 'asset':
      tsType = '{ id: number; alt: string; name: string; focus: string; title: string; filename: string; copyright: string; fieldtype: string; }'
      break
    case 'link':
      tsType = '{ id: string; url: string; linktype: string; fieldtype: string; cached_url?: string; }'
      break
    case 'bloks':
      tsType = 'any[]' // Array di componenti Storyblok
      break
    case 'options':
      if (options && Array.isArray(options)) {
        const optionValues = options.map(opt => `'${opt.value}'`).join(' | ')
        tsType = optionValues || 'string'
      } else {
        tsType = 'string'
      }
      break
    case 'multilink':
      tsType = '{ id: string; url: string; linktype: string; fieldtype: string; cached_url?: string; }'
      break
    case 'datetime':
      tsType = 'string' // ISO date string
      break
    case 'table':
      tsType = 'any[][]'
      break
    default:
      tsType = 'any'
  }

  return required ? tsType : `${tsType} | null`
}

/**
 * Genera l'interfaccia TypeScript per un componente
 */
function generateComponentInterface(component: StoryblokComponent): string {
  const componentName = component.name
  const interfaceName = `${componentName.charAt(0).toUpperCase() + componentName.slice(1)}Storyblok`
  
  const fields = Object.entries(component.schema || {})
    .sort(([, a], [, b]) => (a.pos || 0) - (b.pos || 0))
    .map(([key, field]) => {
      const tsType = storyblokTypeToTS(field)
      const optional = field.required ? '' : '?'
      const comment = field.required ? '' : ' // Optional'
      return `  ${key}${optional}: ${tsType}${comment}`
    })

  return `
export interface ${interfaceName} {
${fields.join('\n')}
  _uid: string
  component: string
  _editable?: string
}
`
}

/**
 * Genera il file TypeScript con tutti i types
 */
async function generateTypes() {
  console.log('🚀 Generazione TypeScript types da Storyblok...\n')
  console.log(`📦 Space ID: ${SPACE_ID}\n`)

  try {
    // Scarica tutti i componenti
    const response = await storyblok.get(`spaces/${SPACE_ID}/components`)
    const components: StoryblokComponent[] = response.data.components || []

    console.log(`📋 Trovati ${components.length} componenti\n`)

    if (components.length === 0) {
      console.warn('⚠️  Nessun componente trovato nello spazio Storyblok')
      return
    }

    // Genera le interfacce per ogni componente
    const interfaces = components.map(component => {
      console.log(`✅ Generato type per: ${component.display_name} (${component.name})`)
      return generateComponentInterface(component)
    })

    // Header del file
    const fileHeader = `/**
 * TypeScript types generati automaticamente da Storyblok
 * 
 * Questo file è generato automaticamente da scripts/generate-storyblok-types.ts
 * NON modificare manualmente - rigenera i types dopo aver modificato i componenti su Storyblok
 * 
 * Per rigenerare: npm run generate:types
 * 
 * Generato il: ${new Date().toISOString()}
 */

`

    // Footer con export di tutti i types
    const allTypes = components
      .map(c => `${c.name.charAt(0).toUpperCase() + c.name.slice(1)}Storyblok`)
      .join(' | ')

    const fileFooter = `
/**
 * Union type di tutti i componenti Storyblok
 */
export type StoryblokComponent = ${allTypes || 'never'}

/**
 * Helper type per il prop 'blok' nei componenti Storyblok
 */
export type StoryblokBlok = StoryblokComponent
`

    // Combina tutto
    const fileContent = fileHeader + interfaces.join('\n') + fileFooter

    // Crea la directory types se non esiste
    const typesDir = path.join(process.cwd(), 'types')
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true })
    }

    // Salva il file
    const outputPath = path.join(typesDir, 'storyblok.d.ts')
    fs.writeFileSync(outputPath, fileContent, 'utf-8')

    console.log(`\n✅ Types generati con successo in: ${outputPath}`)
    console.log(`\n💡 Importa i types nei componenti:`)
    console.log(`   import { HeaderStoryblok } from '@/types/storyblok'`)
    console.log(`\n🔄 Per rigenerare i types dopo modifiche su Storyblok:`)
    console.log(`   npm run generate:types`)
  } catch (error: any) {
    console.error('❌ Errore durante la generazione dei types:', error.message)
    if (error.response?.data) {
      console.error('   Dettagli:', JSON.stringify(error.response.data, null, 2))
    }
    process.exit(1)
  }
}

generateTypes().catch(console.error)
