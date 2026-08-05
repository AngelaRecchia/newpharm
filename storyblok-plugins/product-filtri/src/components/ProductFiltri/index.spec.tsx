import { describe, expect, it } from 'vitest'
import {
  getSubfiltersForCategory,
  parseFiltriEntries,
} from '../../lib/filtri'
import { normalizeContent } from '../../lib/validateContent'

const sample = [
  { name: '[CATEGORIA] Insetticidi e acaricidi', value: 'category__insetticidi-e-acaricidi' },
  { name: '[INSETTICIDI E ACARICIDI] Formica', value: 'pest__formica' },
  { name: '[INSETTICIDI E ACARICIDI] Zanzare', value: 'pest__zanzare' },
  { name: '[CATEGORIA] Monitoraggio', value: 'category__monitoraggio' },
  { name: '[MONITORAGGIO] Topi', value: 'monitor__topi' },
]

describe('parseFiltriEntries', () => {
  it('separa categorie e sottofiltri', () => {
    const parsed = parseFiltriEntries(sample)
    expect(parsed.categories).toHaveLength(2)
    expect(parsed.subfilters).toHaveLength(3)
  })

  it('filtra sottofiltri per categoria', () => {
    const parsed = parseFiltriEntries(sample)
    const subs = getSubfiltersForCategory('category__insetticidi-e-acaricidi', parsed)
    expect(subs.map((s) => s.value)).toEqual(['pest__formica', 'pest__zanzare'])
  })
})

describe('normalizeContent', () => {
  it('normalizza valore valido', () => {
    expect(
      normalizeContent({
        category: 'category__monitoraggio',
        subcategories: ['monitor__topi'],
      }),
    ).toEqual({
      category: 'category__monitoraggio',
      subcategories: ['monitor__topi'],
    })
  })

  it('gestisce valore vuoto', () => {
    expect(normalizeContent(null)).toEqual({ category: '', subcategories: [] })
  })
})
