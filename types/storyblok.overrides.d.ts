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
import type { StoryblokLink } from "@/lib/api/utils/links";
import type { AssetStoryblok } from "./storyblok.generated";
import type { ISbRichtext } from "@storyblok/react";

/** Catalog — campi CMS oltre al generato */
export interface CatalogStoryblok extends Generated.CatalogStoryblok {
  short_description?: string | null;
}

/** product — composition come richtext in CMS */
export interface ProductStoryblok extends Generated.ProductStoryblok {
  composition?: ISbRichtext | null;
}

/** full_banner — title richtext + asset come bloks Asset[] */
export interface Full_bannerStoryblok extends Omit<
  Generated.Full_bannerStoryblok,
  "title" | "asset"
> {
  title?: ISbRichtext | null;
  asset?: AssetStoryblok[] | null;
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
  image?: import("./storyblok.generated").AssetStoryblok[] | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  link?: LinkStoryblok[] | null;
  _uid: string;
  component: string;
  _editable?: string;
}

export type ListingType = "editorial" | "hub" | "highlight";
export type ListingEditorialVariant = "team" | "courses";
export type ListingVariantSlug =
  | "prodotto"
  | "progetto"
  | "insetto"
  | "catalogo";

export type ListingVariantValue = {
  variant: ListingVariantSlug;
  items: string[];
  category?: string;
  piu_recente?: boolean;
  alfabetico?: boolean;
};

export interface ListingStoryResolved {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  published_at?: string | null;
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
  editorial_variant?: ListingEditorialVariant | null;
  empty_message?: string | null;
  cards?: Card_listing_editorialStoryblok[] | null;
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/** products — listing prodotti con filtri sticky e chips categoria/sottofiltro */
export interface ProductsStoryblok {
  title?: string | null;
  subtitle?: string | null;
  variant?: ListingVariantValue | null;
  /** @deprecated use variant */
  listing_items?: ListingVariantValue | null;
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}
