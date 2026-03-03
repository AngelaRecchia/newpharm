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

  return {
    locale,
    messages,
    timeZone: "Europe/Rome",
    now: new Date(),
    onError: (error) => {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        console.log("missing message", error);
        console.warn(error);
      } else {
        // Other errors indicate a bug in the app and should be reported
        console.error(error);
      }
    },
    // Add direction for RTL support
    ...(isRTL && { direction: "rtl" }),
  };
});
