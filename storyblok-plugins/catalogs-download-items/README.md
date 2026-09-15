# catalogs-download-items

Field plugin per `catalogs_download.items`. Consente di selezionare e ordinare soltanto:

- story di tipo `catalog` con un file PDF;
- story di tipo `downloadable` con `kind: catalog` o `kind: brochure` e un file PDF.

Il plugin richiede l'opzione `cdn_token`, configurata con il token pubblico CDN dello space.
Le referenze gia presenti nel campo non vengono mai eliminate automaticamente: quando una
referenza non e verificabile nella lingua corrente, viene evidenziata e resta disponibile
per essere mantenuta o rimossa manualmente.

## Build e deploy

```bash
node scripts/deploy-catalogs-download-items-plugin.mjs
node scripts/configure-catalogs-download-items-field.mjs
```

Il secondo comando associa il plugin al campo `items` del componente `catalogs_download`
e configura `cdn_token`. Il valore salvato resta un array di UUID compatibile con il
precedente campo di riferimenti.
