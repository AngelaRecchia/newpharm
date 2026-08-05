import type { ProductBarItem } from './productBarTypes'

export function downloadAllSafetySheets(items: ProductBarItem[]) {
  for (const item of items) {
    if (!item.safetySheetHref) continue
    window.open(item.safetySheetHref, '_blank', 'noopener,noreferrer')
  }
}
