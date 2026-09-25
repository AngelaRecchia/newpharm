import { Font } from '@react-pdf/renderer'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * Registrazione dei font per i PDF (Inter, come sul sito).
 *
 * Usiamo i TTF statici ufficiali (Inter 4.1, SIL OFL 1.1) estratti da
 * https://github.com/rsms/inter/releases/tag/v4.1 e versionati in
 * `assets/fonts/inter/`. Niente WOFF/WOFF2: fontkit fallisce con i font
 * variabili di Inter ("Offset is outside the bounds of the DataView").
 */

/**
 * Path letterali (non un nome file in variabile): il file tracer di Vercel
 * include solo i file il cui path è statico, come già fa per il logo PNG.
 */
const FONT_REGULAR = join(process.cwd(), 'assets', 'fonts', 'inter', 'Inter-Regular.ttf')
const FONT_ITALIC = join(process.cwd(), 'assets', 'fonts', 'inter', 'Inter-Italic.ttf')
const FONT_MEDIUM = join(process.cwd(), 'assets', 'fonts', 'inter', 'Inter-Medium.ttf')
const FONT_SEMIBOLD = join(process.cwd(), 'assets', 'fonts', 'inter', 'Inter-SemiBold.ttf')
const FONT_BOLD = join(process.cwd(), 'assets', 'fonts', 'inter', 'Inter-Bold.ttf')

const FONT_SOURCES: Array<{ weight: number; style: 'normal' | 'italic'; src: string }> = [
  { weight: 400, style: 'normal', src: FONT_REGULAR },
  { weight: 400, style: 'italic', src: FONT_ITALIC },
  { weight: 500, style: 'normal', src: FONT_MEDIUM },
  { weight: 600, style: 'normal', src: FONT_SEMIBOLD },
  { weight: 700, style: 'normal', src: FONT_BOLD },
]

let registered = false

/** Registra i pesi di Inter usati dalla scheda (400, 500, 600, 700). */
export function registerSheetFonts(): void {
  // Il template Mastro va a capo solo sugli spazi, senza sillabazione.
  Font.registerHyphenationCallback((word) => [word])
  if (registered) return

  for (const { src } of FONT_SOURCES) {
    if (!existsSync(src)) {
      throw new Error(
        `[Sheet] Missing font at ${src}. ` +
          'On Vercel, ensure outputFileTracingIncludes covers assets/fonts/inter.',
      )
    }
  }

  // Lettura esplicita: stesso pattern del logo, così il tracer copia i TTF nella lambda.
  readFileSync(FONT_REGULAR)
  readFileSync(FONT_ITALIC)
  readFileSync(FONT_MEDIUM)
  readFileSync(FONT_SEMIBOLD)
  readFileSync(FONT_BOLD)

  Font.register({
    family: 'Inter',
    fonts: FONT_SOURCES.map(({ weight, style, src }) => ({
      src,
      fontWeight: weight,
      fontStyle: style,
    })),
  })
  registered = true
}
