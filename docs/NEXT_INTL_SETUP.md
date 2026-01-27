# next-intl Setup

This project uses `next-intl` for internationalization, integrated with Storyblok's locale management.

## Overview

- **Locales**: Dynamically fetched from Storyblok using the Management API
- **Routing**: Automatic locale prefix routing (e.g., `/en/about`, `/it/contatti`)
- **Translations**: JSON files in `/messages` directory for UI strings
- **Content**: Storyblok provides localized content through folder structure

## Architecture

### 1. Routing Configuration (`lib/routing.ts`)

Defines the routing strategy for next-intl:

```typescript
export const routing = defineRouting({
  defaultLocale: "it",
  localePrefix: "always", // Always show locale in URL
});
```

### 2. Navigation APIs (`lib/navigation.ts`)

Exports locale-aware navigation components and hooks:

```typescript
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

These wrappers automatically handle:

- User's current locale
- Locale prefixes in URLs
- Type-safe navigation

### 3. Locale Detection (`middleware.ts`)

The middleware handles:

- Automatic locale detection from `Accept-Language` header
- Locale prefix routing
- Redirects from root to default locale
- Caches locales from Storyblok (1 minute TTL) to avoid fetching on every request

```typescript
// Example: User visits `/` → redirects to `/it/` (default locale)
// Example: User visits `/en/about` → renders English version
```

### 4. i18n Configuration (`i18n/request.ts`)

Validates incoming locale parameters and loads translation messages from Storyblok datasources:

```typescript
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate locale against routing config default
  if (!locale || !hasLocale([routing.defaultLocale], locale)) {
    locale = routing.defaultLocale;
  }

  // Fetch messages from Storyblok datasource
  const messages = await getMessagesFromDatasource("labels", locale);

  return {
    locale,
    messages,
    timeZone: "Europe/Rome",
    now: new Date(),
  };
});
```

### 5. Root Layout (`app/[locale]/layout.tsx`)

- Validates locale parameter
- Loads translation messages
- Provides `NextIntlClientProvider` to child components
- Sets `lang` attribute dynamically based on locale

### 6. Translation Datasource (Storyblok)

Translation messages are managed in a Storyblok datasource named **"labels"** (configurable).

#### Setup in Storyblok:

1. Go to **Content > Datasources**
2. Create a new datasource called **"labels"** (or use "translations" and update the code)
3. Enable **"Add dimension for entries"**
4. Set dimension values to your locale codes: `it`, `en`, `de`, etc.
5. Add entries with dot-notation names

#### Example Datasource Entries:

| Name             | Value                     | Dimension |
| ---------------- | ------------------------- | --------- |
| `common.loading` | Caricamento...            | it        |
| `common.loading` | Loading...                | en        |
| `common.error`   | Si è verificato un errore | it        |
| `common.error`   | An error occurred         | en        |
| `nav.home`       | Home                      | it        |
| `nav.home`       | Home                      | en        |
| `nav.about`      | Chi siamo                 | it        |
| `nav.about`      | About us                  | en        |

The dot notation (e.g., `common.loading`) creates nested objects:

```json
{
  "common": {
    "loading": "Caricamento...",
    "error": "Si è verificato un errore"
  },
  "nav": {
    "home": "Home",
    "about": "Chi siamo"
  }
}
```

#### Local Fallback (Optional):

If you prefer, you can keep local JSON files in `messages/` as fallback:

```
messages/
├── it.json  (Italian - default)
├── en.json  (English)
└── de.json  (German - add as needed)
```

## Usage

### Navigation

Use the locale-aware navigation APIs instead of Next.js default ones:

```typescript
// ❌ Don't use Next.js Link directly
import Link from "next/link";

// ✅ Use next-intl Link
import { Link } from "@/lib/navigation";
```

#### Link Component

```typescript
import { Link } from '@/lib/navigation'

// Basic link (automatically adds locale prefix)
<Link href="/about">About</Link>
// Renders: /it/about (or /en/about based on user's locale)

// With query parameters
<Link href={{ pathname: '/users', query: { sortBy: 'name' } }}>
  Users
</Link>

// Switch locale
<Link href="/" locale="en">
  Switch to English
</Link>
```

#### Programmatic Navigation

```typescript
'use client'
import { useRouter } from '@/lib/navigation'

