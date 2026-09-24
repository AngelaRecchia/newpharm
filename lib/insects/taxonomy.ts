/**
 * Macro categorie della Guida infestanti.
 * Le famiglie sono story `insect_family`, non un elenco in codice.
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

export type InsectCategory = (typeof INSECT_MACRO_CATEGORIES)[number]['value']

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
