/**
 * Traduzione con fallback letterale.
 *
 * next-intl con `getMessageFallback` (vedi i18n/request.ts) restituisce la
 * chiave stessa quando il messaggio manca nel datasource Storyblok. Questo
 * helper rileva quel caso e restituisce un default locale (di solito la label
 * italiana), così i componenti non mostrano mai `request_info` a schermo in
 * attesa che il team aggiunga la chiave al datasource `labels`.
 */
export function tSafe(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  const value = t(key)
  return typeof value === 'string' && value !== key ? value : fallback
}