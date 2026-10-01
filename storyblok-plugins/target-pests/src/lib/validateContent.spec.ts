import { describe, expect, it } from 'vitest'
import { normalizeContent } from './validateContent'

describe('normalizeContent', () => {
  it('accetta il JSON del plugin con kind', () => {
    expect(
      normalizeContent({
        items: [
          { kind: 'family', uuid: 'fam-1' },
          { kind: 'insect', uuid: 'ins-1' },
          { uuid: 'legacy-ins', text: ' note ' },
          { kind: 'insect', uuid: '' },
        ],
      }),
    ).toEqual({
      items: [
        { kind: 'family', uuid: 'fam-1' },
        { kind: 'insect', uuid: 'ins-1' },
        { kind: 'insect', uuid: 'legacy-ins' },
      ],
    })
  })

  it('migra i bloks legacy target_pest_item', () => {
    expect(
      normalizeContent([
        { component: 'target_pest_item', insect: 'uuid-1', text: 'custom' },
      ]),
    ).toEqual({
      items: [{ kind: 'insect', uuid: 'uuid-1' }],
    })
  })

  it('torna vuoto su input invalido', () => {
    expect(normalizeContent(null)).toEqual({ items: [] })
    expect(normalizeContent('')).toEqual({ items: [] })
  })
})
