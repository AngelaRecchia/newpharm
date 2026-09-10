# Generazione Statica (Static Generation / SSR)

Il sito usa il **rendering statico** di Next.js: le pagine pubbliche vengono generate al build usando `version=published` di Storyblok, senza chiamate API lato client in produzione.

## Flusso

```
Build (version=published)  →  HTML statico + ISR
Dev  (version=draft)       →  contenuti non pubblicati visibili, bridge attivo
```

La versione è decisa in `lib/api/storyblok/config.ts` tramite `getStoryblokVersion()`.

## Dettagli chiave

- Le stories vengono risolte lato server e arricchite con `resolved_*` (relations) prima del render.
- Nel live editor Storyblok, `components/StoryblokRenderer.tsx` inietta il bridge e fonde il contenuto live preservando l'enrichment SSR (`preserveSsrEnrichment`).
- I client components (`'use client'`) ricevono i dati già risolti dal server: **non** rifare fetch né reconstruct lato client.