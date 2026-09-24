import fs from 'node:fs'
import path from 'node:path'

/** Slug famiglia → prefisso nome file negli asset Cursor (prima dell’UUID). */
/** Famiglie con SVG in public/icons/pests: non sovrascrivere con PNG sgranate. */
const SVG_FAMILIES = new Set([
  'zanzare',
  'mosche',
  'vespe',
  'formiche',
  'blatte',
])

const SOURCE_KEY_BY_FAMILY: Record<string, string> = {
  zanzare: 'zanzara',
  mosche: 'mosca',
  vespe: 'vespa',
  calabroni: 'hornet-insect',
  formiche: 'formica_svg',
  blatte: 'blatta',
  pesciolini_d_argento: 'silverfish-insect',
  termiti: 'termite-insect',
  tarli_cerambicidi: 'longhorn-woodworm-beetle--wood-boring-beetle',
  tarli_siricidi: 'woodwasp-horntail-insect--wood-boring-wasp',
  cimici_dei_letti: 'cimice-letto',
  cimici: 'shield-stink-bug-insect',
  zecche: 'tick-parasite-insect',
  pulci: 'flea-insect',
  pidocchi: 'head-lice-insect',
  acari: 'mite-arachnid',
  acaro_pollino: 'flour-mite--dust-mite-arachnid',
  tarme: 'clothes-moth-insect',
  coleottero_dei_tappeti: 'carpet-beetle-insect',
  ratto_grigio: 'grey-rat-rodent',
  ratto_nero: 'black-rat-rodent',
  topolino_domestico: 'house-mouse-rodent',
  piccioni: 'pigeon-bird',
  insetti_delle_derrate: 'stored-product-pest-beetle-in-a-grain-kernel',
}

const defaultAssetsDir = path.join(
  process.env.USERPROFILE ?? '',
  '.cursor',
  'projects',
  'c-Users-angel-Documents-projects-newpharm',
  'assets',
)

function findSourceFile(assetsDir: string, key: string): string | null {
  const entries = fs.readdirSync(assetsDir)
  const matches = entries.filter(
    (name) => name.includes(`images_${key}-`) && name.endsWith('.png'),
  )
  if (matches.length === 0) return null

  // Se ci sono duplicati, preferisci il file più grande (solitamente più dettagliato).
  matches.sort((a, b) => {
    const sizeA = fs.statSync(path.join(assetsDir, a)).size
    const sizeB = fs.statSync(path.join(assetsDir, b)).size
    return sizeB - sizeA
  })

  return path.join(assetsDir, matches[0]!)
}

function main() {
  const assetsDir = process.env.PEST_ICON_ASSETS_DIR ?? defaultAssetsDir
  const outDir = path.join(process.cwd(), 'public', 'icons', 'pests')

  if (!fs.existsSync(assetsDir)) {
    console.error(`Cartella asset non trovata: ${assetsDir}`)
    process.exit(1)
  }

  fs.mkdirSync(outDir, { recursive: true })

  let copied = 0
  const missing: string[] = []

  for (const [family, key] of Object.entries(SOURCE_KEY_BY_FAMILY)) {
    if (SVG_FAMILIES.has(family)) continue
    const source = findSourceFile(assetsDir, key)
    if (!source) {
      missing.push(family)
      continue
    }
    const dest = path.join(outDir, `${family}.png`)
    fs.copyFileSync(source, dest)
    copied += 1
    console.log(`[pest-icons] ${family} ← ${path.basename(source)}`)
  }

  console.log(`[pest-icons] Copiate ${copied}/${Object.keys(SOURCE_KEY_BY_FAMILY).length} icone in public/icons/pests/`)

  if (missing.length > 0) {
    console.warn('[pest-icons] Mancanti:', missing.join(', '))
    process.exit(1)
  }
}

main()
