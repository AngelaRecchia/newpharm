import { companyTypeLabel } from '@/lib/leads/companyTypes'
import { escapeHtml } from '@/lib/leads/escapeHtml'

export interface ContactLeadPayload {
  firstName: string
  lastName: string
  phone: string
  email: string
  vatOrTaxCode: string
  companyType: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  companyName: string
  message: string
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;font-weight:600;color:#333;">${escapeHtml(label)}</td><td style="padding:8px 0;color:#111;">${escapeHtml(value)}</td></tr>`
}

export function buildContactLeadEmailHtml(payload: ContactLeadPayload): string {
  const companyType = companyTypeLabel(payload.companyType)
  const rows = [
    row('Nome', payload.firstName),
    row('Cognome', payload.lastName),
    row('Telefono', payload.phone),
    row('Email', payload.email),
    row('P.IVA/C.Fiscale', payload.vatOrTaxCode),
    row('Tipologia azienda', companyType),
    row('Indirizzo', payload.address),
    row('Località', payload.city),
    row('Provincia', payload.province),
    row('CAP', payload.postalCode),
    row('Stato', payload.country),
    row('Azienda / Ragione sociale', payload.companyName),
    row('Messaggio', payload.message),
  ].join('')

  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;"><p>Nuova richiesta dal form <strong>Diventa un cliente Newpharm</strong>.</p><table style="border-collapse:collapse;max-width:640px;">${rows}</table></body></html>`
}
