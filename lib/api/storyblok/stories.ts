/**
 * Storyblok Stories API
 *
 * Functions for fetching stories from Storyblok CDN API.
 */

import { getStoryblokApi } from "./client";
import { getStoryblokVersion, getCacheVersion } from "./config";
import { AssetStoryblok } from "@/types/storyblok";

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
export async function getStory(
  slug: string,
  locale?: string,
  options: GetStoryOptions = {}
): Promise<Story | null> {
  const storyPath =
    locale && !slug.startsWith(locale + "/") ? `${locale}/${slug}` : slug;

  try {
    const storyblokApi = getStoryblokApi();
    const version = options.version || getStoryblokVersion();
    const cv = await getCacheVersion();

    const params: Record<string, any> = {
      version,
      resolve_links: "url",
      resolve_relations: "",
      ...options,
    };

    // Add cv parameter if available (omitted in dev to encourage caching)
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

    console.error(`[Storyblok] Error fetching ${storyPath}}`);

    return null;
  }
}

/**
 * Recupera tutte le stories da Storyblok per generateStaticParams
 * Esclude automaticamente le stories in 'layout-components'
 *
 * @param options - Opzioni per la richiesta
 * @param options.version - Versione da usare (default: basata su ambiente)
 * @param options.excludePaths - Path da escludere (default: ['layout-components'])
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
    version = getStoryblokVersion(),
    excludePaths = ["layout-components"],
    perPage = 100,
  } = options;

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
      };

      // Add cv parameter if available (omitted in dev to encourage caching)
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
        const segments = fullSlug.split("/");

        // Check first segment (e.g., 'layout-components')
        if (excludePaths.includes(segments[0])) {
          return false;
        }

        // Check second segment (e.g., 'en/layout-components')
        if (segments.length > 1 && excludePaths.includes(segments[1])) {
          return false;
        }

        return true;
      });

      allStories.push(...filteredStories);

      // Check if there are more pages
      if (data.stories.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return allStories;
  } catch (error) {
    return [];
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
