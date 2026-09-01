# Target Pests — Storyblok Field Plugin

Field plugin per il content type **product**: selezione infestanti dal catalogo `insect`, filtrati per `visibility` *Infestante prodotto* o *Entrambi*.

## Valore salvato

```json
{
  "items": [
    { "uuid": "story-uuid", "text": "testo opzionale" }
  ]
}
```

## Sviluppo locale

```bash
cd storyblok-plugins/target-pests
cp .env.local.example .env.local
# VITE_STORYBLOK_CDN_TOKEN=<preview-token>
npm install
npm run dev
```

## Test

```bash
npm test
npm run build
```

## Deploy

```bash
node scripts/deploy-target-pests-plugin.mjs
```

Poi in Storyblok: **Settings → Field Plugins → Install → target-pests** sul campo `target_pests` del content type `product` (lo script `update:insect-components` può impostare il campo).
