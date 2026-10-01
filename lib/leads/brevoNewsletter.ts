interface BrevoSubscribeInput {
  email: string
  firstName: string
  lastName: string
  companyName: string
}

export async function subscribeContactToBrevoNewsletter(
  input: BrevoSubscribeInput,
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const listIdRaw = process.env.BREVO_NEWSLETTER_LIST_ID?.trim()
  if (!apiKey || !listIdRaw) return

  const listId = Number.parseInt(listIdRaw, 10)
  if (!Number.isFinite(listId)) {
    console.error('[Brevo] invalid BREVO_NEWSLETTER_LIST_ID', listIdRaw)
    return
  }

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      email: input.email,
      updateEnabled: true,
      listIds: [listId],
      attributes: {
        FNAME: input.firstName,
        LNAME: input.lastName,
        COMPANY: input.companyName,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[Brevo] newsletter subscribe failed', res.status, text)
  }
}
