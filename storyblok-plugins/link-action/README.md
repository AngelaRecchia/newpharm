# link-action (Storyblok field plugin)

Campo `action` del blok **link**: sceglie se il bottone è un link, copia il link della pagina o apre un popup.

## Valore salvato

```json
{
  "type": "link",
  "popup": null
}
```

- `type`: `link` | `copy` | `popup`
- `popup`: `contattaci` | `job` | `corso` (solo se `type` è `popup`)

## Sviluppo locale

```bash
cd storyblok-plugins/link-action
npm install
npm run dev
```

## Deploy

```bash
node scripts/deploy-link-action-plugin.mjs
```

Poi in Storyblok: **Settings → Field Plugins → Install → link-action** sul campo `action` del componente `link`.
