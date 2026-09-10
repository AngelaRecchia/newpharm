# newpharm

Sito basato su **Next.js 15** + **Storyblok** con i18n (it/en/ar, RTL per l'arabo).

> **Per sviluppatori e AI**: leggi [`AGENTS.md`](./AGENTS.md) per architettura, convenzioni e comandi.

## Avvio rapido

```bash
git clone <repository-url>
cd newpharm
npm install
cp .env.example .env.local   # poi compila i token
npm run dev
```

Il server parte su `https://localhost:3000` (HTTPS necessario per il visual editor di Storyblok).

## Variabili d'ambiente

Vedi [`.env.example`](./.env.example) per l'elenco completo. Obbligatorie:

| Variabile | Uso |
| --- | --- |
| `NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN` | CDN Token (Settings → Access Tokens) |
| `NEXT_PUBLIC_STORYBLOK_SPACE_ID` | Space ID (Settings → General) |
| `STORYBLOK_MANAGEMENT_TOKEN` | Management API (locales/types) |

## Comandi utili

```bash
npm run dev              # dev server con HTTPS (fetch locale+filtri automatici)
npm run build            # build produzione (version=published)
npm run generate:types   # rigenera types/storyblok.d.ts dagli schemi
npm run lint             # ESLint
```

## Lingue e RTL

- **it** (default, LTR), **en** (LTR), **ar** (RTL)
- RTL automatico via `dir="rtl"` + CSS logical properties in tutti i componenti

## Struttura

```
app/                      # App Router (route [locale])
components/               # atoms / molecules / organisms / storyblok
lib/                      # logica di dominio e client Storyblok
types/                    # tipi generati
styles/                   # SCSS globali
scripts/                  # script one-shot di sviluppo
storyblok-plugins/        # field plugins standalone
```

## Documentazione

- [AGENTS.md](./AGENTS.md) — guida per sviluppatori e AI (architettura, convenzioni, comandi)
- [Generazione Tipi](./docs/TYPES_GENERATION.md) — `npm run generate:types`
- [Static Generation](./docs/STATIC_GENERATION.md) — SSR e bridge editor
- [next-intl Setup](./docs/NEXT_INTL_SETUP.md) — i18n e datasource labels
- [Datasource API](./docs/DATASOURCE_API.md) — traduzioni e filtri
- [Languages API](./docs/LANGS_API.md) — gestione locale
- [Upload traduzioni datasource](./docs/UPLOAD_DATASOURCE_TRANSLATIONS.md) — aggiungere/aggiornare chiavi nei datasource

## Supporto

Per domande o problemi apri un'issue o consulta `AGENTS.md`.