export default function MyComponent() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/about')
    // Navigates to /it/about (or /en/about)
  }

  const switchLocale = () => {
    router.replace('/', { locale: 'en' })
  }

  return <button onClick={handleClick}>Go to About</button>
}
```

#### Get Current Pathname

```typescript
'use client'
import { usePathname } from '@/lib/navigation'

export default function MyComponent() {
  // Returns pathname WITHOUT locale prefix
  const pathname = usePathname()
  // On /it/about → returns "/about"
  // On /en/about → returns "/about"

  return <div>Current page: {pathname}</div>
}
```

### Translations

#### In Server Components

```typescript
import { useTranslations } from 'next-intl'

export default function MyPage() {
  const t = useTranslations('common')

  return <h1>{t('loading')}</h1>
}
```

### In Client Components

```typescript
'use client'
import { useTranslations } from 'next-intl'

export default function MyComponent() {
  const t = useTranslations('navigation')

  return <a href="#">{t('home')}</a>
}
```

### Get Current Locale

```typescript
import { useLocale } from 'next-intl'

export default function LocaleSwitcher() {
  const locale = useLocale() // 'it', 'en', etc.

  return <span>Current: {locale}</span>
}
```

### Date/Number Formatting

```typescript
import { useFormatter } from 'next-intl'

export default function FormattedData() {
  const format = useFormatter()

  return (
    <>
      <p>{format.dateTime(new Date(), { dateStyle: 'long' })}</p>
      <p>{format.number(1234.56, { style: 'currency', currency: 'EUR' })}</p>
    </>
  )
}
```

## Locale Switching

Create a locale switcher component:

```typescript
'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/lib/navigation'
import { useGlobalSettings } from '@/lib/global-settings-context'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { locales } = useGlobalSettings()

  const switchLocale = (newLocale: string) => {
    // Navigate to the same page in a different locale
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
```

## Adding New Locales

1. **Add folder in Storyblok**:
   - Create a new folder at root level (e.g., `de` for German)
   - Add at least one published story inside

2. **Add translations in datasource**:
   - Go to **Content > Datasources > labels** (or your datasource name)
   - For each existing entry, add a new entry with:
     - Same **Name** (e.g., `common.loading`)
     - Translated **Value** (e.g., `Laden...`)
     - New **Dimension** value (e.g., `de`)

3. **Rebuild**:
   ```bash
   npm run build
   ```

The new locale will be automatically detected by `getLangs()` and added to the routing.

### Quick Add All Translations

To bulk-add translations for a new locale:

1. Export existing datasource entries
2. Duplicate entries with new dimension value
3. Translate values
4. Import back to Storyblok

## Content Strategy

- **UI Strings** (buttons, labels, errors): Use `next-intl` with Storyblok datasources
- **Content** (pages, blog posts, etc.): Use Storyblok's localized content

This approach allows:

- **Content editors** to manage both UI strings and content in Storyblok
- **No code deployments** needed for translation updates
- **Real-time updates** in draft mode
- **Centralized management** of all localized content

### Datasource API (`lib/storyblok-datasource-api.ts`)

The datasource API provides utilities for fetching and transforming datasource entries:

```typescript
// Fetch all entries for a locale
const entries = await getDatasourceEntries("labels", "it");

// Transform entries to nested object
const messages = transformDatasourceToMessages(entries);

// Get messages ready for next-intl (combines both)
const messages = await getMessagesFromDatasource("labels", "it");
```

## Performance

- Locales are cached in middleware (1 minute TTL)
- Translation messages are loaded once per locale
- Static generation pre-renders all locale variants
- No runtime overhead for locale detection

## Troubleshooting

### "No locales found from Storyblok"

- Check `STORYBLOK_MANAGEMENT_TOKEN` is set
- Verify root-level folders exist in Storyblok
- Ensure folders have published stories (except `layout-components`)

### Translation not updating

- Check the datasource entries in Storyblok
- Verify the dimension value matches the locale (e.g., `it`, `en`)
- Clear cache and restart dev server
- Verify the entry name uses dot notation (e.g., `common.loading`)
- Check Storyblok API is returning the entries (check console logs)

### Locale not in URL

- The middleware uses `localePrefix: 'always'`
- All URLs will have locale prefix (e.g., `/it/home`, not `/home`)
- Root `/` redirects to default locale

## References

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Storyblok Locales API](./LANGS_API.md)
- [Storyblok Datasource API](./DATASOURCE_API.md)
- [Static Generation](./STATIC_GENERATION.md)
