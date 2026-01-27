# Static Site Generation (SSG) with Storyblok

## Overview

This project uses Next.js `generateStaticParams` to pre-render all pages at build time, fetching content from Storyblok based on environment (published in production, draft in development).

## How It Works

### 1. Get Available Locales

```typescript
import { getLangs } from '@/lib/storyblok-langs-api'

const locales = await getLangs()
// Returns: ['en', 'it', 'de']
```

Uses **Management API** to query root-level folders (locales).

### 2. Get All Stories

```typescript
import { getAllStories } from '@/lib/storyblok-stories-api'

const stories = await getAllStories()
// Returns all stories, automatically excludes 'layout-components'
```

- **Production**: Fetches `published` stories
- **Development**: Fetches `draft` stories
- **Pagination**: Automatically handles multiple pages
- **Filtering**: Excludes `layout-components` by default

### 3. Generate Static Params

```typescript
// app/[locale]/[[...slug]]/(with-layout)/page.tsx
export async function generateStaticParams() {
  const locales = await getLangs()
  const stories = await getAllStories()

  const params = []

  for (const locale of locales) {
    const localeStories = stories.filter(story =>
      story.full_slug.startsWith(`${locale}/`)
    )

    for (const story of localeStories) {
      const slugWithoutLocale = story.full_slug.replace(`${locale}/`, '')
      const slugSegments = slugWithoutLocale.split('/')

      params.push({
        locale,
        slug: slugSegments,
      })
    }
  }

  return params
}
```

## File Structure

### Pages with Static Generation

#### 1. `app/[locale]/[[...slug]]/(with-layout)/page.tsx`

Main pages with header/footer layout.

**Generates paths like:**
- `/en` (homepage)
- `/en/about`
- `/en/products/product-1`
- `/it/chi-siamo`
- `/de/uber-uns`

```typescript
export async function generateStaticParams() {
  const locales = await getLangs()
  const stories = await getAllStories()

  // Returns: [
  //   { locale: 'en', slug: undefined },      // /en (homepage)
  //   { locale: 'en', slug: ['about'] },      // /en/about
  //   { locale: 'en', slug: ['products', 'product-1'] }, // /en/products/product-1
  //   { locale: 'it', slug: ['chi-siamo'] },  // /it/chi-siamo
  //   ...
  // ]
}
```

#### 2. `app/[locale]/layout-components/page.tsx`

Layout components page (header/footer preview).

**Generates paths like:**
- `/en/layout-components`
- `/it/layout-components`
- `/de/layout-components`

```typescript
export async function generateStaticParams() {
  const locales = await getLangs()
  
  return locales.map((locale) => ({
    locale,
  }))
}
```

## Functions Reference

### `getAllStories(options?)`

Fetches all stories from Storyblok with automatic pagination.

**Parameters:**
- `version` ('draft' | 'published', optional): Version to fetch. Default: based on environment
- `excludePaths` (string[], optional): Paths to exclude. Default: `['layout-components']`
- `perPage` (number, optional): Stories per page. Default: 100

**Returns:** `Promise<Story[]>` - Array of all stories

**Example:**
```typescript
// Get all stories (respects environment)
const stories = await getAllStories()

// Force published only
const publishedStories = await getAllStories({ version: 'published' })

// Custom exclude paths
const stories = await getAllStories({
  excludePaths: ['layout-components', 'drafts', 'archive']
})
```

**Features:**
- ✅ Automatic pagination (handles large story counts)
- ✅ Environment-aware (draft in dev, published in prod)
- ✅ Filters excluded paths
- ✅ Excludes large fields for faster fetch
- ✅ Cache version (cv) support for optimized CDN caching

## Environment Behavior

### Production Build (`next build`)

```bash
VERCEL_ENV=production npm run build
```

- Fetches **published** stories only
- Generates static HTML for all pages
- Fast page loads (pre-rendered)

### Development (`next dev`)

```bash
npm run dev
```

- Fetches **draft** stories
- `generateStaticParams` called when navigating to route
- See unpublished content

### Preview Deployments (Vercel)

```bash
VERCEL_ENV=preview npm run build
```

