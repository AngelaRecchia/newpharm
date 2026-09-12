import {
  parseProjectDivisions,
  sortProjectDivisions,
  type ProjectDivision,
} from '@/lib/projects/divisions'

export const DIVISION_QUERY_PARAM = 'division'

type SearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'>

export function parseDivisionSearchParams(
  searchParams: SearchParamsLike,
): ProjectDivision[] {
  return parseProjectDivisions(searchParams.get(DIVISION_QUERY_PARAM))
}

export function buildDivisionSearchParams(
  current: SearchParamsLike,
  divisions: ProjectDivision[],
): URLSearchParams {
  const params = new URLSearchParams(current.toString())
  const sorted = sortProjectDivisions(divisions)

  params.delete(DIVISION_QUERY_PARAM)
  if (sorted.length > 0) {
    params.set(DIVISION_QUERY_PARAM, sorted.join(','))
  }

  return params
}
