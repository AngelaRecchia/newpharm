export const PROJECT_DIVISIONS = [
  'cereals-storage',
  'pest-control',
  'zootech',
  'home-garden',
  'medical',
] as const

export type ProjectDivision = (typeof PROJECT_DIVISIONS)[number]

const DIVISION_SET = new Set<string>(PROJECT_DIVISIONS)

export function isProjectDivision(value: string): value is ProjectDivision {
  return DIVISION_SET.has(value)
}

export function sortProjectDivisions(values: ProjectDivision[]): ProjectDivision[] {
  return PROJECT_DIVISIONS.filter((division) => values.includes(division))
}

export function parseProjectDivisions(raw: unknown): ProjectDivision[] {
  const tokens: string[] = []

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.trim()) {
        tokens.push(item.trim())
      }
    }
  } else if (typeof raw === 'string' && raw.trim()) {
    for (const part of raw.split(',')) {
      const token = part.trim()
      if (token) tokens.push(token)
    }
  }

  return sortProjectDivisions(tokens.filter(isProjectDivision))
}
