import { existsSync } from 'fs'
import { join } from 'path'
import { NextApiRequest, NextApiResponse } from 'next'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { TechnicalSheetDocument } from '@/lib/pdf/template'
import { mapProductToSheet } from '@/lib/pdf/document'
import { registerSheetFonts } from '@/lib/pdf/fonts'
import { getSheetStorage, sheetCacheKey, hashContent } from '@/lib/pdf/storage'
import { getStoriesByUuids } from '@/lib/api/storyblok/stories'
import { getProductCategorySlug } from '@/lib/product-filtri'
import type { ProductStoryblok } from '@/types/storyblok'
import localeConfig from '@/i18n/locales.json'

const RATE_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20
const IMAGE_TIMEOUT_MS = 10_000
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const requestWindows = new Map<string, { startedAt: number; count: number }>()
const generationInFlight = new Map<string, Promise<Buffer>>()

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim()
  return req.socket.remoteAddress || 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const current = requestWindows.get(ip)
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestWindows.set(ip, { startedAt: now, count: 1 })
    return false
  }
  current.count += 1
  return current.count > MAX_REQUESTS_PER_WINDOW
}

/**
 * Scheda tecnica PDF generata on-demand.
 *
 * Route Pages Router (non App Router): react-pdf/renderer dipende da internals
 * React client-side che nell'App Router (layer react-server) non esistono.
 * In Pages Router l'handler gira in un normale contesto Node + webpack,
 * quindi react-pdf funziona come in un semplice script.
 *
 * Path uguale alla vecchia route App Router (`/api/products/[uuid]/scheda-tecnica`)
 * così la UI (ProductDownloadBar, Compare) non cambia di una riga.
 */

