import { NextResponse } from 'next/server'

/**
 * Lead "Richiedi informazioni" dal dettaglio prodotto.
 *
 * Riceve nome, cognome, email, settore (+ prodotto di riferimento) e
 * registra la richiesta. Per ora il delivery è un log strutturato:
 * l'integrazione col provider email (Resend/SES/Mailgun) va configurata
 * con le env `LEAD_WEBHOOK_URL` oppure aggiungendo qui il provider scelto.
 *
 * La validazione reCAPTCHA v2 segue lo stesso pattern di /api/recaptcha/verify.
 */

interface LeadProductBody {
  name?: string
  surname?: string
  email?: string
  sector?: string
  productTitle?: string
  recaptchaToken?: string
  acceptedTerms?: boolean
  newsletter?: boolean
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: Request) {
  // reCAPTCHA opzionale: se il site key è configurato, il token è obbligatorio
  const recaptchaEnabled = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim())
  if (recaptchaEnabled) {
    const secret = process.env.RECAPTCHA_SECRET_KEY
    let body: { token?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    const token = body.token?.trim()
    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 })
    }

    if (!secret?.trim()) {
      return NextResponse.json(
        { error: 'recaptcha_not_configured' },
        { status: 503 },
      )
    }

    const params = new URLSearchParams()
    params.set('secret', secret)
    params.set('response', token)

    const verifyRes = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      },
    )
    const verifyData = (await verifyRes.json()) as { success?: boolean }
    if (!verifyData.success) {
      return NextResponse.json({ error: 'verification_failed' }, { status: 400 })
    }
  }

  let body: LeadProductBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  const surname = (body.surname ?? '').trim()
  const email = (body.email ?? '').trim()
  const sector = (body.sector ?? '').trim()
  const productTitle = (body.productTitle ?? '').trim()

  if (!name || !surname || !email) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }
  if (!body.acceptedTerms) {
    return NextResponse.json({ error: 'terms_required' }, { status: 400 })
  }

  // Registra la lead (log strutturato — sostituisci con il tuo provider email)
  console.log('[Lead:Product]', JSON.stringify({
    name,
    surname,
    email,
    sector: sector || null,
    productTitle: productTitle || null,
    newsletter: Boolean(body.newsletter),
    at: new Date().toISOString(),
  }))

  // Webhook opzionale per inoltrare la lead a un servizio esterno
  const webhookUrl = process.env.LEAD_WEBHOOK_URL?.trim()
  if (webhookUrl) {
    void fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'product_request',
        name,
        surname,
        email,
        sector: sector || null,
        productTitle: productTitle || null,
        newsletter: Boolean(body.newsletter),
      }),
    }).catch((error) => {
      console.error('[Lead:Product] webhook failed', error)
    })
  }

  return NextResponse.json({ success: true })
}