export const PEST_FAMILIES = [
  'blatte',
  'mosche',
  'vespe',
  'zanzare',
  'formiche',
] as const

export type PestFamily = (typeof PEST_FAMILIES)[number]

const FAMILY_SET = new Set<string>(PEST_FAMILIES)

export function isPestFamily(value: string): value is PestFamily {
  return FAMILY_SET.has(value)
}

export function parsePestFamily(raw: unknown): PestFamily | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  return isPestFamily(raw) ? raw : null
}

export const PEST_FAMILY_ICON: Record<PestFamily, `pest-${PestFamily}`> = {
  blatte: 'pest-blatte',
  mosche: 'pest-mosche',
  vespe: 'pest-vespe',
  zanzare: 'pest-zanzare',
  formiche: 'pest-formiche',
}
