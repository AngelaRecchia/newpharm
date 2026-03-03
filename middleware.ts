import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default intlMiddleware;

export const config = {
  // Match tutti i pathname (il middleware validerà dinamicamente le locales)
  matcher: [
    // Match tutti i pathname tranne:
    // - API routes
    // - _next (Next.js internals)
    // - Files statici (immagini, font, ecc.)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
