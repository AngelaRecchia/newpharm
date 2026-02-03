import { defineRouting } from "next-intl/routing";
import { getLangs } from "@/lib/api/storyblok/languages";

/**
 * Get available locales from Storyblok
 * Falls back to default locales if fetch fails
 */
async function getAvailableLocales(): Promise<string[]> {
  try {
    const locales = await getLangs({ checkForContent: false });
    // Ensure default locale is always included
    const defaultLocale = "it";
    if (locales.length > 0) {
      return locales.includes(defaultLocale)
        ? locales
        : [defaultLocale, ...locales];
    }
    return [defaultLocale];
  } catch (error) {
    console.warn(
      "Failed to fetch locales from Storyblok, using fallback:",
      error
    );
    return ["it", "en"]; // Fallback for TypeScript type safety
  }
}

/**
 * Routing configuration for next-intl
 *
 * Note: Locales are dynamically fetched from Storyblok at runtime.
 * The fallback locales ["it", "en"] are used for TypeScript type safety
 * and will be replaced by actual Storyblok locales at runtime.
 */
export const routing = defineRouting({
  // Locales will be validated dynamically against Storyblok
  // Fallback for TypeScript type safety
  locales: ["it", "en"] as readonly string[],

  // Default locale (used when no locale can be detected)
  defaultLocale: "it",

  // Locale prefix strategy
  // 'as-needed' = hide default locale (it) from URL, but keep it in params
  // Other locales (en, ar) will always show in URL
  localePrefix: "always",
});

/**
 * Get routing configuration with dynamic locales from Storyblok
 * Use this in server components where you need actual locales
 */
export async function getRoutingWithLocales() {
  const locales = await getAvailableLocales();
  return {
    ...routing,
    locales: locales as readonly string[],
  };
}
