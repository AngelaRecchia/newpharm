/**
 * TypeScript types per Storyblok
 *
 * Questo file esporta i tipi generati automaticamente da Storyblok
 * combinati con le sovrascritture manuali.
 *
 * I tipi vengono generati da scripts/generate-storyblok-types.ts
 * Le sovrascritture manuali sono in storyblok.overrides.d.ts
 *
 * Per rigenerare i tipi: npm run generate:types
 */

// Importa i tipi generati
import type * as Generated from "./storyblok.generated";

// Importa le sovrascritture
import type * as Overrides from "./storyblok.overrides";

// Re-exporta tutti i tipi generati
export type {
  Accordion_itemStoryblok,
  Anchor_linkStoryblok,
  AssetStoryblok,
  Banner_accordionStoryblok,
  Box_imageStoryblok,
  Box_image_carouselStoryblok,
  Card_boxStoryblok,
  Card_cta_boxStoryblok,
  Card_divisionStoryblok,
  Card_highlightStoryblok,
  Card_icon_textStoryblok,
  CarouselStoryblok,
  Cta_boxStoryblok,
  Division_boxStoryblok,
  FaqsStoryblok,
  FooterStoryblok,
  GalleryStoryblok,
  HeaderStoryblok,
  HeroStoryblok,
  Icon_text_highlightStoryblok,
  LinkStoryblok,
  Logo_itemStoryblok,
  MilestoneStoryblok,
  Milestone_itemStoryblok,
  Nav_itemStoryblok,
  PageStoryblok,
  Projects_highlightStoryblok,
  Social_itemStoryblok,
  Spec_tableStoryblok,
  Split_bannerStoryblok,
  Sticky_imageStoryblok,
  StoryStoryblok,
  TabsStoryblok,
  TeaserStoryblok,
  Text_revealStoryblok,
} from "./storyblok.generated";

// Re-exporta le sovrascritture (hanno priorità)
export type {
  PartnersStoryblok,
  SlideshowStoryblok,
  Card_slideshowStoryblok,
  CatalogsDownloadStoryblok,
  CatalogStoryResolved,
  CatalogStoryblok,
  ProductStoryblok,
  Full_bannerStoryblok,
  Video_ytStoryblok,
  SettingsStoryblok,
} from "./storyblok.overrides";

/**
 * Union type di tutti i componenti Storyblok
 * Include sia i tipi generati che le sovrascritture
 */
export type StoryblokComponent =
  | Generated.Accordion_itemStoryblok
  | Generated.Anchor_linkStoryblok
  | Generated.AssetStoryblok
  | Generated.Banner_accordionStoryblok
  | Generated.Box_imageStoryblok
  | Generated.Box_image_carouselStoryblok
  | Generated.Card_boxStoryblok
  | Generated.Card_cta_boxStoryblok
  | Generated.Card_divisionStoryblok
  | Generated.Card_highlightStoryblok
  | Generated.Card_icon_textStoryblok
  | Generated.CarouselStoryblok
  | Generated.Cta_boxStoryblok
  | Generated.Division_boxStoryblok
  | Generated.FaqsStoryblok
  | Generated.FooterStoryblok
  | Overrides.Full_bannerStoryblok
  | Generated.GalleryStoryblok
  | Generated.HeaderStoryblok
  | Generated.HeroStoryblok
  | Generated.Icon_text_highlightStoryblok
  | Generated.LinkStoryblok
  | Generated.Logo_itemStoryblok
  | Generated.MilestoneStoryblok
  | Generated.Milestone_itemStoryblok
  | Generated.Nav_itemStoryblok
  | Generated.PageStoryblok
  | Overrides.ProductStoryblok
  | Generated.Projects_highlightStoryblok
  | Generated.Social_itemStoryblok
  | Generated.Spec_tableStoryblok
  | Generated.Split_bannerStoryblok
  | Generated.Sticky_imageStoryblok
  | Generated.StoryStoryblok
  | Generated.TabsStoryblok
  | Generated.TeaserStoryblok
  | Generated.Text_revealStoryblok
  | Overrides.CatalogStoryblok
  | Overrides.PartnersStoryblok
  | Overrides.SlideshowStoryblok
  | Overrides.Card_slideshowStoryblok
  | Overrides.CatalogsDownloadStoryblok;

/**
 * Helper type per il prop 'blok' nei componenti Storyblok
 */
export type StoryblokBlok = StoryblokComponent;
