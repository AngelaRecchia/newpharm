import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { clearCacheVersion } from '@/lib/api/storyblok/config'

/**
 * Storyblok Webhook Handler
 *
 * Receives webhooks from Storyblok when content changes (stories, datasources, etc.)
 * and triggers on-demand ISR revalidation.
 *
 * Setup in Storyblok:
 *   Settings > Webhooks > New Webhook
 *   URL: https://<your-domain>/api/webhooks/storyblok
 *   Events: story.published, story.unpublished, story.deleted,
 *           datasource.entries_updated
 *
 * Security: validates the space_id in the payload matches our space.
 * If STORYBLOK_WEBHOOK_SECRET is set, also checks the webhook-signature header.
 */

const WEBHOOK_SECRET = process.env.STORYBLOK_WEBHOOK_SECRET
const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID

export async function POST(request: NextRequest) {
  // If a secret is configured, verify signature
  if (WEBHOOK_SECRET) {
    const signature = request.headers.get('webhook-signature')
    if (signature !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  try {
    const body = await request.json()

    // Verify the request comes from our Storyblok space
    const payloadSpaceId = String(body?.space_id || '')
    if (SPACE_ID && payloadSpaceId !== SPACE_ID) {
      return NextResponse.json({ error: 'Invalid space' }, { status: 403 })
    }

    // Storyblok webhook payload includes action and story/datasource info
    const action: string = body?.action || ''
    const storyFullSlug: string = body?.full_slug || body?.story?.full_slug || ''

    // Clear the cached cv so next request fetches fresh data
    clearCacheVersion()

    // Determine what to revalidate based on the event
    if (action.startsWith('datasource')) {
      // Datasource changes affect all pages (translations, labels, etc.)
      revalidatePath('/', 'layout')
    } else if (storyFullSlug) {
      // Story change — revalidate the specific path + layout (for header/footer)
      revalidatePath(`/${storyFullSlug}`, 'page')
      revalidatePath('/', 'layout')
    } else {
      // Unknown event — revalidate everything
      revalidatePath('/', 'layout')
    }

    return NextResponse.json({
      revalidated: true,
      action,
      slug: storyFullSlug || null,
    })
  } catch (error) {
    console.error('[Webhook] Error processing Storyblok webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
