# AGENTS.md

Guida per agenti AI e sviluppatori. Leggi questo file prima di modificare codice.

## Stack

- **Next.js 15** (App Router, `app/`), React 18, TypeScript strict
- **Storyblok** come CMS headless (`@storyblok/react`, `storyblok-js-client`)
- **next-intl** per i18n (3 lingue, RTL per l'arabo)
- **Tailwind CSS 4** + **SCSS modules** (`*.module.scss`)
- **GSAP / Motion** per animazioni
- **Swiper** per carousel

## Struttura (sintesi)

```
app/[locale]/[[...slug]]/   # route pubblicate, con layout
app/api/                    # route API (webhook Storyblok, reCAPTCHA)
components/
  atoms/                    # componenti semplici (Button, Icon, TextField…)
  molecules/                # composizioni medie (Card*, Modal, Select…)
  organisms/                # sezioni complesse (Header, Hero, Products…)
  storyblok/                # wrapper che passano SOLO props ai blok
lib/                        # logica di dominio (listing, products, storyblok API)
types/storyblok.d.ts        # tipi GENERATI dagli schemi Storyblok (non editare)
styles/                     # SCSS globali: _variables, _mixins, _utilities
i18n/                       # config next-intl
scripts/                    # script one-shot di sviluppo (non runtime)
storyblok-plugins/          # field plugins standalone (esclusi dal build TS)
```

## Convenzioni

### Componenti (atomic design)

- Ogni componente vive in `components/<livello>/<Nome>/index.tsx` + `index.module.scss`
- Nome in **PascalCase**, cartella con lo stesso nome
- Componenti Storyblok: mappa il nome blok → componente in `components/StoryblokRenderer.tsx`
- `components/storyblok/*/index.tsx`: wrapper "stupidi" — passano solo `blok`, niente logica di business
- Client components: usano `'use client'`; i dati SSR arrivano via `resolved_*`

### Import

- **Alias `@/` → root del progetto** (vedi `tsconfig.json` paths). Usa `@/components/...`, `@/lib/...`, MAI path relativi lunghi.

### Stile

- Componenti con `*.module.scss` → import `import styles from './index.module.scss'`
- Preferisci CSS logical properties (`inset-inline-start`, `padding-inline`) per supporto RTL (locale `ar`)

### Storyblok

- Tipi in `types/storyblok.d.ts` sono **generati**: non modificarli a mano, esegui `npm run generate:types`
- Dopo ogni modifica agli schemi Storyblok: `npm run generate:types`
- Le resoluzioni (`resolve_relations`) sono centralizzate in `lib/api/storyblok/resolveRelations.ts`
- Il rendering SSR arricchisce i blok con `resolved_items` ecc. — non ricostruirli lato client

## Comandi

```bash
npm run dev                    # dev server HTTPS (esegue fetch:storyblok prima)
npm run build                  # build produzione
npm run lint                   # ESLint
npm run generate:types         # rigenera types/storyblok.d.ts
npm run fetch:locales          # aggiorna locale da management API
npm run fetch:filtri           # aggiorna datasource filtri
```

## Variabili d'ambiente (vedi `.env.example`)

| Variabile | Uso |
| --- | --- |
| `NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN` | CDN (read) — obbligatoria |
| `NEXT_PUBLIC_STORYBLOK_SPACE_ID` | Space ID — obbligatoria |
| `STORYBLOK_MANAGEMENT_TOKEN` | Management API (locales/types) — obbligatoria |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | reCAPTCHA v2 (download cataloghi) |

In dev si usa `version=draft`; in build `version=published` (`lib/api/storyblok/config.ts`).

## Da NON modificare senza motivo

- `types/storyblok.d.ts` (generato)
- `.next/`, `.cache/`, output di `scripts/*.js` (artefatti)
- `data/*-entries.json` (cache generata da `fetch:*`)

## Note operative

- Il dev server parte con HTTPS per il bridge Storyblok (`--experimental-https`)
- Prima di modificare un componente verificare se esiste già una versione in `molecules/` o `atoms/` riutilizzabile
- I membri non usati o i commenti speculativi vanno evitati: codice pulito = contesto AI più efficiente

## Chiamate API in sviluppo (quota Storyblok)

In draft **la cache filesystem sulle stories resta disattivata** (`lib/api/storyblok/client.ts`, serve al Visual Editor). In RAM invece:

- `React.cache()` coalesca `getStory` / `getGlobalSettings` **nella stessa request** (layout + page + metadata).
- `remember()` tiene il risultato **20s in draft** (illimitato in `published`, come prima). Refresh/HMR ravvicinati non rifanno le GET. Il Visual Editor svuota la RAM via `POST /api/cache/invalidate`; i webhook Storyblok fanno lo stesso.

Una sola navigazione può comunque fare molte GET al primo load: listing/carousel, e sulle pagine prodotto tutti i prodotti, progetti/news correlati, compare.

### Comportamento obbligatorio per gli agenti

Questa sezione **prevale** sulla verifica browser automatica post-edit.

- **Non** aprire, navigare o ricaricare il browser dopo un edit (componente, SCSS, layout) se non esplicitamente richiesto.
- Dopo un cambio UI **chiedere sempre**: «Vuoi che verifichi il componente nel browser?» — procedere solo con un sì.
- **Non** fare round di verifica “di sicurezza” su più route, locale o viewport.
- **Non** lanciare `fetch:storyblok`, `generate:types`, `configure:*`, script Management API o `index:search` se non chiesti.
- Preferire lint, typecheck e il codice già in editor. Se la verifica è confermata: **una sola pagina**, una sola volta.

### Ottimizzazioni

1. **`React.cache()` su `getStory` / `getGlobalSettings`** — fatto. Nella stessa request layout, page e metadata condividono la story.
2. **Cache in-memory in draft, TTL 20s** — fatto. `storyCache` / `allStoriesCache` / `storiesByComponentCache` e gli indici related. Invalidata da Visual Editor e webhook.
3. **Cache filesystem sulle stories in draft, con TTL** — oggi è disabilitata per il Visual Editor. Si può abilitare con TTL e bypass se c’è `_storyblok` in query (iframe editor).
4. **Alzare il TTL di `cv` in draft** — `cdn/spaces/me` ogni 5s (`CV_CACHE_TTL_DRAFT`). 30–60s basterebbe in locale.
5. **Pagine prodotto più pigre** — `resolveProductStories`, compare, related news/projects e target pests partono tutti insieme; si possono deferire o spezzare.
6. **`generateStaticParams` / `getAllStories` in draft** — skip se `NEXT_PUBLIC_STORYBLOK_VERSION !== published` (`shouldPrebuildStoryPaths()`); route on-demand + `noStore()` in page/metadata (segment config resta statico per Next).
7. **`excluding_fields` su `getStoriesByComponent`** — mappa in `lib/api/storyblok/componentExcludingFields.ts` (listing/compare; non il dettaglio prodotto via `getStory`).
8. **`getGlobalSettings`**: locale switcher da `i18n/locales.json` (allineato a middleware), non `getLangs()` a runtime.

Non applicare i punti 3–5 in un task di UI se non richiesti: sono debito di cache, non di componente.
