export const COMPANY_TYPE_OPTIONS = [
  {
    value: 'allevamenti',
    label:
      'Allevamenti (bovini, suini, ovini, cunicoli, equini ecc..)',
  },
  { value: 'allevamenti_avicoli', label: 'Allevamenti avicoli' },
  { value: 'azienda_agricola', label: 'Azienda agricola' },
  { value: 'sanita_ospedali', label: 'Sanità / Ospedali' },
  { value: 'enti_pubblici', label: 'Enti pubblici / Municipalizzata' },
  { value: 'industria_gdo', label: 'Industria / GDO' },
  { value: 'industria_agroalimentare', label: 'Industria Agroalimentare' },
  { value: 'industria_carni', label: 'Industria lavorazione carni' },
  { value: 'stoccaggio', label: 'Stoccaggio' },
  {
    value: 'ristorazione_hotellerie',
    label: 'Ristorante / Bar / Catering / Hotellerie',
  },
  {
    value: 'manutentori_verde',
    label: 'Manutentori del verde / Vivaisti / Forestale',
  },
  { value: 'imprese_pulizie', label: 'Imprese di pulizie / Facility' },
  {
    value: 'disinfestazione_pco',
    label: 'Impresa di disinfestazione / PCO',
  },
  {
    value: 'rivenditori_grossisti',
    label: 'Rivenditori / Grossisti / Consorzi Agrari',
  },
  { value: 'altro', label: 'Altro' },
] as const

export type CompanyTypeValue = (typeof COMPANY_TYPE_OPTIONS)[number]['value']

export function companyTypeLabel(value: string): string {
  const found = COMPANY_TYPE_OPTIONS.find((o) => o.value === value)
  return found?.label ?? value
}
