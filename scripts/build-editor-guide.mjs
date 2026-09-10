// ============================================
// Build Editor Guide PDF
// ============================================
// Converte docs/EDITOR_GUIDE.md in PDF con il design di brand
// (CSS in assets/css/editor-guide.css).
//
// Uso:
//   npm run guide:pdf
//
// Dipende da md-to-pdf (Puppeteer/Chromium).
// Il primo avvio scarica Chromium (~150MB).

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { mdToPdf } from 'md-to-pdf'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'docs', 'EDITOR_GUIDE.md')
const CSS = join(ROOT, 'assets', 'css', 'editor-guide.css')
const OUT_DIR = join(ROOT, 'out', 'editor-guide')
const OUT = join(OUT_DIR, 'EDITOR_GUIDE.pdf')

// Crea la cartella di output se non esiste
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true })
}

const headerHtml = `
<div style="display:flex;align-items:center;gap:8px;width:100%;font-family:Inter,sans-serif;font-size:8pt;color:#006fb2;">
  <span style="font-weight:700;">Newpharm</span>
  <span style="color:#4b5563;">· Guida Editor Storyblok</span>
</div>`

const footerHtml = `
<div style="display:flex;justify-content:space-between;width:100%;font-family:Inter,sans-serif;font-size:8pt;color:#4b5563;">
  <span>Newpharm S.r.l. — Santa Giustina in Colle (PD)</span>
  <span>Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></span>
</div>`

// Legge il markdown e il CSS
const content = readFileSync(SRC, 'utf-8')
const css = readFileSync(CSS, 'utf-8')

await mdToPdf(
  { content },
  {
    dest: OUT,
    css,
    md_options: {
      breakOnSingleBacktick: true,
    },
    pdf_options: {
      format: 'A4',
      margin: {
        top: '18mm',
        right: '16mm',
        bottom: '18mm',
        left: '16mm',
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerHtml,
      footerTemplate: footerHtml,
    },
  }
)

console.log(`✅ PDF generato: ${OUT}`)