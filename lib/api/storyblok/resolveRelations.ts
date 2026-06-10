/**
 * Parametro `resolve_relations` per Storyblok CDN (stesso valore ovunque: SSR e Visual Editor).
 *
 * Elenco separato da virgole `component.field` per ogni blocco che contiene riferimenti a story.
 * Aggiungi qui nuovi campi se servono altre relazioni risolte lato CDN.
 *
 * @see https://www.storyblok.com/docs/api/content-delivery/v2#parameters/resolve_relations
 */
export const STORYBLOK_RESOLVE_RELATIONS = "catalogs_download.items" as const;
