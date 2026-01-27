/**
 * TypeScript types generati automaticamente da Storyblok
 *
 * Questo file è generato automaticamente da scripts/generate-storyblok-types.ts
 * NON modificare manualmente - rigenera i types dopo aver modificato i componenti su Storyblok
 *
 * Per rigenerare: npm run generate:types
 *
 * Generato il: 2026-01-22T17:14:23.273Z
 */

export interface FooterStoryblok {
  newsletter_text?: string;
  address?: RichTextStoryblok;
  items?: any[];
  socials?: any[];
  bottom_links?: any[];
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

export interface LinkStoryblok {
  label?: string | null; // Optional
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
  | FooterStoryblok
  | HeaderStoryblok
  | LinkStoryblok
  | Nav_itemStoryblok
  | PageStoryblok
  | SettingsStoryblok
  | Social_itemStoryblok;

/**
 * Helper type per il prop 'blok' nei componenti Storyblok
 */
export type StoryblokBlok = StoryblokComponent;
