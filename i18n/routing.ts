import { defineRouting } from "next-intl/routing";
import localeConfig from "./locales.json";

/**
 * Routing configuration for next-intl
 *
 * IMPORTANT: This file is imported by middleware.ts which runs in Edge Runtime.
 * Do NOT import any module that uses Node.js APIs (fs, path, process.cwd, etc.)
 *
 * Locales are read from i18n/locales.json, generated at build time by:
 *   node scripts/fetch-locales.mjs
 */
export const routing = defineRouting({
  locales: localeConfig.locales as readonly string[],
  defaultLocale: localeConfig.defaultLocale,
  localePrefix: "always",
});
