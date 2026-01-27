import { defineRouting } from "next-intl/routing";

/**
 * Routing configuration for next-intl
 *
 * Note: While locales are dynamically fetched from Storyblok at runtime,
 * we specify the known locales here for TypeScript type safety.
 * The middleware will validate against actual Storyblok locales.
 */
export const routing = defineRouting({
  // Known locales (must include all locales used in Storyblok)
  // These are the example locales: it (default), en, ar (RTL)
  locales: ["it", "en"],

  // Default locale (used when no locale can be detected)
  defaultLocale: "it",

  // Locale prefix strategy
  // 'always' = always show locale in URL (e.g., /en/about, /it/about)
  localePrefix: "always",
});
