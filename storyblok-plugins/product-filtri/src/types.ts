export type FiltriEntry = {
  id?: number
  name: string
  value: string
}

export type ProductFiltriValue = {
  category: string
  subcategories: string[]
}

export const EMPTY_VALUE: ProductFiltriValue = {
  category: '',
  subcategories: [],
}
