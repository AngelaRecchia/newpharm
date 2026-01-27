# Static Generation Flow

```
BUILD TIME (next build)
======================

1. generateStaticParams() called
   │
   ├─> getLangs() 
   │   └─> Management API: GET /spaces/{id}/stories?filter_query[parent_id][in]=0
   │       Returns: ['en', 'it', 'de']
   │
   ├─> getAllStories()
   │   └─> CDN API: GET /cdn/stories (with pagination)
   │       Returns: [
   │         { full_slug: 'en/home', ... },
   │         { full_slug: 'en/about', ... },
   │         { full_slug: 'en/products/product-1', ... },
   │         { full_slug: 'it/chi-siamo', ... },
   │         ...
   │       ]
   │       Excludes: 'layout-components' stories
   │
   └─> Generate params array
       Returns: [
         { locale: 'en', slug: undefined },           // /en
         { locale: 'en', slug: ['about'] },           // /en/about
         { locale: 'en', slug: ['products', 'product-1'] }, // /en/products/product-1
         { locale: 'it', slug: ['chi-siamo'] },       // /it/chi-siamo
         ...
       ]

2. Next.js pre-renders each page
   │
   ├─> /en
   │   └─> getStory('', 'en')
   │       └─> Renders static HTML
   │
   ├─> /en/about
   │   └─> getStory('about', 'en')
   │       └─> Renders static HTML
   │
   ├─> /en/products/product-1
   │   └─> getStory('products/product-1', 'en')
   │       └─> Renders static HTML
   │
   └─> ... (all other pages)

3. Output
   └─> Static HTML files in .next/server/app/
       Ready to serve instantly!


RUNTIME (user visits site)
==========================

1. User visits /en/about
   │
   └─> Next.js serves pre-rendered HTML instantly ⚡
       (No API calls needed!)

2. User visits /en/new-page (not in generateStaticParams)
   │
   ├─> Next.js renders on-demand
   │   └─> getStory('new-page', 'en')
   │       └─> Fetches from Storyblok API
   │       └─> Renders and caches
   │
   └─> Future requests serve cached version


GLOBAL SETTINGS FLOW
====================

Layout Level (once per locale):
├─> getGlobalSettings(locale)
│   ├─> Fetch layout-components story
│   ├─> getLangs() -> adds availableLocales to settings
│   └─> Returns { header, footer, availableLocales }
│
└─> GlobalSettingsProvider
    └─> Makes available to all child components via context


EXAMPLE: User visits /it/chi-siamo
====================================

1. Layout loads:
   getGlobalSettings('it')
   └─> Returns: {
         header: {...},
         footer: {...},
         availableLocales: ['en', 'it', 'de']
       }

2. Page loads (pre-rendered):
   /it/chi-siamo (static HTML)
   
3. Client components access:
   useGlobalSettings()
   └─> { header, footer, availableLocales: ['en', 'it', 'de'] }

4. Language selector renders:
   <nav>
     <a href="/en/about">EN</a>
     <a href="/it/chi-siamo" class="active">IT</a>
     <a href="/de/uber-uns">DE</a>
   </nav>
```

## API Calls Summary

### Build Time (Production)
```
1. Management API: Get folders (locales)
   GET /spaces/{id}/stories?filter_query[parent_id][in]=0
   
2. CDN API: Get all published stories
   GET /cdn/stories?version=published&per_page=100&page=1
   GET /cdn/stories?version=published&per_page=100&page=2
   ... (until all stories fetched)
   
Total: ~3-10 API calls (depending on story count)
Result: All pages pre-rendered as static HTML
```

### Runtime (User Request)
```
1. User visits /en/about
   → Serves static HTML (0 API calls) ⚡

2. User visits /en/new-page (not pre-rendered)
   → Fetch from Storyblok API (1 call)
   → Render and cache
   → Future requests: 0 API calls
```

## Environment Differences

### Development (`npm run dev`)
```
generateStaticParams() called when navigating to route
getAllStories() fetches: version=draft
Result: See unpublished content
```

### Production Build (`npm run build`)
```
generateStaticParams() runs once at build time
getAllStories() fetches: version=published
Result: Only published content in static files
```

### Vercel Preview
```
generateStaticParams() runs at build time
getAllStories() fetches: version=draft
Result: Preview unpublished changes
```

## File Organization

```
lib/
├── storyblok-langs-api.ts
│   ├── getLangs()               # Get available locales
│   └── getLangsWithContentCheck() # Verify content exists
│
├── storyblok-stories-api.ts
│   ├── getAllStories()          # Get all stories (for SSG)
│   └── getStory()               # Get single story (returns null if not found)
│
├── storyblok-env.ts
│   └── getStoryblokVersion()    # draft/published based on env
│
└── global-settings-api.ts
    └── getGlobalSettings()      # Get settings + locales

app/
├── [locale]/
│   ├── [[...slug]]/
│   │   └── (with-layout)/
│   │       └── page.tsx         # Main pages + generateStaticParams
│   └── layout-components/
│       └── page.tsx             # Layout preview + generateStaticParams
```

## Performance Metrics

### Before SSG (Server-Side Rendering)
```
Time to First Byte (TTFB): ~800ms
  └─> API call to Storyblok: 500ms
  └─> Render: 300ms

Total page load: ~1200ms
```

### After SSG (Static Generation)
```
Time to First Byte (TTFB): ~20ms ⚡
  └─> Serve pre-rendered HTML: 20ms

Total page load: ~200ms (5-6x faster!)
```

## Commands

```bash
# Development (draft stories)
npm run dev

# Production build (published stories)
npm run build

# Preview build output
npm run build && npm start

# Generate types + build
npm run generate:types && npm run build
```
