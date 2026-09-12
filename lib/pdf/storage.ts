import { createHash } from 'crypto'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { S3Client as S3ClientType } from '@aws-sdk/client-s3'

/**
 * Storage per i PDF delle schede tecniche.
 *
 * Architectura portabile: S3-compatible (funziona con Cloudflare R2, AWS S3,
 * Backblaze B2...). Su Vercel e su qualsiasi server Node.
 *
 * Se le env non sono configurate, fa un fallback in-memory (senza cache
 * persistente) per sviluppo locale — cos la feature funziona subito e si
 * attiva S3 quando si aggiunge il provider.
 *
 * Env richieste (vedi .env.example):
 *   PDF_STORAGE_ENDPOINT   https://<account>.r2.cloudflarestorage.com (o S3)
 *   PDF_STORAGE_REGION     auto per R2 / es. eu-central-1 per S3
 *   PDF_STORAGE_ACCESS_KEY_ID
 *   PDF_STORAGE_SECRET_ACCESS_KEY
 *   PDF_STORAGE_BUCKET
 */

function isConfigured(): boolean {
  return Boolean(
    process.env.PDF_STORAGE_ENDPOINT &&
      process.env.PDF_STORAGE_ACCESS_KEY_ID &&
      process.env.PDF_STORAGE_SECRET_ACCESS_KEY &&
      process.env.PDF_STORAGE_BUCKET,
  )
}

let client: S3ClientType | null = null

function getClient(): S3ClientType {
  if (client) return client
  client = new S3Client({
    region: process.env.PDF_STORAGE_REGION || 'auto',
    endpoint: process.env.PDF_STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: process.env.PDF_STORAGE_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.PDF_STORAGE_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  })
  return client
}

const BUCKET = (): string => process.env.PDF_STORAGE_BUCKET || ''

/**
 * Cache key del PDF: uuid + locale + hash del contenuto.
 * Il contenuto è già nel nome: quando il prodotto cambia, key cambia →
 * il PDF vecchio resta, il nuovo viene rigenerato.
 */
export function sheetCacheKey(uuid: string, locale: string, contentHash: string): string {
  return `sheets/${locale}/${uuid}-${contentHash}.pdf`
}

/** Hash del contenuto (per la cache key). */
export function hashContent(payload: string): string {
  return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

export interface SheetStorage {
  getPdf(key: string): Promise<Buffer | null>
  putPdf(key: string, buffer: Buffer): Promise<void>
}

const inMemory = new Map<string, Buffer>()

const memoryStorage: SheetStorage = {
  async getPdf(key) {
    return inMemory.get(key) ?? null
  },
  async putPdf(key, buffer) {
    inMemory.set(key, buffer)
  },
}

export function getSheetStorage(): SheetStorage {
  if (isConfigured()) {
    return {
      async getPdf(key) {
        try {
          const response = await getClient().send(
            new GetObjectCommand({ Bucket: BUCKET(), Key: key }),
          )
          if (!response.Body) return null
          const stream = response.Body as AsyncIterable<Uint8Array>
          const chunks: Uint8Array[] = []
          for await (const chunk of stream) {
            chunks.push(chunk)
          }
          return Buffer.concat(chunks)
        } catch (error) {
          const details = error as {
            name?: string
            $metadata?: { httpStatusCode?: number }
          }
          if (
            details.name === 'NoSuchKey' ||
            details.name === 'NotFound' ||
            details.$metadata?.httpStatusCode === 404
          ) {
            return null
          }
          throw error
        }
      },
      async putPdf(key, buffer) {
        await getClient().send(
          new PutObjectCommand({
            Bucket: BUCKET(),
            Key: key,
            Body: buffer,
            ContentType: 'application/pdf',
          }),
        )
      },
    }
  }

  return memoryStorage
}