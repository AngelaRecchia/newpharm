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
import type { ProjectDivision } from "@/lib/projects/divisions";
import type { LinkActionValue } from "@/lib/link-action";
import type { RelatedStory } from "@/lib/api/storyblok/stories";

/** Catalog — campi CMS oltre al generato */
export interface CatalogStoryblok extends Generated.CatalogStoryblok {
  short_description?: string | null;
}

export type InsectVisibility = "product" | "listing" | "both";
export type InsectCategory =
  | "volanti"
  | "striscianti"
  | "insetti_delle_derrate"
  | "rettili_e_anfibi"
  | "volatili"
  | "roditori";

export type TargetPestsPluginValue = {
  items: Array<{ uuid: string; text?: string }>;
};

export type TargetPestView = {
  uid: string;
  title: string;
  image: AssetStoryblok | null;
  text?: string;
};

/** insect — icona prodotto + media listing */
export interface InsectStoryblok extends Generated.InsectStoryblok {
  icon?: AssetStoryblok | null;
  image_hover?: AssetStoryblok | null;
  gallery?: AssetStoryblok[] | null;
  visibility?: InsectVisibility | null;
  category?: InsectCategory | null;
}

/** Story Insect risolta da CDN */
export interface InsectStoryResolved {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: InsectStoryblok;
  [key: string]: unknown;
}

/** target_pest_item — insetto catalogo + testo custom sul prodotto (legacy) */
export interface Target_pest_itemStoryblok extends Omit<
  Generated.Target_pest_itemStoryblok,
  "insect"
> {
  insect?: string | InsectStoryblok | InsectStoryResolved | null;
}

