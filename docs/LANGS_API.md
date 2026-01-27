# Storyblok Languages API - Global Settings Integration

## Overview

The `storyblok-langs-api.ts` module provides functions to retrieve available locales from Storyblok using the **Management API**. The locales are automatically included in your **Global Settings** context for easy access throughout your app.

## Functions

### `getLangs(options?)` ⭐ Recommended

Retrieves available locales using the **Storyblok Management API** by querying root-level folders directly.

**Parameters:**
- `options.excludePaths` (string[], optional): Folder names to exclude. Default: `['layout-components']`
- `options.checkForContent` (boolean, optional): Verify each locale has published content. Default: `true`

**Returns:** `Promise<string[]>` - Array of available locale codes

**Requirements:** `STORYBLOK_MANAGEMENT_TOKEN` environment variable

**Example:**
```typescript
import { getLangs } from '@/lib/storyblok-langs-api'

const locales = await getLangs()
// Returns: ['en', 'it', 'de']
```

---

### `getLangs(options?)` with `checkForContent`

The `getLangs()` function has a `checkForContent` option that verifies each locale folder has at least one published story.

**Parameters:**
- `options.excludePaths` (string[], optional): Folder names to exclude. Default: `['layout-components']`
- `options.checkForContent` (boolean, optional): Verify each locale has published content. Default: `true`

**Example:**
```typescript
import { getLangs } from '@/lib/storyblok-langs-api'

// With content check (default)
const locales = await getLangs({ checkForContent: true })
// Returns only: ['en', 'it'] if 'de' has no published stories

// Without content check (faster)
const allLocales = await getLangs({ checkForContent: false })
// Returns: ['en', 'it', 'de'] (all folders, regardless of content)
```

---

## Global Settings Integration

The available locales are **automatically fetched and included** in your Global Settings context.

### How It Works

When `getGlobalSettings(locale)` is called, it:
1. Fetches the layout-components for that locale
2. Calls `getLangs()` to get available locales
3. Adds `availableLocales` to the settings object
4. Returns the combined settings

### Access Locales in Components

#### Server Components (Direct)

```typescript
// app/[locale]/[[...slug]]/(with-layout)/page.tsx
import { getGlobalSettings } from '@/lib/global-settings-api'

export default async function Page({ params }) {
  const { locale } = await params
  const settings = await getGlobalSettings(locale)
  
  const availableLocales = settings?.availableLocales || []
  
  return (
    <div>
      <h1>Available Languages: {availableLocales.join(', ')}</h1>
    </div>
  )
}
```

#### Client Components (via Context)

```typescript
'use client'

import { useGlobalSettings } from '@/lib/global-settings-context'

export default function LanguageSelector() {
  const settings = useGlobalSettings()
  const availableLocales = settings?.availableLocales || []
  
  return (
    <nav>
      {availableLocales.map(locale => (
        <a key={locale} href={`/${locale}`}>
          {locale.toUpperCase()}
        </a>
      ))}
    </nav>
  )
}
```

---

## Setup

### Environment Variables

Add to `.env.local`:

```bash
# Required for getLangs()
STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here

# Required for all Storyblok API calls
NEXT_PUBLIC_STORYBLOK_SPACE_ID=your_space_id_here
```

Get your Management Token from: https://app.storyblok.com/#/me/account

---

## Complete Examples

### 1. Language Selector Component

```typescript
'use client'

import { useGlobalSettings } from '@/lib/global-settings-context'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'

const localeNames: Record<string, string> = {
  'en': 'English',
  'it': 'Italiano',
  'de': 'Deutsch',
}

export default function LanguageSelector() {
  const settings = useGlobalSettings()
  const params = useParams()
  const pathname = usePathname()
  
  const currentLocale = params.locale as string
  const availableLocales = settings?.availableLocales || []
  
  // Replace current locale in pathname with new locale
  const getLocalizedPath = (newLocale: string) => {
    return pathname.replace(`/${currentLocale}`, `/${newLocale}`)
  }
  
  return (
    <div className="language-selector">
      {availableLocales.map(locale => (
        <Link
          key={locale}
          href={getLocalizedPath(locale)}
          className={locale === currentLocale ? 'active' : ''}
        >
          {localeNames[locale] || locale.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
```

### 2. Check Locale Availability

```typescript
'use client'

import { useGlobalSettings } from '@/lib/global-settings-context'
import { useParams } from 'next/navigation'
import { redirect } from 'next/navigation'

export default function LocaleValidator() {
  const settings = useGlobalSettings()
  const params = useParams()
  
  const currentLocale = params.locale as string
  const availableLocales = settings?.availableLocales || []
  
  // Redirect if current locale is not available
  if (!availableLocales.includes(currentLocale)) {
    const defaultLocale = availableLocales[0] || 'en'
    redirect(`/${defaultLocale}`)
  }
  
  return null
}
```

### 3. Locale Switcher with Flags

