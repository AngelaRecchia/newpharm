# Generazione Tipi Storyblok

Gli schemi dei componenti Storyblok vengono scaricati e convertiti in interfacce TypeScript in `types/storyblok.d.ts`.

## Comando

```bash
npm run generate:types
```

## Quando eseguirlo

- Dopo ogni modifica agli schemi dei componenti su Storyblok
- Dopo aver aggiunto/rinominato componenti nel visual editor
- Ogni volta che `types/storyblok.d.ts` risulta fuori sincrono con i blok

## Come funziona

1. `scripts/generate-storyblok-types.ts` interroga la **Management API** (serve `STORYBLOK_MANAGEMENT_TOKEN`)
2. Prende gli schemi JSON dei componenti
3. Genera interfacce tipizzate con suffisso `Storyblok` (es. `PageStoryblok`)
4. Sovrascrive `types/storyblok.d.ts`

## Regole

- **Non editare mai `types/storyblok.d.ts` a mano**: verrà sovrascritto alla prossima generazione.
- I componenti usano il campo `component` dello schema per mapparsi su `components/storyblok/*`.