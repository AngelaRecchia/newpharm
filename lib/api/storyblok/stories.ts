/**
 * Storyblok Stories API
 *
 * Functions for fetching stories from Storyblok CDN API.
 */

import { cache } from "react";
import { getStoryblokApi } from "./client";
import { getStoryblokVersion, getCacheVersion } from "./config";
import { STORYBLOK_RESOLVE_RELATIONS } from "./resolveRelations";
import { AssetStoryblok } from "@/types/storyblok";
import { NON_ROUTABLE_COMPONENTS, isNonRoutableComponent } from "./routing";
import { parseCarouselVariant } from "@/lib/carousel/parseCarouselVariant";
import { filterListingByVista } from "@/lib/listing/filterListingByVista";
import { sortProductStories } from "@/lib/products/filterProducts";
import type { ListingStoryResolved } from "@/lib/listing/types";

export interface GetStoryOptions {
  version?: "draft" | "published";
  resolve_links?: "url" | "story" | "0" | "1";
  resolve_relations?: string | string[];
  language?: string;
  [key: string]: any;
}

export interface Story {
  name: string;
  created_at: string;
  published_at: string | null;
  id: number;
  uuid: string;
  content: any;
  slug: string;
  full_slug: string;
  [key: string]: any;
}

const EMPTY_STORY_OPTIONS: GetStoryOptions = {};
const DRAFT_MEMORY_TTL_MS = 20_000;

type Timed<T> = { expiresAt: number; value: Promise<T> };

const storyCache = new Map<string, Timed<Story | null>>();
const allStoriesCache = new Map<string, Timed<Story[]>>();