```typescript
'use client'

import { useGlobalSettings } from '@/lib/global-settings-context'
import { useParams } from 'next/navigation'
import Image from 'next/image'

const localeConfig = {
  'en': { name: 'English', flag: '🇬🇧' },
  'it': { name: 'Italiano', flag: '🇮🇹' },
  'de': { name: 'Deutsch', flag: '🇩🇪' },
}

export default function LocaleSwitcher() {
  const settings = useGlobalSettings()
  const params = useParams()
  
  const currentLocale = params.locale as string
  const availableLocales = settings?.availableLocales || []
  
  return (
    <select
      value={currentLocale}
      onChange={(e) => {
        const newLocale = e.target.value
        window.location.href = window.location.pathname.replace(
          `/${currentLocale}`,
          `/${newLocale}`
        )
      }}
    >
      {availableLocales.map(locale => {
        const config = localeConfig[locale] || { name: locale, flag: '' }
        return (
          <option key={locale} value={locale}>
            {config.flag} {config.name}
          </option>
        )
      })}
    </select>
  )
}
```

### 4. Generate Static Params

```typescript
// app/[locale]/[[...slug]]/(with-layout)/page.tsx
import { getLangs } from '@/lib/storyblok-langs-api'

export async function generateStaticParams() {
  const locales = await getLangs()
  
  // Generate params for all available locales
  return locales.map((locale) => ({
    locale,
  }))
}
```

### 5. Locale Metadata

```typescript
import { getLangs } from '@/lib/storyblok-langs-api'
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params
  const locales = await getLangs()
  
  return {
    title: 'My Site',
    description: 'Available in multiple languages',
    alternates: {
      languages: Object.fromEntries(
        locales.map(loc => [loc, `/${loc}`])
      ),
    },
  }
}
```

---

## How Management API Works

### Query Root-Level Folders

```
GET /spaces/{space_id}/stories?filter_query[parent_id][in]=0
```

**Storyblok Structure:**
```
Root (parent_id = 0)
├── en/ (is_folder: true, published: true)
│   ├── home
│   ├── about
│   └── layout-components/ (excluded from locale list)
├── it/ (is_folder: true, published: true)
│   ├── home
│   └── about
├── de/ (is_folder: true, published: false) <- excluded if requirePublished
└── layout-components/ (excluded)
```

**Result:** `['en', 'it']`

---

## Performance & Caching

Locales are fetched once per request when `getGlobalSettings()` is called. The global settings are typically loaded at layout level, so locales are available throughout your app.

### Caching Recommendation

If you need to call `getLangs()` multiple times, cache it:

```typescript
import { unstable_cache } from 'next/cache'
import { getLangs } from '@/lib/storyblok-langs-api'

export const getCachedLangs = unstable_cache(
  async () => getLangs(),
  ['available-locales'],
  { revalidate: 3600 } // 1 hour
)
```

---

## Error Handling

If `getLangs()` fails:
- Returns empty array `[]`
- Logs error to console
- `availableLocales` in settings will be `[]`

Your components should handle empty arrays gracefully:

```typescript
const availableLocales = settings?.availableLocales || []

if (availableLocales.length === 0) {
  return <div>No languages available</div>
}
```

---

## TypeScript Types

The `GlobalSettings` interface includes `availableLocales`:

```typescript
export interface GlobalSettings {
  header?: any
  footer?: any
  availableLocales?: string[]
  [key: string]: any
}
```

Use it with proper types:

```typescript
import type { GlobalSettings } from '@/lib/global-settings-api'

const settings: GlobalSettings | null = await getGlobalSettings('en')
const locales: string[] = settings?.availableLocales || []
```

---

## Best Practices

1. ✅ **Access via context in client components** - `useGlobalSettings()`
2. ✅ **Access directly in server components** - `await getGlobalSettings(locale)`
3. ✅ **Handle empty arrays** - Always provide fallback: `|| []`
4. ✅ **Use for navigation** - Build language switchers
5. ✅ **Cache when calling directly** - Use `unstable_cache` for repeated calls
6. ⚠️ **Don't call `getLangs()` in client components** - Use context instead

---

## Troubleshooting

### `availableLocales` is undefined

**Cause:** Global settings failed to load or `getLangs()` failed

**Solution:**
```typescript
const locales = settings?.availableLocales || []
```

### `availableLocales` is empty array

**Possible causes:**
1. No root-level folders in Storyblok
2. All folders are unpublished
3. Management Token is invalid

**Debug:**
```typescript
// In global-settings-api.ts
const availableLocales = await getLangs()
console.log('Fetched locales:', availableLocales)
```

### Locales not updating

**Cause:** Settings might be cached

**Solution:** Clear Next.js cache or wait for revalidation period

---

## Summary

✅ **Automatic**: Locales are fetched and added to global settings  
✅ **Accessible**: Use `useGlobalSettings()` in client components  
✅ **Type-safe**: Full TypeScript support  
✅ **Efficient**: Management API queries folders directly  
✅ **Reliable**: Error handling with fallbacks  

No need for CDN fallback since locales are stored in your global settings context! 🎉
