export type MosaicImageRatio = '3/2' | '3/4' | '13/9'

export type MosaicSpan = 3 | 6 | 12

export type MosaicSlot = {
  ratio: MosaicImageRatio
  desktopSpan: MosaicSpan
  tabletSpan: MosaicSpan
  rowSpan?: 2
}

export const MOSAIC_SLOTS: readonly MosaicSlot[] = [
  { ratio: '3/2', desktopSpan: 6, tabletSpan: 6 },
  { ratio: '3/2', desktopSpan: 6, tabletSpan: 6 },
  { ratio: '3/2', desktopSpan: 6, tabletSpan: 12 },
  { ratio: '3/4', desktopSpan: 3, tabletSpan: 6 },
  { ratio: '3/4', desktopSpan: 3, tabletSpan: 6 },
  { ratio: '13/9', desktopSpan: 6, tabletSpan: 6, rowSpan: 2 },
  { ratio: '3/4', desktopSpan: 6, tabletSpan: 6 },
  { ratio: '3/4', desktopSpan: 6, tabletSpan: 6 },
  { ratio: '3/2', desktopSpan: 6, tabletSpan: 6 },
  { ratio: '13/9', desktopSpan: 6, tabletSpan: 6 },
  { ratio: '3/4', desktopSpan: 3, tabletSpan: 6 },
  { ratio: '3/4', desktopSpan: 3, tabletSpan: 6 },
  { ratio: '3/4', desktopSpan: 3, tabletSpan: 6 },
  { ratio: '3/4', desktopSpan: 3, tabletSpan: 6 },
]

export const MOSAIC_CYCLE = MOSAIC_SLOTS.length

/** Prima card della riga 2 nel ciclo (3/2 + due 3/4, larghezze 2:1:1). */
export const MOSAIC_ROW2_START = 2
export const MOSAIC_ROW2_COUNT = 3

export function getMosaicSlot(index: number): MosaicSlot {
  return MOSAIC_SLOTS[index % MOSAIC_CYCLE]
}

export type MosaicRenderItem<T> = {
  item: T
  index: number
  slot: MosaicSlot
}

export type MosaicRenderGroup<T> =
  | { type: 'cell'; item: T; index: number; slot: MosaicSlot }
  | { type: 'row2'; items: MosaicRenderItem<T>[] }

/** Raggruppa la riga 2 così le larghezze sono 2fr 1fr 1fr e 3/2 + 3/4 hanno la stessa altezza. */
export function groupMosaicItems<T>(items: T[]): MosaicRenderGroup<T>[] {
  const groups: MosaicRenderGroup<T>[] = []
  let i = 0

  while (i < items.length) {
    const pos = i % MOSAIC_CYCLE
    const canGroupRow2 =
      pos === MOSAIC_ROW2_START && i + MOSAIC_ROW2_COUNT <= items.length

    if (canGroupRow2) {
      groups.push({
        type: 'row2',
        items: Array.from({ length: MOSAIC_ROW2_COUNT }, (_, offset) => ({
          item: items[i + offset],
          index: i + offset,
          slot: getMosaicSlot(i + offset),
        })),
      })
      i += MOSAIC_ROW2_COUNT
      continue
    }

    groups.push({
      type: 'cell',
      item: items[i],
      index: i,
      slot: getMosaicSlot(i),
    })
    i += 1
  }

  return groups
}

export function mosaicRatioClass(ratio: MosaicImageRatio): string {
  return `ratio-${ratio.replace('/', '-')}`
}
