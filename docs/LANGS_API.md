# Languages API (gestione locale)

Le lingue disponibili vengono lette dalle **cartelle root** di Storyblok tramite Management API. Codice in `lib/api/storyblok/languages.ts`.

## Come funziona

1. Query Management API `spaces/{id}/stories` con `folder_only: true`
2. Tiene solo cartelle di **primo livello** (root locale: `full_slug` senza `/` e senza parent)
3. Esclude cartelle da `excludePaths` (default: `layout-components`)
4. In produzione filtra cartelle non pubblicate
5. **Deep check** (CDN): verifica che ogni cartella abbia almeno una story pubblicata (`starts_with: {slug}/`)

## Cache

In **development** il risultato viene salvato in `.cache/storyblok/_langs.json` per non bruciare quota Management API ad ogni reload.

> Elimina `.cache/` (o il file `_langs.json`) per forzare un refresh.

## API

```ts
export async function getLangs(options?: {
  excludePaths?: string[];
  checkForContent?: boolean; // default true
  skipCache?: boolean;       // bypassa la cache fs
}): Promise<string[]>
```

## Dipendenze

- `STORYBLOK_MANAGEMENT_TOKEN` per il client Management
- `NEXT_PUBLIC_STORYBLOK_SPACE_ID` per lo space
- `getStoryblokVersion()` / `getCacheVersion()` in `lib/api/storyblok/config.ts`

## Script correlato

```bash
npm run fetch:locales   # rigenera i18n/locales.json
```