- Fetches **draft** stories
- Preview unpublished changes
- Same behavior as development

## Build Output

During build, you'll see:

```
✅ Generated 204 static params for 3 locales

Route (app)                              Size
┌ ○ /[locale]/[[...slug]]               
│ ├ ○ /en                                1.2 kB
│ ├ ○ /en/about                          1.3 kB
│ ├ ○ /en/products/product-1             1.5 kB
│ ├ ○ /it                                1.2 kB
│ └ ...
└ ○ /[locale]/layout-components
  ├ ○ /en/layout-components              0.8 kB
  ├ ○ /it/layout-components              0.8 kB
  └ ○ /de/layout-components              0.8 kB

○ (Static) prerendered as static content
```

## Performance Optimization

### 1. Parallel Fetching

Locales and stories are fetched in parallel:

```typescript
const [locales, stories] = await Promise.all([
  getLangs(),
  getAllStories()
])
```

### 2. Exclude Large Fields

```typescript
const { data } = await storyblokApi.get('cdn/stories', {
  excluding_fields: 'body', // Faster fetch
})
```

### 3. Pagination

Automatically handles projects with 100+ stories:

```typescript
let page = 1
while (hasMore) {
  const { data } = await storyblokApi.get('cdn/stories', {
    per_page: 100,
    page,
  })
  // ...
}
```

## Dynamic Params Configuration

### Allow Dynamic Params (Default)

Pages not in `generateStaticParams` will be rendered on-demand:

```typescript
// No config needed - dynamic by default
```

### Disable Dynamic Params

Only pre-rendered pages are served (404 for others):

```typescript
// app/[locale]/[[...slug]]/(with-layout)/page.tsx
export const dynamicParams = false

export async function generateStaticParams() {
  // Only these paths will be available
}
```

## Incremental Static Regeneration (ISR)

Revalidate pages periodically:

```typescript
// Revalidate every hour
export const revalidate = 3600

export async function generateStaticParams() {
  // ...
}
```

## Troubleshooting

### No pages generated

**Cause:** `getAllStories()` returns empty array

**Check:**
```bash
# Run build and check output
npm run build
```

Look for:
```
✅ Generated 0 static params for 3 locales  # <- Problem!
```

**Solutions:**
1. Verify stories are **published** in Storyblok (production)
2. Check `NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN` is set
3. Verify stories are not all in `layout-components`

### Build is slow

**Cause:** Many stories or API rate limits

**Solutions:**
1. Reduce `perPage` if hitting rate limits
2. Use ISR instead of full SSG
3. Cache API responses during build

### Stories missing from build

**Causes:**
1. Story is in `layout-components` (excluded by default)
2. Story is unpublished (in production builds)
3. Story slug doesn't match expected format

**Debug:**
```typescript
const stories = await getAllStories()
console.log('Stories:', stories.map(s => s.full_slug))
```

### Different behavior in dev vs production

**Expected:** Development uses draft stories, production uses published.

**Verify:**
```typescript
import { getStoryblokVersion } from '@/lib/storyblok-env'

console.log('Version:', getStoryblokVersion())
// Dev: 'draft'
// Prod: 'published'
```

## Best Practices

1. ✅ **Always use `generateStaticParams`** for better performance
2. ✅ **Exclude non-page content** (layout-components, etc.)
3. ✅ **Use ISR for frequently updated content**
4. ✅ **Log build output** to verify all pages are generated
5. ✅ **Test both draft and published** environments
6. ⚠️ **Don't include sensitive content** in static pages
7. ⚠️ **Monitor build times** for large projects

## References

- [Next.js generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Storyblok CDN API](https://www.storyblok.com/docs/api/content-delivery)
- [Next.js ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)

## Summary

✅ **Automatic**: All pages pre-rendered at build time  
✅ **Environment-aware**: Draft in dev, published in prod  
✅ **Locale-aware**: Generates paths for all locales  
✅ **Filtered**: Excludes layout-components automatically  
✅ **Optimized**: Pagination + parallel fetching  
✅ **Type-safe**: Full TypeScript support  

Your entire site is now statically generated! 🚀
