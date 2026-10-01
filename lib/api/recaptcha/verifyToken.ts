export async function verifyRecaptchaToken(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim()
  if (!secret) return false

  const params = new URLSearchParams()
  params.set('secret', secret)
  params.set('response', token)

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = (await res.json()) as { success?: boolean }
  return Boolean(data.success)
}
