import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyRecaptchaToken } from '@/lib/api/recaptcha/verifyToken'
import { subscribeContactToBrevoNewsletter } from '@/lib/leads/brevoNewsletter'
import { COMPANY_TYPE_OPTIONS } from '@/lib/leads/companyTypes'
import {
  buildContactLeadEmailHtml,
  type ContactLeadPayload,
} from '@/lib/leads/contactEmailHtml'
import { isEmail } from '@/lib/leads/isEmail'

const VALID_COMPANY_TYPES = new Set<string>(
  COMPANY_TYPE_OPTIONS.map((o) => o.value),
)

interface ContactLeadBody {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  vatOrTaxCode?: string
  companyType?: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  companyName?: string
  message?: string
  recaptchaToken?: string
  acceptedTerms?: boolean
  newsletter?: boolean
}

function trimField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parsePayload(body: ContactLeadBody): ContactLeadPayload | null {
  const firstName = trimField(body.firstName)
  const lastName = trimField(body.lastName)
  const phone = trimField(body.phone)
  const email = trimField(body.email)
  const vatOrTaxCode = trimField(body.vatOrTaxCode)
  const companyType = trimField(body.companyType)
  const address = trimField(body.address)
  const city = trimField(body.city)
  const province = trimField(body.province)
  const postalCode = trimField(body.postalCode)
  const country = trimField(body.country)
  const companyName = trimField(body.companyName)
  const message = trimField(body.message)

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !email ||
    !vatOrTaxCode ||
    !companyType ||
    !address ||
    !city ||
    !province ||
    !postalCode ||
    !country ||
    !companyName ||
    !message
  ) {
    return null
  }

  if (!isEmail(email)) return null
  if (!VALID_COMPANY_TYPES.has(companyType)) {
    return null
  }

  return {
    firstName,
    lastName,
    phone,
    email,
    vatOrTaxCode,
    companyType,
    address,
    city,
    province,
    postalCode,
    country,
    companyName,
    message,
  }
}

export async function POST(request: Request) {
  const resendKey = process.env.RESEND_API_KEY?.trim()
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim()
  const toEmail =
    process.env.CONTACT_TO_EMAIL?.trim() || 'info@newpharm.it'

  if (!resendKey || !fromEmail) {
    return NextResponse.json({ error: 'mail_not_configured' }, { status: 503 })
  }

  let body: ContactLeadBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.acceptedTerms) {
    return NextResponse.json({ error: 'terms_required' }, { status: 400 })
  }

  const recaptchaEnabled = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim(),
  )
  if (recaptchaEnabled) {
    const token = trimField(body.recaptchaToken)
    if (!token) {
      return NextResponse.json({ error: 'missing_recaptcha' }, { status: 400 })
    }
    const valid = await verifyRecaptchaToken(token)
    if (!valid) {
      return NextResponse.json({ error: 'recaptcha_failed' }, { status: 400 })
    }
  }

  const payload = parsePayload(body)
  if (!payload) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const resend = new Resend(resendKey)
  const html = buildContactLeadEmailHtml(payload)

  const sendResult = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: payload.email,
    subject: 'Contatti',
    html,
  })

  if (sendResult.error) {
    console.error('[Lead:Contact] Resend error', sendResult.error)
    return NextResponse.json({ error: 'send_failed' }, { status: 502 })
  }

  if (body.newsletter) {
    void subscribeContactToBrevoNewsletter({
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      companyName: payload.companyName,
    })
  }

  return NextResponse.json({ success: true })
}
