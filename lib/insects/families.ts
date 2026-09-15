import {
  PEST_FAMILY_OPTIONS,
  type PestFamily,
} from './taxonomy'

export type { PestFamily }

export const PEST_FAMILIES: readonly PestFamily[] = PEST_FAMILY_OPTIONS.map(
  (item) => item.value,
)

const FAMILY_SET = new Set<string>(PEST_FAMILIES)

export type PestIconType = `pest-${PestFamily}`

export const PEST_FAMILY_ICON = Object.fromEntries(
  PEST_FAMILIES.map((family) => [family, `pest-${family}` as PestIconType]),
) as Record<PestFamily, PestIconType>

export function isPestFamily(value: string): value is PestFamily {
  return FAMILY_SET.has(value)
}

export function parsePestFamily(raw: unknown): PestFamily | null {
  if (typeof raw !== 'string' || !raw.trim()) return null

  const normalized = raw.trim().toLocaleLowerCase('it-IT').replace(/\s+/g, '_')
  const aliases: Record<string, PestFamily> = {
    blatta: 'blatte',
    blatte: 'blatte',
    mosca: 'mosche',
    mosche: 'mosche',
    vespa: 'vespe',
    vespe: 'vespe',
    zanzara: 'zanzare',
    zanzare: 'zanzare',
    formica: 'formiche',
    formiche: 'formiche',
    calabrone: 'calabroni',
    calabroni: 'calabroni',
    scarafaggio: 'blatte',
    scarafaggi: 'blatte',
    pesciolini_dargento: 'pesciolini_d_argento',
    "pesciolini_d'argento": 'pesciolini_d_argento',
    termite: 'termiti',
    termiti: 'termiti',
    cimice: 'cimici',
    cimici: 'cimici',
    pulce: 'pulci',
    pulci: 'pulci',
    pidocchio: 'pidocchi',
    pidocchi: 'pidocchi',
    acaro: 'acari',
    acari: 'acari',
    tignola: 'tarme',
    tarme: 'tarme',
    zecca: 'zecche',
    zecche: 'zecche',
    piccione: 'piccioni',
    piccioni: 'piccioni',
  }

  const resolved = aliases[normalized] ?? normalized
  return isPestFamily(resolved) ? resolved : null
}

export function getPestFamilyLabel(value: PestFamily): string {
  return PEST_FAMILY_OPTIONS.find((item) => item.value === value)?.label ?? value
}
