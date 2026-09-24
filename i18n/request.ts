import { getRequestConfig } from "next-intl/server";
import { hasLocale, IntlErrorCode } from "next-intl";
import { routing } from "./routing";
import { getMessagesFromDatasource } from "../lib/api/storyblok/datasource";
import { INSECT_MACRO_CATEGORIES } from "../lib/insects/taxonomy";

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

  // Validate locale against supported locales
  // Note: We can't validate against Storyblok locales here since
  // the middleware already does that, and this would create circular deps
  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  const insectTaxonomyFallbacks = Object.fromEntries(
    INSECT_MACRO_CATEGORIES.map(({ value, label }) => [
      value,
      label,
    ]),
  );

  // Fallback translations for features not yet present in Storyblok datasource
  const searchFallbacks: Record<string, Record<string, string>> = {
    it: {
      cerca_per: "Cerca per",
      search_placeholder: "Cosa stai cercando?",
      close: "Chiudi",
      clear_search: "Cancella",
      most_searched: "I più cercati",
      search_solutions: "Soluzioni",
      search_products: "Prodotti",
      search_stories: "Stories",
      search_downloads: "Download",
      search_all: "Tutti",
      search_results_for: "<b>{count}</b> risultati per:",
      search_no_results: "Nessun risultato",
      search_no_results_hint: "Nessun risultato trovato.\nProva a modificare i termini di ricerca o usa i filtri per trovare ciò che cerchi.",
      all_results: "Tutti i risultati",
      show_all: "Mostra tutti",
      see_all: "Vedi tutti",
      you_might_be_interested_in: "Potrebbero interessarti anche:",
      loading: "Caricamento...",
    },
    en: {
      cerca_per: "Search for",
      search_placeholder: "What are you looking for?",
      close: "Close",
      clear_search: "Clear",
      most_searched: "Most searched",
      search_solutions: "Solutions",
      search_products: "Products",
      search_stories: "Stories",
      search_downloads: "Downloads",
      search_all: "All",
      search_results_for: "<b>{count}</b> results for:",
      search_no_results: "No results found",
      search_no_results_hint: "No results found.\nTry changing your search terms or use the filters to find what you're looking for.",
      all_results: "All results",
      show_all: "Show all",
      see_all: "See all",
      you_might_be_interested_in: "You might also be interested in:",
      loading: "Loading...",
    },
    ar: {
      cerca_per: "ابحث عن",
      search_placeholder: "عن ماذا تبحث؟",
      close: "إغلاق",
      clear_search: "مسح",
      most_searched: "الأكثر بحثًا",
      search_solutions: "حلول",
      search_products: "منتجات",
      search_stories: "Stories",
      search_downloads: "تنزيلات",
      search_all: "الكل",
      search_results_for: "<b>{count}</b> نتيجة لـ:",
      search_no_results: "لا توجد نتائج",
      search_no_results_hint: "لم يتم العثور على نتائج.\nحاول تغيير مصطلحات البحث أو استخدم الفلاتر للعثور على ما تبحث عنه.",
      all_results: "كل النتائج",
      show_all: "عرض الكل",
      see_all: "عرض الكل",
      you_might_be_interested_in: "قد يهمك أيضًا:",
      loading: "جار التحميل...",
    },
  };

  // Fetch messages from Storyblok datasource
  const messages = {
    ...(await getMessagesFromDatasource("labels", locale)),
    ...insectTaxonomyFallbacks,
    ...(searchFallbacks[locale] || searchFallbacks.en),
    accepts_terms:
      locale === "it"
        ? "Ho letto e accetto i <a>termini e condizioni</a>"
        : "I have read and accept the <a>terms and conditions</a>",
    upload_file_hint:
      locale === "it" ? "PDF o DOC, massimo 5 MB" : "PDF or DOC, maximum 5 MB",
    your_surname_here:
      locale === "it" ? "Inserisci il cognome" : "Enter your surname",
    phone_placeholder:
      locale === "it" ? "Inserisci il telefono" : "Enter your phone number",
    message_placeholder:
      locale === "it" ? "Scrivi il messaggio" : "Write your message",
  };

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
