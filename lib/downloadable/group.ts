import { PROJECT_DIVISIONS } from '@/lib/projects/divisions'
import type { DownloadPreviewGroup, DownloadPreviewItem } from './types'

export function groupByYear(items: DownloadPreviewItem[]): DownloadPreviewGroup[] {
  const buckets = new Map<number, DownloadPreviewItem[]>()

  for (const item of items) {
    const year = item.year ?? 0
    const list = buckets.get(year)
    if (list) list.push(item)
    else buckets.set(year, [item])
  }

  return [...buckets.keys()]
    .sort((a, b) => b - a)
    .map((year) => ({
      heading: year > 0 ? String(year) : undefined,
      items: buckets.get(year) ?? [],
    }))
}

export function groupByDivision(
  items: DownloadPreviewItem[],
  labelForDivision: (division: string) => string,
): DownloadPreviewGroup[] {
  const groups: DownloadPreviewGroup[] = []

  for (const division of PROJECT_DIVISIONS) {
    const list = items.filter((item) => item.divisions?.includes(division))
    if (list.length === 0) continue
    groups.push({ heading: labelForDivision(division), items: list })
  }

  const rest = items.filter((item) => !item.divisions?.length)
  if (rest.length > 0) {
    groups.push({ items: rest })
  }

  return groups
}

export function sliceGroupedItems(
  groups: DownloadPreviewGroup[],
  visibleCount: number,
): DownloadPreviewGroup[] {
  let remaining = visibleCount
  const visible: DownloadPreviewGroup[] = []

  for (const group of groups) {
    if (remaining <= 0) break
    const items = group.items.slice(0, remaining)
    remaining -= items.length
    if (items.length > 0) {
      visible.push({ heading: group.heading, items })
    }
  }

  return visible
}

export function countGroupedItems(groups: DownloadPreviewGroup[]): number {
  let total = 0
  for (const group of groups) total += group.items.length
  return total
}
