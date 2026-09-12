# Datasource API (traduzioni e filtri)

Le traduzioni e i filtri vivono nei **datasource** di Storyblok. La gestione è centralizzata in `lib/api/storyblok/datasource.ts`.

## Funzioni principali

| Funzione | Cosa fa |
| --- | --- |
| `getDatasourceEntries(datasource, dimension?)` | Fetch (paginato) delle entries di un datasource, con cache-busting via `cv` |
| `transformDatasourceToMessages(entries)` | Converte nomi a punti (`common.loading`) in oggetti nidificati |
| `getMessagesFromDatasource(datasource, locale)` | Ritorna i messaggi per un locale (omette la dimension per il default locale) |

## Dataflow

```
npm run dev/build
  └─ i18n/request.ts  → getMessagesFromDatasource("labels", locale)
       └─ getDatasourceEntries → CDN cdn/datasource_entries (version=cv)
```

## Datasource noti

- **`labels`** — traduzioni UI, entries con dimension per locale (`it`/`en`/`ar`), usato da next-intl
- **`filtri`** (o simili) — opzioni filtri prodotto/listing, generati in `data/*-entries.json` da `npm run fetch:filtri`

## Cache e versioning

- Il parametro `cv` (cache version) arriva da `getCacheVersion()` in `lib/api/storyblok/config.ts`
- Entries cache in `data/*-entries.json` (generati da `fetch:*`), usati per build statica

## Note

- Le entries vuote ritornano `{}` senza crash.
- In dev, i datasource richiesti vengono scaricati a ogni `npm run dev`.