function stableOptionsKey(options: Record<string, unknown>): string {
  return JSON.stringify(
    Object.entries(options).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function readTimedCache<T>(
  map: Map<string, Timed<T>>,
  key: string,
): Promise<T> | undefined {
  const entry = map.get(key);
  if (!entry) return undefined;
  if (
    entry.expiresAt !== Number.POSITIVE_INFINITY &&
    Date.now() >= entry.expiresAt
  ) {
    map.delete(key);
    return undefined;
  }
  return entry.value;
}

function remember<T>(
  map: Map<string, Timed<T>>,
  key: string,
  version: "draft" | "published",
  factory: () => Promise<T>,
): Promise<T> {
  const cached = readTimedCache(map, key);
  if (cached) return cached;

  const promise = factory();
  const ttlMs = version === "published" ? null : DRAFT_MEMORY_TTL_MS;
  map.set(key, {
    expiresAt: ttlMs == null ? Number.POSITIVE_INFINITY : Date.now() + ttlMs,
    value: promise,
  });
  promise.catch(() => {
    map.delete(key);
  });
  return promise;
}

/**
 * Interface per story correlate (solo i campi necessari)
 */
export interface RelatedStory {
  full_slug: string;
  title: string;
  date: string | null;
  tag: string | string[] | null;
  asset: AssetStoryblok[];
}

/**
 * Recupera una story da Storyblok
 * Funzione centralizzata per fetchare stories con gestione automatica di:
 * - Versione (draft/published) basata su ambiente
 * - Locale nel path
 * - Parametri standard (resolve_links, resolve_relations)
 *
 * @param slug - Slug della story (es: 'home', 'about', 'it/home')
 * @param locale - Locale opzionale (se non incluso nello slug)
 * @param options - Opzioni aggiuntive per la richiesta
 * @returns La story o null se non trovata (404 ritorna null silenziosamente)
 */
export const getStory = cache(function getStory(
  slug: string,
  locale?: string,
  options: GetStoryOptions = EMPTY_STORY_OPTIONS,
): Promise<Story | null> {
  const storyPath =
    locale && !slug.startsWith(locale + "/") ? `${locale}/${slug}` : slug;
  const version = options.version || getStoryblokVersion();
  const cacheKey = `${storyPath}:${version}:${stableOptionsKey(options)}`;

  return remember(storyCache, cacheKey, version, () =>
    fetchStory(storyPath, version, options),
  );
});

async function fetchStory(
  storyPath: string,
  version: "draft" | "published",
  options: GetStoryOptions,
): Promise<Story | null> {
  try {
    const storyblokApi = getStoryblokApi();
    const cv = await getCacheVersion();

    const params: Record<string, any> = {
      version,
      resolve_links: "url",
      resolve_relations: STORYBLOK_RESOLVE_RELATIONS,
      ...options,
    };

    // Add cv parameter if available
    if (cv !== undefined) {
      params.cv = cv;
    }

    const endpoint = `cdn/stories/${storyPath}`;
    const { data } = await storyblokApi.get(endpoint, params);

    return data?.story || null;
  } catch (error: any) {
    // 1. Check for 404 specifically
    if (error?.status === 404) {
      return null; // Graceful return for notFound()
    }

    console.error(`[Storyblok] Error fetching ${storyPath}`);

    return null;
  }
}

/**
 * Recupera tutte le stories da Storyblok per generateStaticParams
 * Esclude cartelle di sistema e content type non routabili (downloadable, …).
 *
 * @param options - Opzioni per la richiesta
 * @param options.version - Versione da usare (default: basata su ambiente)
 * @param options.excludePaths - Path da escludere (default: ['layout-components', 'glossary', 'insetti', 'infestanti'])
 * @param options.perPage - Numero di stories per pagina (default: 100)
 * @returns Array di stories
 *
 * @example
 * const stories = await getAllStories()
 * // Returns all published stories (in production) or draft stories (in development)
 */
export async function getAllStories(
  options: {
    version?: "draft" | "published";
    excludePaths?: string[];
    perPage?: number;
  } = {}
): Promise<Story[]> {
  const {
    version: requestedVersion,
    excludePaths = ["layout-components", "glossary", "insetti", "infestanti"],
    perPage = 100,
  } = options;
  const version = requestedVersion || getStoryblokVersion();
  const cacheKey = `${version}:${perPage}:${stableOptionsKey({ excludePaths })}`;

  return remember(allStoriesCache, cacheKey, version, () =>
    fetchAllStories(version, excludePaths, perPage),
  );
}

async function fetchAllStories(
  version: "draft" | "published",
  excludePaths: string[],
  perPage: number,
): Promise<Story[]> {
  try {
    const storyblokApi = getStoryblokApi();
    const allStories: Story[] = [];
    const cv = await getCacheVersion();

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params: Record<string, any> = {
        version,
        per_page: perPage,
        page,
        excluding_fields: "content", // Exclude large fields to speed up fetch
        "filter_query[component][not_in]": NON_ROUTABLE_COMPONENTS.join(","),
      };

      // Add cv parameter if available
      if (cv !== undefined) {
        params.cv = cv;
      }

      const { data } = await storyblokApi.get("cdn/stories", params);

      if (!data?.stories || data.stories.length === 0) {
        hasMore = false;
        break;
      }

      // Filter out excluded paths
      const filteredStories = data.stories.filter((story: Story) => {
        const fullSlug = story.full_slug || "";

        // Skip empty slugs
        if (!fullSlug) {
          return false;
        }

        // Check if story is in excluded path
        const segments = fullSlug.split("/").filter(Boolean)
        if (segments.some((segment) => excludePaths.includes(segment))) {
          return false
        }

        if (isNonRoutableComponent(story.content?.component)) {
          return false
        }

        return true
      });

      allStories.push(...filteredStories);

      // Check if there are more pages
      if (data.stories.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    const catalogDownloadables = await fetchDownloadableCatalogStories(
      version,
      perPage,
      cv,
    )
    allStories.push(
      ...catalogDownloadables.filter((story: Story) => {
        const fullSlug = story.full_slug || ""
        if (!fullSlug) return false
        const segments = fullSlug.split("/").filter(Boolean)
        return !segments.some((segment) => excludePaths.includes(segment))
      }),
    )

    return allStories;
  } catch (error) {
    return [];
  }
}

async function fetchDownloadableCatalogStories(
  version: "draft" | "published",
  perPage: number,
  cv: number | undefined,
): Promise<Story[]> {
  try {
    const storyblokApi = getStoryblokApi();
    const stories: Story[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params: Record<string, unknown> = {
        version,
        per_page: perPage,
        page,
        excluding_fields: "content",
        "filter_query[component][in]": "downloadable",
        "filter_query[kind][in]": "catalog",
      };

      if (cv !== undefined) {
        params.cv = cv;
      }

      const { data } = await storyblokApi.get("cdn/stories", params);
      const batch = (data?.stories ?? []) as Story[];
      if (batch.length === 0) break;
      stories.push(...batch);
      hasMore = batch.length >= perPage;
      page += 1;
    }

    return stories;
  } catch (error) {
    console.error("[Storyblok] Error fetching downloadable catalogs", error);
    return [];
  }
}

/**
 * Recupera stories per UUID preservando l'ordine richiesto.
 * Richieste batched (max 50 UUID per chiamata — limite CDN Storyblok).
 */
export async function getStoriesByUuids(
  uuids: string[],
  locale?: string,
  options: GetStoryOptions = {},
): Promise<Story[]> {
  const unique = [...new Set(uuids.filter(Boolean))]
  if (unique.length === 0) return []

  const CHUNK_SIZE = 50
  const chunks: string[][] = []
  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    chunks.push(unique.slice(i, i + CHUNK_SIZE))
  }

  try {
    const storyblokApi = getStoryblokApi()
    const version = options.version || getStoryblokVersion()
    const cv = await getCacheVersion()

    const chunkResults = await Promise.all(
      chunks.map(async (chunk) => {
        const params: Record<string, unknown> = {
          version,
          by_uuids: chunk.join(','),
          resolve_links: 'url',
          resolve_relations: STORYBLOK_RESOLVE_RELATIONS,
          per_page: chunk.length,
          ...options,
        }

        if (locale) {
          params.language = locale
        }

        if (cv !== undefined) {
          params.cv = cv
        }

        const { data } = await storyblokApi.get('cdn/stories', params)
        return (data?.stories ?? []) as Story[]
      }),
    )

    const byUuid = new Map<string, Story>()
    for (const stories of chunkResults) {
      for (const story of stories) {
        byUuid.set(story.uuid, story)
      }
    }

    return unique.map((uuid) => byUuid.get(uuid)).filter(Boolean) as Story[]
  } catch (error) {
    console.error('[Storyblok] Error fetching stories by UUID', error)
    return []
  }
}

const storiesByComponentCache = new Map<string, Timed<Story[]>>()

export function clearStoriesByComponentCache() {
  storyCache.clear()
  allStoriesCache.clear()
  storiesByComponentCache.clear()
  relatedProjectsIndexCache.clear()
  relatedNewsIndexCache.clear()
}

/**
 * Recupera tutte le stories di un content type nel locale corrente (prefetch paginato).
 */
export async function getStoriesByComponent(
  component: string,
  locale?: string,
  options: GetStoryOptions = {},
): Promise<Story[]> {
  const version = options.version || getStoryblokVersion()
  const cv = await getCacheVersion()
  const cacheKey = `${component}:${version}:${locale ?? '__all__'}:${cv ?? 'nocv'}`

  return remember(storiesByComponentCache, cacheKey, version, () =>
    fetchStoriesByComponent(component, locale, options),
  )
}

async function fetchStoriesByComponent(
  component: string,
  locale?: string,
  options: GetStoryOptions = {},
): Promise<Story[]> {
  try {
    const storyblokApi = getStoryblokApi()
    const version = options.version || getStoryblokVersion()
    const cv = await getCacheVersion()
    const stories: Story[] = []

    let page = 1
    let hasMore = true

    while (hasMore) {
      const params: Record<string, unknown> = {
        version,
        per_page: 100,
        page,
        resolve_links: 'url',
        resolve_relations: STORYBLOK_RESOLVE_RELATIONS,
        'filter_query[component][in]': component,
        ...options,
      }

      if (locale) {
        params.starts_with = `${locale}/`
      }

      if (cv !== undefined) {
        params.cv = cv
      }

      const { data } = await storyblokApi.get('cdn/stories', params)
      const batch = (data?.stories ?? []) as Story[]

      if (batch.length === 0) {
        break
      }

      stories.push(...batch)
      hasMore = batch.length === 100
      page += 1
    }

    return stories
  } catch (error) {
    console.error(`[Storyblok] Error fetching stories by component ${component}`, error)
    return []
  }
}

/**
 * Cerca stories di un componente specifico usando il parametro search_term
 * di Storyblok. Ritorna solo le stories che contengono il termine in campi
 * testuali/richtext, riducendo drasticamente il payload rispetto al fetch
 * completo di tutte le stories del componente.
 */
export async function searchStoriesByComponent(
  component: string,
  query: string,
  locale?: string,
  options: GetStoryOptions = {},
): Promise<Story[]> {
  if (!query.trim()) return []

  try {
    const storyblokApi = getStoryblokApi()
    const version = options.version || getStoryblokVersion()
    const cv = await getCacheVersion()
    const stories: Story[] = []

    let page = 1
    let hasMore = true

    while (hasMore) {
      const params: Record<string, unknown> = {
        version,
        per_page: 100,
        page,
        resolve_links: 'url',
        'filter_query[component][in]': component,
        search_term: query.trim(),
        excluding_fields: 'body,article',
        ...options,
      }

      if (locale) {
        params.starts_with = `${locale}/`
      }

      if (cv !== undefined) {
        params.cv = cv
      }

      const { data } = await storyblokApi.get('cdn/stories', params)
      const batch = (data?.stories ?? []) as Story[]

      if (batch.length === 0) {
        break
      }

      stories.push(...batch)
      hasMore = batch.length === 100
      page += 1
    }

    return stories
  } catch (error) {
    console.error(`[Storyblok] Error searching stories by component ${component}`, error)
    return []
  }
}

/**
 * Recupera story correlate che hanno almeno un tag in comune
 * Ritorna solo full_slug, title, date, tag, asset
 * Ordinate per: 1. presenza di tutti i tag, 2. data (più recente prima)
 *
 * @param referenceTags - Tag di riferimento (stringa o array)
 * @param excludeSlug - Slug della story da escludere
 * @param locale - Locale per filtrare le stories
 * @param options - Opzioni aggiuntive per la richiesta
 * @returns Array di story correlate (max 8) o array vuoto se nessuna match
 */
export async function getRelatedStoriesByTags(
  referenceTags: string | string[] | null | undefined,
  excludeSlug?: string,
  locale?: string,
  options: GetStoryOptions = {}
): Promise<RelatedStory[]> {
  try {
    // Normalizza i tag in stringa per il fetch (join se array)
    const normalizeTagsToString = (
      tags: string | string[] | null | undefined
    ): string | null => {
      if (!tags) return null;
      if (Array.isArray(tags)) {
        if (tags.length === 0) return null;
        return tags.filter((tag): tag is string => Boolean(tag)).join(",");
      }
      return String(tags);
    };

    // Converte i tag in array per il sorting (mantiene originali)
    const tagsToArray = (
      tags: string | string[] | null | undefined
    ): string[] => {
      if (!tags) return [];
      if (Array.isArray(tags)) {
        return tags.filter((tag): tag is string => Boolean(tag));
      }
      return [String(tags)];
    };

    // Tag originali come array per il sorting
    const referenceTagsArray = tagsToArray(referenceTags);

    // Tag normalizzati come stringa per il fetch
    const normalizedReferenceTags = normalizeTagsToString(referenceTags);

    // Se non ci sono tag di riferimento, ritorna array vuoto
    if (!normalizedReferenceTags || referenceTagsArray.length === 0) {
      return [];
    }

    const storyblokApi = getStoryblokApi();
    const version = options.version || getStoryblokVersion();
    const cv = await getCacheVersion();

    // Build params con filter_query nella sintassi corretta di Storyblok
    // Formato: "filter_query[field][operator]": value
    const params: Record<string, any> = {
      version,
      resolve_links: "url",
      per_page: 100,
      starts_with: `${locale}/`,
      excluding_fields: "body,article", // Escludi campi grandi per performance
      ...options,
    };

    params["filter_query[component][in]"] = "story";
    params["filter_query[tag][in]"] = normalizedReferenceTags;

    // Add cv parameter if available
    if (cv !== undefined) {
      params.cv = cv;
    }

    // Fetch all matching stories
    const allStories: Story[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data } = await storyblokApi.get("cdn/stories", {
        ...params,
        page,
      });

      if (!data?.stories || data.stories.length === 0) {
        hasMore = false;
        break;
      }

      // Filter stories
      const filteredStories = data.stories.filter((story: Story) => {
        // Must be a "story" component
        if (story.content?.component !== "story") {
          return false;
        }

        // Exclude the current story if specified
        if (excludeSlug) {
          // Normalizza gli slug per il confronto (rimuove trailing slash e normalizza)
          const normalizeSlug = (slug: string) =>
            slug.replace(/\/$/, "").toLowerCase();
          const excludeSlugNormalized = normalizeSlug(excludeSlug);
          const storySlugNormalized = story.slug
            ? normalizeSlug(story.slug)
            : "";
          const storyFullSlugNormalized = story.full_slug
            ? normalizeSlug(story.full_slug)
            : "";

          // Confronta con slug, full_slug, e anche senza prefisso locale se presente
          if (
            storySlugNormalized === excludeSlugNormalized ||
            storyFullSlugNormalized === excludeSlugNormalized ||
            (locale &&
              storyFullSlugNormalized ===
                `${locale}/${excludeSlugNormalized}`) ||
            (locale &&
              excludeSlugNormalized.startsWith(`${locale}/`) &&
              storyFullSlugNormalized === excludeSlugNormalized)
          ) {
            return false;
          }
        }

        return true;
      });

      allStories.push(...filteredStories);

      // Check if there are more pages
      if (data.stories.length < params.per_page) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Se non ci sono story con tag in comune, ritorna array vuoto
    if (allStories.length === 0) {
      return [];
    }

    // Helper per convertire i tag di una story in array per il sorting
    const getStoryTagsArray = (story: Story): string[] => {
      return tagsToArray(story.content?.tag);
    };

    // Categorizza e ordina le story
    const categorizedStories = allStories.map((story: Story) => {
      const storyTags = getStoryTagsArray(story);

      // Conta quanti tag di riferimento matchano
      const matchingTagsCount = referenceTagsArray.filter((refTag) =>
        storyTags.includes(refTag)
      ).length;

      // Verifica se tutti i tag di riferimento sono presenti
      const hasAllTags = matchingTagsCount === referenceTagsArray.length;

      return {
        story,
        hasAllTags,
        matchingTagsCount,
        date:
          story.content?.date || story.published_at || story.created_at || null,
      };
    });

    // Ordina: prima quelle con tutti i tag, poi per data (più recente prima)
    categorizedStories.sort((a, b) => {
      // Prima priorità: presenza di tutti i tag
      if (a.hasAllTags && !b.hasAllTags) return -1;
      if (!a.hasAllTags && b.hasAllTags) return 1;

      // Seconda priorità: data (più recente prima)
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Ordine decrescente (più recente prima)
    });

    // Estrai solo i campi necessari e limita a 8
    const relatedStories: RelatedStory[] = categorizedStories
      .slice(0, 8)
      .map(({ story }) => ({
        full_slug: story.full_slug,
        title: story.content?.title || null,
        date:
          story.content?.date || story.published_at || story.created_at || null,
        tag: story.content?.tag || null,
        asset: story.content?.asset || [],
      }));

    return relatedStories;
  } catch (error) {
    console.error("[Storyblok] Error fetching related stories by tags:", error);
    return [];
  }
}

/**
 * Interface per progetti correlati a un prodotto
 */
export interface RelatedProject {
  uuid: string;
  full_slug: string;
  title: string;
  short_description?: string | null;
  image: AssetStoryblok[];
  /** Elenco completo (non limitato) dei prodotti del progetto (manuale o dinamico per categoria).
   *  Popolato una sola volta per progetto durante la costruzione dell'indice inverso. */
  products?: ListingStoryResolved[];
}

function asAssetArray(value: unknown): AssetStoryblok[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is AssetStoryblok => {
    if (!item || typeof item !== "object") return false;
    const asset = item as Partial<AssetStoryblok>;
    return Boolean(asset.desktop?.filename || asset.mobile?.filename);
  });
}

function toRelatedProject(story: Story): RelatedProject {
  return {
    uuid: story.uuid,
    full_slug: story.full_slug,
    title: story.content?.title || story.name,
    short_description: story.content?.short_description,
    image: asAssetArray(story.content?.image),
  };
}

function mapStoryToListingResolvedLocal(story: Story): ListingStoryResolved {
  return {
    uuid: story.uuid,
    name: story.name,
    slug: story.slug,
    full_slug: story.full_slug,
    created_at: story.created_at ?? null,
    published_at: story.published_at ?? null,
    first_published_at: story.first_published_at ?? null,
    content: (story.content ?? {}) as Record<string, unknown>,
  };
}

/** Indice invertito productUuid → progetti (una sola fetch paginata per locale) */
const relatedProjectsIndexCache = new Map<
  string,
  Timed<Map<string, RelatedProject[]>>
>();

async function buildRelatedProjectsIndex(
  locale?: string,
  options: GetStoryOptions = {}
): Promise<Map<string, RelatedProject[]>> {
  const storyblokApi = getStoryblokApi();
  const version = options.version || getStoryblokVersion();
  const cv = await getCacheVersion();
  const index = new Map<string, RelatedProject[]>();

  let page = 1;
  let hasMore = true;

  // Tutti i prodotti del locale, necessari per risolvere le varianti dinamiche
  // (categoria/sottocategoria/application_area/bestseller) di `related_products`.
  const allProductStories = await getStoriesByComponent("product", locale);
  const allProducts = allProductStories.map(mapStoryToListingResolvedLocal);

  while (hasMore) {
    const params: Record<string, any> = {
      version,
      per_page: 100,
      page,
      excluding_fields: "body,article",
      "filter_query[component][in]": "project",
      ...options,
    };

    if (locale) {
      params.starts_with = `${locale}/`;
    }

    if (cv !== undefined) {
      params.cv = cv;
    }

    const { data } = await storyblokApi.get("cdn/stories", params);
    const stories: Story[] = data?.stories ?? [];

    if (stories.length === 0) {
      break;
    }

    for (const story of stories) {
      const project = toRelatedProject(story);
      // Normalizza il valore raw del campo plugin (variant + selection_mode ecc.)
      // e risolve l'elenco COMPLETO (non limitato) di prodotti del progetto,
      // sia in modalità manuale che dinamica per categoria.
      const rawRelated = story.content?.related_products;
      const normalizedRelated =
        typeof rawRelated === "object" && rawRelated !== null
          ? { ...rawRelated, variant: "related_products" }
          : rawRelated;
      const parsed = parseCarouselVariant(normalizedRelated);

      let products: ListingStoryResolved[];
      if (parsed.selection_mode === "manual") {
        if (parsed.items.length === 0) continue;
        const included = new Set(parsed.items);
        products = allProducts.filter((p) => included.has(p.uuid));
      } else {
        const filtered = filterListingByVista(allProducts, {
          selection_mode: "dynamic",
          vista: parsed.vista,
          category: parsed.category,
          subcategory: parsed.subcategory,
          application_area: parsed.application_area,
          bestseller: parsed.bestseller,
        });
        products = sortProductStories(filtered, "recent");
      }

      if (products.length === 0) continue;

      project.products = products;

      for (const product of products) {
        const existing = index.get(product.uuid) ?? [];
        existing.push(project);
        index.set(product.uuid, existing);
      }
    }

    hasMore = stories.length === params.per_page;
    page += 1;
  }

  return index;
}

function getRelatedProjectsIndex(
  locale?: string,
  options: GetStoryOptions = {}
): Promise<Map<string, RelatedProject[]>> {
  const version = options.version || getStoryblokVersion();
  const cacheKey = `${version}:${locale ?? "__all__"}`;
  return remember(relatedProjectsIndexCache, cacheKey, version, () =>
    buildRelatedProjectsIndex(locale, options),
  );
}

/**
 * Query inversa: trova tutti i progetti che referenziano un prodotto.
 * Usa un indice invertito (fetch unica paginata per locale) per evitare
 * N chiamate API durante la build statica.
 *
 * @param productUuid - UUID del prodotto corrente
 * @param locale - Locale per filtrare le stories
 * @param options - Opzioni aggiuntive
 * @returns Array di progetti correlati
 */
export async function getRelatedProjectsByProduct(
  productUuid: string,
  locale?: string,
  options: GetStoryOptions = {}
): Promise<RelatedProject[]> {
  try {
    if (!productUuid) return [];

    const index = await getRelatedProjectsIndex(locale, options);
    return index.get(productUuid) ?? [];
  } catch (error) {
    console.error("[Storyblok] Error fetching related projects by product:", error);
    return [];
  }
}

const relatedNewsIndexCache = new Map<string, Timed<Map<string, RelatedStory[]>>>()

function toRelatedStory(story: Story): RelatedStory {
  return {
    full_slug: story.full_slug,
    title: story.content?.title || story.name,
    date: story.content?.date || story.published_at || story.created_at || null,
    tag: story.content?.tag || null,
    asset: asAssetArray(story.content?.asset),
  }
}

function sortRelatedStories(stories: RelatedStory[]): RelatedStory[] {
  return stories.toSorted((left, right) => {
    const leftDate = left.date ? new Date(left.date).getTime() : 0
    const rightDate = right.date ? new Date(right.date).getTime() : 0
    return rightDate - leftDate
  })
}

async function buildRelatedNewsIndex(
  locale?: string,
  options: GetStoryOptions = {},
): Promise<Map<string, RelatedStory[]>> {
  const [newsStories, productStories] = await Promise.all([
    getStoriesByComponent('story', locale, options),
    getStoriesByComponent('product', locale, options),
  ])
  const allProducts = productStories.map(mapStoryToListingResolvedLocal)
  const index = new Map<string, RelatedStory[]>()

  for (const newsStory of newsStories) {
    const rawRelated = newsStory.content?.related_products
    if (!rawRelated || typeof rawRelated !== 'object') continue

    const parsed = parseCarouselVariant({
      ...rawRelated,
      variant: 'related_products',
    })
    const relatedProducts =
      parsed.selection_mode === 'manual'
        ? allProducts.filter((product) => parsed.items.includes(product.uuid))
        : filterListingByVista(allProducts, {
            selection_mode: 'dynamic',
            vista: parsed.vista,
            category: parsed.category,
            subcategory: parsed.subcategory,
            application_area: parsed.application_area,
            bestseller: parsed.bestseller,
          })

    const relatedNews = toRelatedStory(newsStory)
    for (const product of relatedProducts) {
      const news = index.get(product.uuid) ?? []
      news.push(relatedNews)
      index.set(product.uuid, news)
    }
  }

  for (const [productUuid, news] of index) {
    index.set(productUuid, sortRelatedStories(news))
  }

  return index
}

function getRelatedNewsIndex(
  locale?: string,
  options: GetStoryOptions = {},
): Promise<Map<string, RelatedStory[]>> {
  const version = options.version || getStoryblokVersion()
  const cacheKey = `${version}:${locale ?? '__all__'}`
  return remember(relatedNewsIndexCache, cacheKey, version, () =>
    buildRelatedNewsIndex(locale, options),
  )
}

/**
 * Query inversa: trova le news che referenziano il prodotto nel loro campo
 * `related_products`, sia manuale sia dinamico per categoria o application area.
 */
export async function getRelatedNewsByProduct(
  productUuid: string,
  locale?: string,
  options: GetStoryOptions = {},
): Promise<RelatedStory[]> {
  if (!productUuid) return []

  try {
    const index = await getRelatedNewsIndex(locale, options)
    return (index.get(productUuid) ?? []).slice(0, 8)
  } catch (error) {
    console.error('[Storyblok] Error fetching related news by product:', error)
    return []
  }
}
