# next-intl Setup e i18n

## Lingue supportate

- `it` — default, LTR
- `en` — LTR
- `ar` — RTL (direzione automatica via `dir="rtl"`)

## Architettura

- `i18n/request.ts` — configurazione per-request (`getRequestConfig`): legge il locale dal segmento `[locale]`, carica i messaggi dallo **Storyblok datasource** `labels` e imposta direzione/fuso orario.
- `i18n/routing.ts` — `defineRouting` basato su `i18n/locales.json`. **Attenzione**: importato dalla middleware (Edge Runtime), non importare moduli con API Node (fs, path).

## Messaggi da Storyblok Datasource

Le traduzioni NON sono file `.json` locali ma vivono nel datasource **`labels`** di Storyblok, con dimensioni per locale. Vengono caricate da `lib/api/storyblok/datasource.ts`:

```ts
await getMessagesFromDatasource("labels", locale)
```

- Nomi in **notazione a punti** (`common.loading`, `nav.home`) → trasformati in oggetti nidificati
- La dimensione viene omessa per il default locale (IT), altrimenti si passa il codice locale
- Messaggi mancanti: il `getMessageFallback` logga e ritorna la chiave stessa invece di crashare

## `i18n/locales.json` (generato)

Contiene `locales` e `defaultLocale`. Rigenerabile con:

```bash
npm run fetch:locales
```

(eseguito automaticamente da `npm run dev` / `npm run build` via `fetch:storyblok`).

## Regole

- Usa la chiave del datasource, non stringhe hardcoded per testo visibile
- RTL: usa CSS logical properties in tutti i componenti
- Non importare `routing.ts` da codice server che usa API Node