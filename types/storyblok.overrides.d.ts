/**
 * Sovrascritture manuali dei tipi Storyblok
 *
 * Questo file contiene sovrascritture e personalizzazioni dei tipi generati automaticamente.
 * Le interfacce qui definite sovrascrivono quelle in storyblok.generated.d.ts
 *
 * Per aggiungere nuove sovrascritture:
 * 1. Definisci l'interfaccia con lo stesso nome di quella generata
 * 2. Estendi o sovrascrivi i campi necessari
 * 3. I tipi qui definiti avranno priorità su quelli generati
 */

import type * as Generated from "./storyblok.generated";
import type { AssetStoryblok, LinkStoryblok } from "./storyblok.generated";
import type { StoryblokLink } from "@/lib/api/utils/links";
import type { StoryblokAsset } from '@/components/atoms/Asset'
import type { ISbRichtext } from "@storyblok/react";

/** Catalog — campi CMS oltre al generato */
export interface CatalogStoryblok extends Generated.CatalogStoryblok {
  short_description?: string | null;
}

/** Story Insect risolta da CDN (resolve_relations su target_pest_item.insect) */
export interface InsectStoryResolved {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: Generated.InsectStoryblok;
  [key: string]: unknown;
}

/** target_pest_item — insetto catalogo + testo custom sul prodotto */
export interface Target_pest_itemStoryblok extends Omit<
  Generated.Target_pest_itemStoryblok,
  "insect"
> {
  insect?: string | Generated.InsectStoryblok | InsectStoryResolved | null;
}

/** product — composition come richtext in CMS */
export interface ProductStoryblok extends Generated.ProductStoryblok {
  composition?: ISbRichtext | null;
  bestseller?: boolean | null;
  resources?: LinkStoryblok[] | null;
  target_pests?: Target_pest_itemStoryblok[] | null;
}

/** full_banner — title richtext + asset come bloks Asset[] */
export interface Full_bannerStoryblok extends Omit<
  Generated.Full_bannerStoryblok,
  "title" | "asset"
> {
  title?: ISbRichtext | null;
  asset?: AssetStoryblok[] | null;
}

/** hero — background come bloks Asset[] */
export interface HeroStoryblok extends Omit<
  Generated.HeroStoryblok,
  "background"
> {
  background?: AssetStoryblok[] | null;
}

/** Story Catalog risolta da CDN (resolve_relations su catalogs_download.items) */
export interface CatalogStoryResolved {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: CatalogStoryblok;
  [key: string]: unknown;
}

/**
 * catalogs_download (nome tecnico Storyblok) — titolo + elenco cataloghi
 */
export interface CatalogsDownloadStoryblok {
  title?: string | null;
  /** UUID non risolti, oppure oggetti story dopo resolve_relations */
  items?: (CatalogStoryblok | CatalogStoryResolved | string)[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/** link — variant blue | black */
export interface LinkStoryblok extends Generated.LinkStoryblok {
  variant?: "blue" | "black" | null;
}

/**
 * PartnersStoryblok - componente con variant personalizzato
 * Se questo componente esiste anche in storyblok.generated.d.ts,
 * questa definizione lo sovrascrive
 */
export interface PartnersStoryblok {
  title?: string | null; // Optional
  variant?: "light" | "dark" | null; // Optional
  items?: any[] | null; // Optional
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * SlideshowStoryblok - componente aggiunto manualmente
 */
export interface SlideshowStoryblok {
  title?: string | null; // Optional
  cards?: Card_slideshowStoryblok[];
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * Card_slideshowStoryblok - componente aggiunto manualmente
 */
export interface Card_slideshowStoryblok {
  image?: AssetStoryblok[];
  text?: string | null; // Optional
  link?: LinkStoryblok[]; // Supporta sia LinkStoryblok[] che StoryblokLink[] (multilink)
  _uid: string;
  component: string;
  _editable?: string;
}

/** video_yt — componente Storyblok */
export interface Video_ytStoryblok {
  video_id?: string | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/** settings — layout header/footer */
export interface SettingsStoryblok {
  header?: any[] | null;
  footer?: any[] | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/** card_listing_editorial — nested card for listing editorial type */
export interface Card_listing_editorialStoryblok {
  /** Bloks Asset[] (mobile/desktop) oppure asset nativo Storyblok */
  image?:
    | AssetStoryblok[]
    | AssetStoryblok
    | StoryblokAsset
    | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  link?: StoryblokLink | null;
  _uid: string;
  component: string;
  _editable?: string;
}

export type ListingType = "editorial" | "hub" | "highlight";
export type ListingImageRatio = "square" | "portrait";
export type ListingVariantSlug =
  | "prodotto"
  | "progetto"
  | "insetto"
  | "catalogo";

export type ListingSelectionMode = "manual" | "dynamic" | "all";

export type ListingProductVista = "categoria" | "application_area";

export type ListingVariantValue = {
  variant: ListingVariantSlug;
  selection_mode: ListingSelectionMode;
  vista?: ListingProductVista;
  category?: string;
  subcategory?: string;
  application_area?: string;
  bestseller?: boolean;
  items: string[];
  image_ratio?: ListingImageRatio;
};

export interface ListingStoryResolved {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  published_at?: string | null;
  first_published_at?: string | null;
  content: Record<string, unknown>;
}

/** listing — griglia card editorial / hub / highlight */
export interface ListingStoryblok {
  type?: ListingType | null;
  title?: string | null;
  subtitle?: string | null;
  /** Plugin hub/highlight: variant + UUID story */
  variant?: ListingVariantValue | null;
  /** @deprecated use variant */
  listing_items?: ListingVariantValue | null;
  cards?: Card_listing_editorialStoryblok[] | null;
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * products — catalogo completo con filtri sticky.
 * Titolo/subtitle nel blok; tutti i prodotti fetchati SSR (nessuna selezione CMS).
 */
export interface ProductsStoryblok {
  title?: string | null;
  subtitle?: string | null;
  products_comparison_page?: StoryblokLink | null;
  /** Popolato SSR da enrichListingBloks — non editabile in CMS */
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * compare — pagina confronto prodotti side-by-side.
 * Tutti i prodotti fetchati SSR per le select.
 */
export interface CompareStoryblok {
  /** Popolato SSR da enrichListingBloks — non editabile in CMS */
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

export type CarouselVariantSlug = "story" | "prodotto" | "editorial";
export type CarouselStoryMode = "dynamic" | "tag" | "manual";

export type CarouselVariantValue = {
  variant: CarouselVariantSlug;
  selection_mode: CarouselStoryMode;
  tag?: string;
  items: string[];
  vista?: ListingProductVista;
  category?: string;
  subcategory?: string;
  application_area?: string;
  bestseller?: boolean;
};

/** carousel — slide auto (story/product) o card editorial */
export interface CarouselStoryblok {
  title?: string | null;
  subtitle?: string | null;
  link?: LinkStoryblok[] | StoryblokLink | null;
  /** Plugin: story | prodotto | editorial + filtri/selezione */
  variant?: CarouselVariantValue | null;
  cards?: Card_listing_editorialStoryblok[] | null;
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}
