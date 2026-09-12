export type SearchDocumentType = 'product' | 'project' | 'story' | 'downloadable'

export interface SearchDocument {
  id: string
  uuid: string
  type: SearchDocumentType
  locale: string
  slug: string
  name: string
  title: string
  secondary_title?: string | null
  description?: string | null
  image?: unknown
  category?: string | null
  tags?: string[]
}

export interface SearchResultSection {
  type: SearchDocumentType
  label: string
  items: SearchDocument[]
}

export interface SearchResponse {
  query: string
  results: SearchResultSection[]
}