export const config = {
  maxDuration: 60,
  api: {
    responseLimit: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    if (isRateLimited(getClientIp(req))) {
      res.status(429).json({ error: 'Too many requests' })
      return
    }

    const { uuid } = req.query
    const locale = (req.query.locale as string | undefined) || localeConfig.defaultLocale

    if (typeof uuid !== 'string' || !uuid) {
      res.status(400).json({ error: 'Missing product uuid' })
      return
    }

    if (!localeConfig.locales.includes(locale)) {
      res.status(400).json({ error: 'Invalid locale' })
      return
    }

    const logoPath = join(process.cwd(), 'assets', 'pdf', 'newpharm-logo.png')
    if (!existsSync(logoPath)) {
      console.error('[Sheet] Missing logo at', logoPath)
      res.status(500).json({ error: 'PDF assets not deployed' })
      return
    }

    registerSheetFonts()

    // Recupera la story prodotto per UUID nel locale corrente
    const stories = await getStoriesByUuids([uuid], locale)
    const story = stories[0]
    if (!story || story.content?.component !== 'product') {
      res.status(404).json({ error: 'Product not found in this locale' })
      return
    }

    const content = story.content as ProductStoryblok
    const categorySlug = getProductCategorySlug(
      content.product_filtri as { category?: string; subcategories?: string[] } | undefined,
      content.category,
    )

    // Costruisce il modello della scheda
    const data = mapProductToSheet(
      { uuid, name: story.name, updated_at: story.updated_at, content },
      {
        categorySlug,
        locale,
        footerUpdated: story.updated_at
          ? `Aggiornamento del ${new Date(story.updated_at).toLocaleDateString(
              locale === 'it' ? 'it-IT' : 'en-GB',
              { day: 'numeric', month: 'long', year: 'numeric' },
            )}`
          : '',
      },
    )

    // Pre-download dell'immagine prodotto: react-pdf fa il fetch a runtime e in
    // Next Pages Router quel fetch fallisce ("fetch failed"). Scarichiamo noi
    // (che funziona) e passiamo il buffer al template — evita fetch a runtime.
    if (data.image && typeof data.image === 'string') {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS)
      try {
        const source = data.image.startsWith('http') ? data.image : `https:${data.image}`
        const response = await fetch(source, { signal: controller.signal })
        if (response.ok) {
          const contentLength = Number(response.headers.get('content-length') || 0)
          if (contentLength > MAX_IMAGE_BYTES) {
            throw new Error('Product image exceeds the maximum allowed size')
          }
          const arrayBuffer = await response.arrayBuffer()
          if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
            throw new Error('Product image exceeds the maximum allowed size')
          }
          const buffer = Buffer.from(arrayBuffer)
          const mime = response.headers.get('content-type') || 'image/png'
          const format = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png'
          data.image = { data: buffer, format }
        } else {
          console.log(
            `[Sheet] image download failed status=${response.status} url=${source.slice(0, 80)}`,
          )
        }
      } catch (error) {
        console.log(
          `[Sheet] image download failed: ${error instanceof Error ? error.message : error}`,
        )
      } finally {
        clearTimeout(timeout)
      }
    }

    // Cache key: il contenuto ne guida la versione
    const imageForHash =
      typeof data.image === 'string'
        ? data.image
        : data.image
          ? hashContent(data.image.data.toString('base64'))
          : null
    const contentHash = hashContent(
      JSON.stringify({ template: 'mastro-20260904', ...data, image: imageForHash }),
    )
    const storage = getSheetStorage()
    const key = sheetCacheKey(uuid, locale, contentHash)

    // Filename: sanificato (solo ascii-safe), con fallback encoded UTF-8 per caratteri accentati
    const safeTitle = data.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
    const asciiName = `scheda-tecnica-${safeTitle || 'prodotto'}.pdf`
    const filenameStar = `filename*=UTF-8''${encodeURIComponent(`scheda-tecnica-${data.title}.pdf`)}`
    const disposition = `attachment; filename="${asciiName}"; ${filenameStar}`

    const sendPdf = (buffer: Buffer, cache: 'hit' | 'miss' | 'bypass') => {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Length', buffer.length)
      res.setHeader('Content-Disposition', disposition)
      res.setHeader(
        'Cache-Control',
        cache === 'bypass' ? 'private, no-store' : 'private, max-age=3600',
      )
      res.setHeader('X-Sheet-Cache', cache)
      res.send(buffer)
    }

    // Senza credenziali S3: niente cache, download on-demand.
    // Con credenziali: hit dal bucket. Un errore di lettura non blocca la generazione.
    if (storage) {
      try {
        const cached = await storage.getPdf(key)
        if (cached) {
          sendPdf(cached, 'hit')
          return
        }
      } catch (error) {
        console.error('[Sheet] Cache read failed', error)
      }
    }

    // Cache miss o storage assente -> genera il PDF.
    // Passa un ELEMENTO del componente (react-pdf lo renderizza per trovare il Document).
    // `createElement` restituisce il tipo tipizzato sulla function, ma react-pdf
    // si aspetta l'elemento del <Document> ritornato da TechnicalSheetDocument:
    // cast type-level al parametro atteso da renderToBuffer (runtime invariato).
    let generation = generationInFlight.get(key)
    if (!generation) {
      generation = (async () => {
        const doc = createElement(TechnicalSheetDocument, { data })
        const generated = await renderToBuffer(
          doc as unknown as Parameters<typeof renderToBuffer>[0],
        )
        if (storage) {
          try {
            await storage.putPdf(key, generated)
          } catch (error) {
            console.error('[Sheet] Cache write failed', error)
          }
        }
        return generated
      })()
      generationInFlight.set(
        key,
        generation.finally(() => generationInFlight.delete(key)),
      )
    }
    const buffer = await generation

    sendPdf(buffer, storage ? 'miss' : 'bypass')
  } catch (error) {
    console.error(
      '[Sheet] PDF generation error',
      error instanceof Error ? error.stack || error.message : error,
    )
    res.status(500).json({ error: 'Failed to generate technical sheet' })
  }
}