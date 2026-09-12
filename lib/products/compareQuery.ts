export const COMPARE_PRODUCTS_PARAM = 'products'
export const COMPARE_SLOT_COUNT = 2

type SearchParamsLike = Pick<URLSearchParams, 'get'>

function normalizeUuids(raw: string | null): [string | null, string | null] {
  if (!raw) return [null, null]

  const seen = new Set<string>()
  const uuids: string[] = []

  for (const part of raw.split(',')) {
    const uuid = part.trim()
    if (!uuid || seen.has(uuid)) continue
    seen.add(uuid)
    uuids.push(uuid)
    if (uuids.length >= COMPARE_SLOT_COUNT) break
  }

  return [uuids[0] ?? null, uuids[1] ?? null]
}

export function parseCompareProductsSearchParams(
  searchParams: SearchParamsLike,
): [string | null, string | null] {
  return normalizeUuids(searchParams.get(COMPARE_PRODUCTS_PARAM))
}

export function buildCompareProductsSearchParams(
  uuids: (string | null | undefined)[],
): URLSearchParams {
  const params = new URLSearchParams()
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const raw of uuids) {
    const uuid = raw?.trim()
    if (!uuid || seen.has(uuid)) continue
    seen.add(uuid)
    normalized.push(uuid)
    if (normalized.length >= COMPARE_SLOT_COUNT) break
  }

  if (normalized.length > 0) {
    params.set(COMPARE_PRODUCTS_PARAM, normalized.join(','))
  }

  return params
}

export function slotsEqual(
  a: [string | null, string | null],
  b: [string | null, string | null],
): boolean {
  return a[0] === b[0] && a[1] === b[1]
}
