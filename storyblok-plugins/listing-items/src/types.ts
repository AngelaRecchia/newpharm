export type ListingVariantSlug = 'prodotto' | 'progetto' | 'insetto' | 'catalogo'

export type CarouselVariantSlug = 'story' | 'prodotto' | 'editorial'

export type PluginVariantSlug = ListingVariantSlug | CarouselVariantSlug

export type ListingImageRatio = 'square' | 'portrait'

export type ListingSelectionMode = 'manual' | 'dynamic' | 'all' | 'tag'

export type CarouselStoryMode = 'dynamic' | 'tag' | 'manual'

export type PluginSelectionMode = ListingSelectionMode | CarouselStoryMode

export type ListingProductVista = 'categoria' | 'application_area'

export type PluginContext = 'carousel' | 'projects_highlight'

export const CAROUSEL_LIMIT = 8

export const STORY_TAGS = [
  'company',
  'r&d',
  'events',
  'people',
  'academy',
  'professional_pest_control',
  'cereals_storage',
  'zootech',
  'home&garden',
] as const

export type StoryTag = (typeof STORY_TAGS)[number]

export const STORY_TAG_LABELS: Record<StoryTag, string> = {
  company: 'Company',
  'r&d': 'R&D',
  events: 'Events',
  people: 'People',
  academy: 'Academy',
  professional_pest_control: 'Professional pest control',
  cereals_storage: 'Cereals storage',
  zootech: 'Zootech',
  'home&garden': 'Home & Garden',
}

export const PROJECT_DIVISIONS = [
  'cereals-storage',
  'pest-control',
  'zootech',
  'home-garden',
  'medical',
] as const

export type ProjectDivision = (typeof PROJECT_DIVISIONS)[number]

export const PROJECT_DIVISION_LABELS: Record<ProjectDivision, string> = {
  'cereals-storage': 'Cereals Storage',
  'pest-control': 'Pest Control',
  zootech: 'Zootech',
  'home-garden': 'Home & Garden',
  medical: 'Medical',
}

export type PluginVariantValue = {
  variant: PluginVariantSlug
  selection_mode: PluginSelectionMode
  vista?: ListingProductVista
  category?: string
  subcategory?: string
  application_area?: string
  bestseller?: boolean
  tag?: string
  items: string[]
  image_ratio?: ListingImageRatio
  context?: PluginContext
}

export type ListingVariantValue = PluginVariantValue & {
  variant: ListingVariantSlug
  selection_mode: ListingSelectionMode
}

export const EMPTY_VALUE: ListingVariantValue = {
  variant: 'prodotto',
  selection_mode: 'dynamic',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  tag: '',
  items: [],
  image_ratio: 'portrait',
}

export const EMPTY_PROJECTS_HIGHLIGHT_VALUE: PluginVariantValue = {
  variant: 'progetto',
  selection_mode: 'all',
  tag: '',
  items: [],
  context: 'projects_highlight',
}

export const EMPTY_CAROUSEL_VALUE: PluginVariantValue = {
  variant: 'story',
  selection_mode: 'dynamic',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  tag: '',
  items: [],
  context: 'carousel',
}

export const VARIANT_TO_COMPONENT: Record<ListingVariantSlug | 'story', string> = {
  prodotto: 'product',
  progetto: 'project',
  insetto: 'insect',
  catalogo: 'catalog',
  story: 'story',
}

export type StoryOption = {
  uuid: string
  name: string
  full_slug: string
  published_at?: string | null
  created_at?: string | null
}

export type FiltriEntry = {
  id?: number
  name: string
  value: string
}

export type ApplicationAreaEntry = {
  name: string
  value: string
  id: string
}
