# Product Filtri — Storyblok Field Plugin

Field plugin per il content type **product**: categoria (single select) + sottofiltri (multi select filtrati per categoria), datasource `filtri`.

## Valore salvato

```json
{
  "category": "category__insetticidi-e-acaricidi",
  "subcategories": ["pest__formica", "pest__zanzare"]
}
```

## Sviluppo locale

```bash
cd storyblok-plugins/product-filtri
cp .env.local.example .env.local
# Opzionale: VITE_STORYBLOK_CDN_TOKEN=<preview-token> per fetch live da Storyblok
npm install
npm run dev
```

Apri la sandbox indicata dal CLI. Senza token usa i dati bundled in `src/data/filtri-entries.json`.

## Test

```bash
npm test
npm run build
```

## Deploy su Storyblok

Richiede un **Personal Access Token account** da [My account → Personal access token](https://app.storyblok.com/#/me/account).

> `STORYBLOK_MANAGEMENT_TOKEN` nello space API **non** funziona per `/v1/field_types` (errore 403).
> Se il token in `.env.local` è quello space, crea un PAT account dedicato.

```bash
# Dalla root del repo
node scripts/deploy-product-filtri-plugin.mjs

# Oppure manualmente
cd storyblok-plugins/product-filtri
STORYBLOK_PERSONAL_ACCESS_TOKEN=<pat-account> npm run deploy -- --name product-filtri --skipPrompts --scope my-plugins
```

Poi in Storyblok: **Settings → Field Plugins → Install → product-filtri** sul campo `product_filtri` del content type `product`.

## Options del plugin

| Option | Descrizione | Default |
|--------|-------------|---------|
| `datasource_slug` | Slug datasource Storyblok | `filtri` |
| `cdn_token` | Preview/public CDN token | (vuoto → bundled data) |

## Aggiornare la tassonomia

La datasource `filtri` in Storyblok è la source of truth.

- **Editor (plugin):** legge live la datasource se `cdn_token` è configurato nelle options
- **Frontend Next.js:** a ogni `npm run dev` / `npm run build` esegue `fetch:filtri` e rigenera `data/filtri-entries.json`

Per aggiornare manualmente:

```bash
npm run fetch:filtri
```

Le copie bundled nei plugin (`src/data/filtri-entries.json`) restano solo fallback per dev locale senza token CDN.

## Frontend Next.js

Leggere `blok.product_filtri`:

```typescript
const { category, subcategories } = blok.product_filtri ?? {}
// category: "category__insetticidi-e-acaricidi"
// subcategories: ["pest__formica", ...]
```
