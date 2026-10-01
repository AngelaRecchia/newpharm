# Target Pests — Storyblok Field Plugin

Field plugin per il content type **product**: selezione target bersaglio per famiglia infestante e, opzionalmente, per specie (`insect`).

## Valore salvato

```json
{
  "items": [
    { "kind": "family", "uuid": "story-uuid-famiglia" },
    { "kind": "insect", "uuid": "story-uuid-infestante" }
  ]
}
```

- `kind: "family"` — target generico sull’intera famiglia (senza specie latina).
- `kind: "insect"` — target su una specie del catalogo infestanti.
- Item legacy `{ "uuid": "..." }` senza `kind` → trattati come `insect`.

## Flusso editor

1. Cerca e seleziona una **famiglia infestante**.
2. Opzionale: aggiungi una o più **specie** filtrate su quella famiglia.
3. Oppure: **Aggiungi tutta la famiglia** senza specie.
4. **Aggiungi famiglia** dalla lista (più famiglie sullo stesso prodotto) oppure **Cambia famiglia** / **Aggiungi un'altra famiglia** dopo aver scelto le specie.

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

Poi in Storyblok: **Settings → Field Plugins → Install → target-pests** sul campo `target_pests` del content type `product`.
