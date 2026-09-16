import { describe, expect, it } from 'vitest'
import { normalizeContent } from './validateContent'

describe('normalizeContent carousel prodotto', () => {
  it('preserva la selezione manuale e gli items', () => {
    const normalized = normalizeContent({
      variant: 'prodotto',
      selection_mode: 'manual',
      items: ['uuid-1', 'uuid-2'],
      context: 'carousel',
    })

    expect(normalized).toMatchObject({
      variant: 'prodotto',
      selection_mode: 'manual',
      items: ['uuid-1', 'uuid-2'],
      context: 'carousel',
      bestseller: false,
      category: '',
    })
  })

  it('infersce manuale se ci sono items senza selection_mode', () => {
    const normalized = normalizeContent({
      variant: 'prodotto',
      items: ['uuid-1'],
      context: 'carousel',
    })

    expect(normalized.selection_mode).toBe('manual')
    expect(normalized.items).toEqual(['uuid-1'])
  })

  it('resta dinamica senza items e senza selection_mode', () => {
    const normalized = normalizeContent({
      variant: 'prodotto',
      context: 'carousel',
      bestseller: true,
      category: 'rodenticidi',
    })

    expect(normalized).toMatchObject({
      variant: 'prodotto',
      selection_mode: 'dynamic',
      items: [],
      bestseller: true,
      category: 'rodenticidi',
      context: 'carousel',
    })
  })
})

describe('normalizeContent carousel infestante', () => {
  it('accetta infestante come variante canonica', () => {
    const normalized = normalizeContent({
      variant: 'infestante',
      selection_mode: 'all',
      items: ['uuid-1'],
      context: 'carousel',
    })

    expect(normalized).toMatchObject({
      variant: 'infestante',
      selection_mode: 'all',
      items: ['uuid-1'],
      context: 'carousel',
    })
  })

  it('carousel insetto legacy diventa infestante', () => {
    const normalized = normalizeContent({
      variant: 'insetto',
      selection_mode: 'all',
      items: ['uuid-1'],
      context: 'carousel',
    })

    expect(normalized.variant).toBe('infestante')
    expect(normalized.items).toEqual(['uuid-1'])
  })

  it('listing insetto resta insetto', () => {
    const normalized = normalizeContent({
      variant: 'insetto',
      selection_mode: 'all',
      items: ['uuid-1'],
    })

    expect(normalized.variant).toBe('insetto')
    expect(normalized.items).toEqual(['uuid-1'])
  })
})
