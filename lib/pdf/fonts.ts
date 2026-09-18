import { Font } from '@react-pdf/renderer'
import { existsSync } from 'fs'
import { join } from 'path'

/**
 * Registrazione dei font per i PDF (Inter, come sul sito).
 *
 * Usiamo i TTF statici ufficiali (Inter 4.1, SIL OFL 1.1) estratti da
 * https://github.com/rsms/inter/releases/tag/v4.1 e versionati in
 * `assets/fonts/inter/`. Niente WOFF/WOFF2: fontkit fallisce con i font
 * variabili di Inter ("Offset is outside the bounds of the DataView").
 */

const FONT_DIR = join(process.cwd(), 'assets', 'fonts', 'inter')

let registered = false

/** Registra i pesi di Inter usati dalla scheda (400, 500, 600, 700). */
export function registerSheetFonts(): void {
  if (registered) return

  const weights: Array<{ weight: number; style: 'normal' | 'italic'; file: string }> = [
    { weight: 400, style: 'normal', file: 'Inter-Regular.ttf' },
    { weight: 400, style: 'italic', file: 'Inter-Italic.ttf' },
    { weight: 500, style: 'normal', file: 'Inter-Medium.ttf' },
    { weight: 600, style: 'normal', file: 'Inter-SemiBold.ttf' },
    { weight: 700, style: 'normal', file: 'Inter-Bold.ttf' },
  ]

  for (const { file } of weights) {
    const fontPath = join(FONT_DIR, file)
    if (!existsSync(fontPath)) {
      throw new Error(
        `[Sheet] Missing font "${file}" at ${fontPath}. ` +
          'On Vercel, ensure outputFileTracingIncludes covers assets/fonts/inter.',
      )
    }
  }

  Font.register({
    family: 'Inter',
    fonts: weights.map(({ weight, style, file }) => ({
      src: join(FONT_DIR, file),
      fontWeight: weight,
      fontStyle: style,
    })),
  })
  registered = true
}