/** product — composition come richtext in CMS */
export interface ProductStoryblok extends Generated.ProductStoryblok {
  composition?: ISbRichtext | null;
  bestseller?: boolean | null;
  resources?: LinkStoryblok[] | null;
  target_pests?: TargetPestsPluginValue | Target_pest_itemStoryblok[] | null;
  resolved_target_pests?: TargetPestView[] | null;
  related_category_products?: ListingStoryResolved[] | null;
  related_category_parent_slug?: string | null;
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

/** Story prodotto/progetto risolta da CDN (resolve_relations su box_image.product / box_image.project) */
export interface BoxImageStoryResolved {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: Record<string, unknown>;
  [key: string]: unknown;
}

/** box_image — editoriale oppure riferimento a prodotto/progetto */
export interface Box_imageStoryblok extends Omit<
  Generated.Box_imageStoryblok,
  "product" | "project" | "asset" | "link" | "image_alignment"
> {
  product?: string | BoxImageStoryResolved | null;
  project?: string | BoxImageStoryResolved | null;
  asset?: AssetStoryblok[] | null;
  link?: LinkStoryblok[] | null;
  image_alignment?: "left" | "right" | null;
}

/** link — variant visiva blue | black, action funzionale dal plugin link-action */
export interface LinkStoryblok extends Generated.LinkStoryblok {
  variant?: "blue" | "black" | null;
  action?: LinkActionValue | null;
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
export type ListingTheme = "light" | "dark";
export type ListingVariantSlug =
  | "prodotto"
  | "progetto"
  | "insetto"
  | "catalogo";

export type ListingSelectionMode = "manual" | "dynamic" | "all" | "tag";

export type ListingProductVista = "categoria" | "application_area";

export type ListingVariantValue = {
  variant: ListingVariantSlug;
  selection_mode: ListingSelectionMode;
  vista?: ListingProductVista;
  category?: string;
  subcategory?: string;
  application_area?: string;
  bestseller?: boolean;
  tag?: string;
  items: string[];
  image_ratio?: ListingImageRatio;
};

export interface ListingStoryResolved {
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  created_at?: string | null;
  published_at?: string | null;
  first_published_at?: string | null;
  content: Record<string, unknown>;
}

/** listing — griglia card editorial / hub / highlight */
export interface ListingStoryblok {
  type?: ListingType | null;
  theme?: ListingTheme | null;
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

/** project — content type con divisioni multi-select, hero e body */
export interface ProjectStoryblok extends Omit<
  Generated.ProjectStoryblok,
  "divisions" | "image"
> {
  divisions?: ProjectDivision[] | null;
  /** Multi-asset: campo CMS `image` (e alias `asset`) */
  image?: AssetStoryblok[] | null;
  asset?: AssetStoryblok[] | null;
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
 * projects — catalogo completo con chips divisioni.
 * Titolo/subtitle nel blok; tutti i progetti fetchati SSR (nessuna selezione CMS).
 */
export interface ProjectsStoryblok {
  title?: string | null;
  subtitle?: string | null;
  /** Popolato SSR da enrichListingBloks — non editabile in CMS */
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * projects_highlight — stack sticky di progetti referenziati (nessuna card editoriale).
 * Plugin listing-items: tutti | per tag (divisione) | manuale, sempre ultimi aggiunti.
 */
export interface Projects_highlightStoryblok {
  title?: string | null;
  link?: LinkStoryblok[] | StoryblokLink | null;
  /** Plugin: all | tag | manual su content type project */
  variant?: ListingVariantValue | null;
  /** Popolato SSR da enrichListingBloks — non editabile in CMS */
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * stories — catalogo news con chips tag e griglia a mosaico.
 * Titolo/subtitle nel blok; tutte le story fetchate SSR (nessuna selezione CMS).
 */
export interface StoriesStoryblok {
  title?: string | null;
  subtitle?: string | null;
  /** Popolato SSR da enrichListingBloks — non editabile in CMS */
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * infestanti — catalogo insetti con chips categoria, overlay e banner interleaved.
 * Titolo/subtitle nel blok; insetti listing/both fetchati SSR.
 */
export interface InfestantiStoryblok {
  title?: string | null;
  subtitle?: string | null;
  banners?: Full_bannerStoryblok[] | null;
  /** Popolato SSR da enrichListingBloks — non editabile in CMS */
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/** job — content type posizione lavorativa */
export interface JobStoryblok extends Omit<
  Generated.JobStoryblok,
  "esperienza" | "body" | "description"
> {
  description?: Article_bodyStoryblok[] | null;
  esperienza?: "stage" | "junior" | "middle" | "senior" | null;
  /** Popolato SSR — ultime news */
  latest_stories?: RelatedStory[] | null;
  body?:
    | Article_bodyStoryblok[]
    | Generated.FaqsStoryblok[]
    | Generated.Cta_boxStoryblok[]
    | LinkStoryblok[]
    | Generated.DividerStoryblok[]
    | HeroStoryblok[]
    | null;
}

/**
 * job_list — elenco posizioni aperte fetchate SSR.
 */
export interface Job_listStoryblok extends Omit<
  Generated.Job_listStoryblok,
  never
> {
  /** Popolato SSR da enrichListingBloks — non editabile in CMS */
  resolved_items?: ListingStoryResolved[] | null;
}

/** article_body — rich text in colonna stretta nel body della story */
export interface Article_bodyStoryblok {
  article?: ISbRichtext | null;
  show_copy_button?: boolean | null;
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

/** glossary_item — voce nell’archivio glossario */
export interface Glossary_itemStoryblok {
  term?: string | null;
  aliases?: string | null;
  definition?: ISbRichtext | null;
  _uid: string;
  component: string;
  _editable?: string;
}

/** glossary — una story per locale, non routabile */
export interface GlossaryStoryblok {
  items?: Glossary_itemStoryblok[] | null;
  _uid: string;
  component: string;
  _editable?: string;
}

import type {
  CarouselInsectMode,
  CarouselSelectionMode,
  CarouselStoryMode,
  CarouselVariantSlug,
  CarouselVariantValue,
} from "@/lib/carousel/types";

export type {
  CarouselInsectMode,
  CarouselSelectionMode,
  CarouselStoryMode,
  CarouselVariantSlug,
  CarouselVariantValue,
};

/** carousel — slide auto (story/product/insect) o card editorial */
export interface CarouselStoryblok {
  title?: string | null;
  subtitle?: string | null;
  link?: LinkStoryblok[] | StoryblokLink | null;
  /** Plugin: story | prodotto | editorial | insetto + filtri/selezione */
  variant?: CarouselVariantValue | null;
  cards?: Card_listing_editorialStoryblok[] | null;
  resolved_items?: ListingStoryResolved[] | null;
  anchor_id?: string | null;
  _uid: string;
  component: string;
  _editable?: string;
}
