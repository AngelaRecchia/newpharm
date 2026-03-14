/**
 * TypeScript types generati automaticamente da Storyblok
 * 
 * Questo file è generato automaticamente da scripts/generate-storyblok-types.ts
 * NON modificare manualmente - rigenera i types dopo aver modificato i componenti su Storyblok
 * 
 * Per rigenerare: npm run generate:types
 * 
 * Generato il: 2026-03-12T22:08:03.219Z
 */


export interface Accordion_itemStoryblok {
  title?: string | null // Optional
  text?: string | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Anchor_linkStoryblok {
  title?: string | null // Optional
  text?: string | null // Optional
  target?: { id: string; url: string; linktype: string; fieldtype: string; cached_url?: string; } | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface AssetStoryblok {
  mobile?: { id: number; alt: string; name: string; focus: string; title: string; filename: string; copyright: string; fieldtype: string; } | null // Optional
  desktop?: { id: number; alt: string; name: string; focus: string; title: string; filename: string; copyright: string; fieldtype: string; } | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Banner_accordionStoryblok {
  image?: any[] | null // Optional
  items?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Box_imageStoryblok {
  title?: string | null // Optional
  subtitle?: string | null // Optional
  asset?: any[] | null // Optional
  link?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Card_boxStoryblok {
  title?: string | null // Optional
  text?: string | null // Optional
  link?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Card_cta_boxStoryblok {
  title?: string | null // Optional
  link?: any[] | null // Optional
  image?: { id: number; alt: string; name: string; focus: string; title: string; filename: string; copyright: string; fieldtype: string; } | null // Optional
  color?: any | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Card_divisionStoryblok {
  image?: { id: number; alt: string; name: string; focus: string; title: string; filename: string; copyright: string; fieldtype: string; } | null // Optional
  label?: string | null // Optional
  number?: string | null // Optional
  title?: string | null // Optional
  link?: { id: string; url: string; linktype: string; fieldtype: string; cached_url?: string; } | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Card_highlightStoryblok {
  image?: any[] | null // Optional
  text?: string | null // Optional
  link?: { id: string; url: string; linktype: string; fieldtype: string; cached_url?: string; } | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Card_icon_textStoryblok {
  title?: string | null // Optional
  description?: string | null // Optional
  image?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface CarouselStoryblok {
  title?: string | null // Optional
  subtitle?: string | null // Optional
  link?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Cta_boxStoryblok {
  cards?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Division_boxStoryblok {
  title?: string | null // Optional
  link?: any[] | null // Optional
  cards?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface FaqsStoryblok {
  title?: string | null // Optional
  description?: string | null // Optional
  items?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface FooterStoryblok {
  newsletter_text?: string | null // Optional
  address?: string | null // Optional
  items?: any[] | null // Optional
  socials?: any[] | null // Optional
  bottom_links?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Full_bannerStoryblok {
  title?: string | null // Optional
  asset?: { id: number; alt: string; name: string; focus: string; title: string; filename: string; copyright: string; fieldtype: string; } | null // Optional
  variant?: any | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface GalleryStoryblok {
  title?: string | null // Optional
  images?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface HeaderStoryblok {
  nav_items?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface HeroStoryblok {
  variant?: any | null // Optional
  title?: string | null // Optional
  subtitle?: string | null // Optional
  background?: { id: number; alt: string; name: string; focus: string; title: string; filename: string; copyright: string; fieldtype: string; } | null // Optional
  links?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Icon_text_highlightStoryblok {
  title?: string | null // Optional
  description?: string | null // Optional
  items?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface LinkStoryblok {
  label: string
  link?: { id: string; url: string; linktype: string; fieldtype: string; cached_url?: string; } | null // Optional
  description?: string | null // Optional
  variant?: any | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Nav_itemStoryblok {
  label?: string | null // Optional
  link?: { id: string; url: string; linktype: string; fieldtype: string; cached_url?: string; } | null // Optional
  items?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface PageStoryblok {
  body?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface ProductStoryblok {
  title: string
  tab-cd7f2c9c-47a9-4630-a228-1739262250da?: any | null // Optional
  secondary_title?: string | null // Optional
  images?: any[] | null // Optional
  short_description?: string | null // Optional
  features?: string | null // Optional
  formulazione?: any | null // Optional
  product_type?: any | null // Optional
  category: any
  tab_filtri?: any | null // Optional
  application_areas?: string | null // Optional
  application_areas_sub?: string | null // Optional
  target_pests?: string | null // Optional
  target_pests_sub?: string | null // Optional
  tab_dettaglio?: any | null // Optional
  application_areas_text?: string | null // Optional
  composition?: string | null // Optional
  dosage_and_application?: string | null // Optional
  units_per_carton?: string | null // Optional
  registration?: string | null // Optional
  safety_data_sheet?: { id: number; alt: string; name: string; focus: string; title: string; filename: string; copyright: string; fieldtype: string; } | null // Optional
  tab_media?: any | null // Optional
  video?: string | null // Optional
  related_products?: string | null // Optional
  body?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Projects_highlightStoryblok {
  title?: string | null // Optional
  link?: any[] | null // Optional
  cards?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Social_itemStoryblok {
  type?: any | null // Optional
  url?: { id: string; url: string; linktype: string; fieldtype: string; cached_url?: string; } | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Spec_tableStoryblok {
  title?: string | null // Optional
  description?: string | null // Optional
  table?: any[][] | null // Optional
  table_code?: string | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Split_bannerStoryblok {
  items?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Sticky_imageStoryblok {
  title?: string | null // Optional
  image?: any[] | null // Optional
  content?: string | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface StoryStoryblok {
  title?: string | null // Optional
  author?: string | null // Optional
  reading_time?: string | null // Optional
  date?: string | null // Optional
  tag?: 'company' | 'r&d' | 'events' | 'people' | 'academy' | 'professional_pest_control' | 'cereals_storage' | 'zootech' | 'home&garden' | null // Optional
  asset: any[]
  article?: string | null // Optional
  body?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface TabsStoryblok {
  title?: string | null // Optional
  asset?: any[] | null // Optional
  items?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface TeaserStoryblok {
  headline?: string | null // Optional
  _uid: string
  component: string
  _editable?: string
}


export interface Text_revealStoryblok {
  text?: string | null // Optional
  link?: any[] | null // Optional
  _uid: string
  component: string
  _editable?: string
}

/**
 * Union type di tutti i componenti Storyblok
 */
export type StoryblokComponent = Accordion_itemStoryblok | Anchor_linkStoryblok | AssetStoryblok | Banner_accordionStoryblok | Box_imageStoryblok | Card_boxStoryblok | Card_cta_boxStoryblok | Card_divisionStoryblok | Card_highlightStoryblok | Card_icon_textStoryblok | CarouselStoryblok | Cta_boxStoryblok | Division_boxStoryblok | FaqsStoryblok | FooterStoryblok | Full_bannerStoryblok | GalleryStoryblok | HeaderStoryblok | HeroStoryblok | Icon_text_highlightStoryblok | LinkStoryblok | Nav_itemStoryblok | PageStoryblok | ProductStoryblok | Projects_highlightStoryblok | Social_itemStoryblok | Spec_tableStoryblok | Split_bannerStoryblok | Sticky_imageStoryblok | StoryStoryblok | TabsStoryblok | TeaserStoryblok | Text_revealStoryblok

/**
 * Helper type per il prop 'blok' nei componenti Storyblok
 */
export type StoryblokBlok = StoryblokComponent
