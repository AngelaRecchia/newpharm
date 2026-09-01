# listing-items (Storyblok field plugin)

Plugin per il campo `variant` dei blok **listing** e **carousel**. L’UI dipende dal componente padre.

## Listing

### Editorial

- Select **Formato immagine**: Rettangolare (`portrait`, 259/340) o Quadrata (`square`, 1:1)
- Le card sono `card_listing_editorial` (campo `cards` del blok)

### Hub / Highlight

- Variante: prodotto, catalogo, progetto
- Prodotto dinamica: bestseller + vista opzionale (categoria / application area)
- Prodotto manuale / altre varianti: ricerca e toggle stories
- **Progetto per tag**: filtra per divisione, ordinato per ultimi aggiunti

## Projects Highlight

- Nessuna card editoriale
- **Tutti**: tutti i progetti, ultimi aggiunti
- **Per tag**: progetti della divisione scelta, ultimi aggiunti
- **Manuale**: progetti referenziati, comunque ordinati per ultimi aggiunti

Sul campo plugin, opzione `context` = `projects_highlight` (fallback se il parent non viene rilevato).

## Carousel

- Variante: story, prodotto, editorial, insetto
- **Story automatica**: ultime 8 news
- **Story per tag**: ultime 8 news con il tag selezionato
- **Story manuale**: fino a 8 story scelte in CMS (ordine di selezione)
- **Prodotto**: ultimi 8 prodotti, con filtri opzionali bestseller / categoria / application area
- **Insetto**: stessa selezione del listing — tutti (deseleziona da escludere) o solo selezionati manualmente
- **Editorial**: card nested nel campo `cards` del blok

Sul campo plugin del blok carousel, opzione `context` = `carousel` (fallback se il parent non viene rilevato).

Il blok **Products** non usa questo plugin.

## Deploy

```bash
node scripts/deploy-listing-items-plugin.mjs
```
