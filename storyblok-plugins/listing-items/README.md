# listing-items (Storyblok field plugin)

Plugin per il blok **listing** (hub / highlight) soltanto.

Il blok **Products** ha solo titolo, sottotitolo e anchor ID — **non** usa questo plugin: tutti i prodotti vengono fetchati SSR.

## Listing Hub / Highlight — prodotto

- **Titolo e sottotitolo** nel blok listing (nessun filtri sticky)
- **Dinamica**: checkbox Bestseller + vista opzionale (Categoria + sottocategoria, Application area)
- **Manuale**: ricerca e toggle prodotti

## Catalogo / Progetto / Insetto

- **Tutti** (default): tutti selezionati, clic per escludere
- **Manuale**: solo gli UUID scelti

## Deploy

```bash
node scripts/deploy-listing-items-plugin.mjs
```
