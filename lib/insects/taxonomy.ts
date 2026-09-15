/**
 * Tassonomia infestanti (Guida infestanti + scheda `insect`).
 * Slug stabili per CMS, filtri URL e i18n (chiave = value).
 */

export const INSECT_MACRO_CATEGORIES = [
  { value: 'insetti_volanti', label: 'Insetti volanti' },
  { value: 'insetti_striscianti', label: 'Insetti striscianti' },
  { value: 'infestanti_delle_derrate', label: 'Infestanti delle derrate' },
  { value: 'rettili_e_anfibi', label: 'Rettili e anfibi' },
  { value: 'uccelli', label: 'Uccelli' },
  { value: 'roditori', label: 'Roditori' },
  { value: 'infestanti_del_legno', label: 'Infestanti del legno' },
  { value: 'ragni', label: 'Ragni' },
  { value: 'zecche_e_acari', label: 'Zeche e acari' },
] as const

export const PEST_FAMILY_OPTIONS = [
  { value: 'zanzare', label: 'Zanzare' },
  { value: 'mosche', label: 'Mosche' },
  { value: 'vespe', label: 'Vespe' },
  { value: 'calabroni', label: 'Calabroni' },
  { value: 'formiche', label: 'Formiche' },
  { value: 'blatte', label: 'Blatte' },
  { value: 'pesciolini_d_argento', label: "Pesciolini d'argento" },
  { value: 'termiti', label: 'Termiti' },
  { value: 'tarli_cerambicidi', label: 'Tarli cerambicidi' },
  { value: 'tarli_siricidi', label: 'Tarli siricidi' },
  { value: 'cimici_dei_letti', label: 'Cimici dei letti' },
  { value: 'cimici', label: 'Cimici' },
  { value: 'zecche', label: 'Zeche' },
  { value: 'pulci', label: 'Pulci' },
  { value: 'pidocchi', label: 'Pidocchi' },
  { value: 'acari', label: 'Acari' },
  { value: 'acaro_pollino', label: 'Acaro pollino' },
  { value: 'tarme', label: 'Tarme' },
  { value: 'coleottero_dei_tappeti', label: 'Coleottero dei tappeti' },
  { value: 'ratto_grigio', label: 'Ratto grigio' },
  { value: 'ratto_nero', label: 'Ratto nero' },
  { value: 'topolino_domestico', label: 'Topolino domestico' },
  { value: 'piccioni', label: 'Piccioni' },
  { value: 'insetti_delle_derrate', label: 'Insetti delle derrate' },
] as const

export type InsectCategory = (typeof INSECT_MACRO_CATEGORIES)[number]['value']
export type PestFamily = (typeof PEST_FAMILY_OPTIONS)[number]['value']

/** Valori legacy → slug attuali (macro categoria). */
export const INSECT_CATEGORY_ALIASES: Record<string, InsectCategory> = {
  volanti: 'insetti_volanti',
  striscianti: 'insetti_striscianti',
  insetti_delle_derrate: 'infestanti_delle_derrate',
  volatili: 'uccelli',
}

export function storyblokOptions(
  items: ReadonlyArray<{ value: string; label: string }>,
): Array<{ name: string; value: string }> {
  return items.map(({ value, label }) => ({ name: label, value }))
}
