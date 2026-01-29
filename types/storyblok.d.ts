/**
 * TypeScript types generati automaticamente da Storyblok
 *
 * Questo file è generato automaticamente da scripts/generate-storyblok-types.ts
 * NON modificare manualmente - rigenera i types dopo aver modificato i componenti su Storyblok
 *
 * Per rigenerare: npm run generate:types
 *
 * Generato il: 2026-01-28T21:51:35.036Z
 */

export interface Anchor_linkStoryblok {
  title?: string | null; // Optional
  text?: string | null; // Optional
  target?: {
    id: string;
    url: string;
    linktype: string;
    fieldtype: string;
    cached_url?: string;
  } | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface Card_divisionStoryblok {
  image?: {
    id: number;
    alt: string;
    name: string;
    focus: string;
    title: string;
    filename: string;
    copyright: string;
    fieldtype: string;
  } | null; // Optional
  label?: string | null; // Optional
  number?: string | null; // Optional
  title?: string | null; // Optional
  link?: {
    id: string;
    url: string;
    linktype: string;
    fieldtype: string;
    cached_url?: string;
  } | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface Division_boxStoryblok {
  title?: string | null; // Optional
  link?: StoryblokLink | null; // Optional
  cards?: Card_divisionStoryblok[] | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface FooterStoryblok {
  newsletter_text?: string | null; // Optional
  address?: RichTextStoryblok | null; // Optional
  items?: any[] | null; // Optional
  socials?: any[] | null; // Optional
  bottom_links?: any[] | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface HeaderStoryblok {
  nav_items?: any[] | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface HeroStoryblok {
  variant?: any | null; // Optional
  title?: string | null; // Optional
  subtitle?: string | null; // Optional
  background?: {
    id: number;
    alt: string;
    name: string;
    focus: string;
    title: string;
    filename: string;
    copyright: string;
    fieldtype: string;
  } | null; // Optional
  links?: any[] | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface LinkStoryblok {
  label?: string | null; // Optional
  link?: {
    id: string;
    url: string;
    linktype: string;
    fieldtype: string;
    cached_url?: string;
  } | null; // Optional
  description?: string | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface Nav_itemStoryblok {
  label?: string | null; // Optional
  link?: {
    id: string;
    url: string;
    linktype: string;
    fieldtype: string;
    cached_url?: string;
  } | null; // Optional
  items?: any[] | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface PageStoryblok {
  body?: any[] | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface SettingsStoryblok {
  header?: any[] | null; // Optional
  footer?: any[] | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

export interface Social_itemStoryblok {
  type?: any | null; // Optional
  url?: {
    id: string;
    url: string;
    linktype: string;
    fieldtype: string;
    cached_url?: string;
  } | null; // Optional
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * Union type di tutti i componenti Storyblok
 */
export type StoryblokComponent =
  | Anchor_linkStoryblok
  | Card_divisionStoryblok
  | Division_boxStoryblok
  | FooterStoryblok
  | HeaderStoryblok
  | HeroStoryblok
  | LinkStoryblok
  | Nav_itemStoryblok
  | PageStoryblok
  | SettingsStoryblok
  | Social_itemStoryblok;

/**
 * Helper type per il prop 'blok' nei componenti Storyblok
 */
export type StoryblokBlok = StoryblokComponent;
