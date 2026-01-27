import { defineRouting } from 'next-intl/routing'

/**
 * Routing configuration for next-intl
 * 
 * Note: Since locales are dynamically fetched from Storyblok,
 * we don't specify them here. The middleware will fetch and apply
 * the actual available locales at runtime.
 */
export const routing = defineRouting({
  // Default locale (used when no locale can be detected)
  defaultLocale: 'it',
  
  // Locale prefix strategy
  // 'always' = always show locale in URL (e.g., /en/about, /it/about)
  localePrefix: 'always',
})
