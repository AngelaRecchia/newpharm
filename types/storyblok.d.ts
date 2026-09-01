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
  Alphabetical_accordionStoryblok,
  Anchor_linkStoryblok,
  AssetStoryblok,
  Banner_accordionStoryblok,
  Box_image_carouselStoryblok,
  Card_boxStoryblok,
  Card_cta_boxStoryblok,
  Card_divisionStoryblok,
  Card_highlightStoryblok,
  Card_icon_textStoryblok,
  Cta_boxStoryblok,
  DividerStoryblok,
  Division_boxStoryblok,
  FaqsStoryblok,
  FooterStoryblok,
  GalleryStoryblok,
  HeaderStoryblok,
  Icon_text_highlightStoryblok,
  Logo_itemStoryblok,
  MilestoneStoryblok,
  Milestone_itemStoryblok,
  Nav_itemStoryblok,
  PageStoryblok,
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
  Box_imageStoryblok,
  BoxImageStoryResolved,
  InsectStoryblok,
  InsectStoryResolved,
  Target_pest_itemStoryblok,
  ProductStoryblok,
  Full_bannerStoryblok,
  HeroStoryblok,
  LinkStoryblok,
  Video_ytStoryblok,
  SettingsStoryblok,
  Card_listing_editorialStoryblok,
  ListingStoryblok,
  ProjectStoryblok,
  ProductsStoryblok,
  ProjectsStoryblok,
  Projects_highlightStoryblok,
  StoriesStoryblok,
  InfestantiStoryblok,
  JobStoryblok,
  Job_listStoryblok,
  Article_bodyStoryblok,
  CompareStoryblok,
  Glossary_itemStoryblok,
  GlossaryStoryblok,
  ListingStoryResolved,
  ListingVariantValue,
  ListingVariantSlug,
  ListingImageRatio,
  ListingTheme,
  InsectCategory,
  CarouselStoryblok,
  CarouselVariantValue,
  CarouselVariantSlug,
  CarouselInsectMode,
  CarouselSelectionMode,
} from "./storyblok.overrides";

/**
 * Union type di tutti i componenti Storyblok
 * Include sia i tipi generati che le sovrascritture
 */
export type StoryblokComponent =
  | Generated.Accordion_itemStoryblok
  | Generated.Alphabetical_accordionStoryblok
  | Generated.Anchor_linkStoryblok
  | Generated.AssetStoryblok
  | Generated.Banner_accordionStoryblok
  | Overrides.Box_imageStoryblok
  | Generated.Box_image_carouselStoryblok
  | Generated.Card_boxStoryblok
  | Generated.Card_cta_boxStoryblok
  | Generated.Card_divisionStoryblok
  | Generated.Card_highlightStoryblok
  | Generated.Card_icon_textStoryblok
  | Overrides.CarouselStoryblok
  | Generated.Cta_boxStoryblok
  | Generated.DividerStoryblok
  | Generated.Division_boxStoryblok
  | Generated.FaqsStoryblok
  | Generated.FooterStoryblok
  | Overrides.Full_bannerStoryblok
  | Generated.GalleryStoryblok
  | Generated.HeaderStoryblok
  | Overrides.HeroStoryblok
  | Generated.Icon_text_highlightStoryblok
  | Overrides.InsectStoryblok
  | Overrides.LinkStoryblok
  | Generated.Logo_itemStoryblok
  | Generated.MilestoneStoryblok
  | Generated.Milestone_itemStoryblok
  | Generated.Nav_itemStoryblok
  | Generated.PageStoryblok
  | Overrides.ProductStoryblok
  | Overrides.Projects_highlightStoryblok
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
  | Overrides.CatalogsDownloadStoryblok
  | Overrides.ListingStoryblok
  | Overrides.ProjectStoryblok
  | Overrides.ProductsStoryblok
  | Overrides.ProjectsStoryblok
  | Overrides.StoriesStoryblok
  | Overrides.InfestantiStoryblok
  | Overrides.JobStoryblok
  | Overrides.Job_listStoryblok
  | Overrides.Article_bodyStoryblok
  | Overrides.CompareStoryblok
  | Overrides.Glossary_itemStoryblok
  | Overrides.GlossaryStoryblok
  | Overrides.Card_listing_editorialStoryblok
  | Overrides.Target_pest_itemStoryblok;

/**
 * Helper type per il prop 'blok' nei componenti Storyblok
 */
export type StoryblokBlok = StoryblokComponent;
