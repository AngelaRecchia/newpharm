import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * API Route per invalidare la cache di Storyblok
 * Chiamata automaticamente quando il bridge di Storyblok rileva un cambio
 */
export async function POST() {
  try {
    const cacheDir = path.join(process.cwd(), '.cache', 'storyblok')

    // Verifica se la directory esiste
    try {
      await fs.access(cacheDir)
    } catch {
      // Directory non esiste, niente da cancellare
      return NextResponse.json({ success: true, message: 'Cache directory does not exist' })
    }

    // Leggi tutti i file nella directory
    const files = await fs.readdir(cacheDir)

    // Cancella tutti i file
    await Promise.all(
      files.map((file) => {
        const filePath = path.join(cacheDir, file)
        return fs.unlink(filePath).catch(() => {
          // Ignora errori se il file non esiste
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: `Invalidated ${files.length} cache files`,
    })
  } catch (error) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}
