# listing-items (Storyblok field plugin)

Field plugin per il blok `listing` (type hub/highlight): selezione variante content type e multi-select story filtrate.

## Sviluppo

```bash
cd storyblok-plugins/listing-items
npm install
npm run dev
```

## Deploy

Richiede `STORYBLOK_PERSONAL_ACCESS_TOKEN` in `.env.local` (account PAT, non token space).

```bash
node scripts/deploy-listing-items-plugin.mjs
```

Poi in Storyblok: **Settings → Field Plugins → Install → listing-items** (se non già installato sul campo `variant` del blok `listing`).
