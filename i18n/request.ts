import { getRequestConfig } from "next-intl/server";
import { hasLocale, IntlErrorCode } from "next-intl";
import { routing } from "./routing";
import { getMessagesFromDatasource } from "../lib/api/storyblok/datasource";

/**
 * Request configuration for next-intl
 *
 * This function is called on every request to:
 * - Read the matched locale from the [locale] segment
 * - Load translation messages from Storyblok datasource
 * - Provide configuration to Server Components
 *
 * @see https://next-intl.dev/docs/routing/setup
 */
// Map to store missing messages per locale
const missingMessagesByLocale = new Map<string, Set<string>>();

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Validate locale against routing config default
  // Note: We can't validate against Storyblok locales here since
  // the middleware already does that, and this would create circular deps
  if (!locale || !hasLocale([routing.defaultLocale], locale)) {
    locale = routing.defaultLocale;
  }

  // Fetch messages from Storyblok datasource
  const messages = await getMessagesFromDatasource("labels", locale);

  // Determine text direction based on locale
  const isRTL = locale === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  // Initialize Set for this locale if it doesn't exist
  if (!missingMessagesByLocale.has(locale)) {
    missingMessagesByLocale.set(locale, new Set<string>());
  }
  const missingMessages = missingMessagesByLocale.get(locale)!;

  return {
    locale,
    messages,
    timeZone: "Europe/Rome",
    now: new Date(),

    // 1. Questo evita che l'errore interrompa il rendering
    getMessageFallback: ({ namespace, key, error }) => {
      // Costruisci la chiave completa del messaggio
      const messageKey = namespace ? `${namespace}.${key}` : key;

      // Se c'è un errore di messaggio mancante, raccogli la chiave
      if (error && error.code === IntlErrorCode.MISSING_MESSAGE) {
        if (!missingMessages.has(messageKey)) {
          missingMessages.add(messageKey);
          // Logga tutte le label mancanti insieme
          const allMissing = Array.from(missingMessages);
          console.warn(
            `[next-intl] Missing messages for locale "${locale}":`,
            allMissing
          );
        }
      }
      // Restituisce solo la chiave (es. "nav.home") invece di crashare
      return messageKey;
    },

    // 2. Questo gestisce il LOGGING per altri errori e previene che vengano rilanciati
    onError: (error) => {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        // Gli errori MISSING_MESSAGE sono già gestiti da getMessageFallback
        // Non rilanciare l'errore - questo previene che venga mostrato come errore
        return;
      } else {
        console.error(error); // Errori critici meglio lasciarli come error
      }
    },

    // 3. Configurazione per prevenire errori in sviluppo
    ...(isRTL && { direction: "rtl" }),
  };
});
