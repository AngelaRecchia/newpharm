import { describe, expect, it } from 'vitest'
import { normalizeContent } from './validateContent'

describe('normalizeContent', () => {
  it('accetta il JSON del plugin', () => {
    expect(
      normalizeContent({
        items: [{ uuid: 'a', text: ' note ' }, { uuid: '' }],
      }),
    ).toEqual({
      items: [{ uuid: 'a', text: 'note' }],
    })
  })

  it('migra i bloks legacy target_pest_item', () => {
    expect(
      normalizeContent([
        { component: 'target_pest_item', insect: 'uuid-1', text: 'custom' },
      ]),
    ).toEqual({
      items: [{ uuid: 'uuid-1', text: 'custom' }],
    })
  })

  it('torna vuoto su input invalido', () => {
    expect(normalizeContent(null)).toEqual({ items: [] })
    expect(normalizeContent('')).toEqual({ items: [] })
  })
})
