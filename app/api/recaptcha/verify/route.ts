import { NextResponse } from 'next/server'

/**
 * Verifica token reCAPTCHA v2 con Google siteverify.
 * La secret non deve mai essere esposta al client.
 */
export async function POST(request: Request) {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret?.trim()) {
    return NextResponse.json(
      { success: false, error: 'not_configured' },
      { status: 503 }
    )
  }

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_json' }, { status: 400 })
  }

  const token = body.token?.trim()
  if (!token) {
    return NextResponse.json({ success: false, error: 'missing_token' }, { status: 400 })
  }

  const params = new URLSearchParams()
  params.set('secret', secret)
  params.set('response', token)

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }

  if (!data.success) {
    return NextResponse.json(
      { success: false, error: 'verification_failed', codes: data['error-codes'] },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true })
}
