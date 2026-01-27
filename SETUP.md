# Setup Guide

Guida completa per configurare il progetto da zero.

## Prerequisiti

- Node.js 20+
- npm o yarn
- Account Storyblok con uno Space configurato

## 1. Clona e Installa Dipendenze

```bash
git clone <repository-url>
cd newpharm
npm install
```

## 2. Configurazione Variabili d'Ambiente

Crea un file `.env.local` nella root del progetto con le seguenti variabili:

```bash
# Storyblok Configuration
NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN=your_cdn_token_here
NEXT_PUBLIC_STORYBLOK_SPACE_ID=your_space_id_here
STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
```

### Come Ottenere i Token

1. **CDN Token** (`NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN`):
   - Vai su Storyblok → Settings → Access Tokens
   - Copia il **Public Token** (Preview o Public)

2. **Space ID** (`NEXT_PUBLIC_STORYBLOK_SPACE_ID`):
   - Vai su Storyblok → Settings → General
   - Copia lo **Space ID**

3. **Management Token** (`STORYBLOK_MANAGEMENT_TOKEN`):
   - Vai su https://app.storyblok.com/#/me/account
   - Sezione "Personal access tokens"
   - Crea un nuovo token con permessi di lettura
   - Copia il token generato

## 3. Struttura Storyblok

### Setup Locales

1. Crea cartelle root-level in Storyblok per ogni locale:
   - `it/` (Italian) - **Default locale**
   - `en/` (English)
   - `ar/` (Arabic) - **RTL support**

2. Ogni cartella locale deve contenere:
   - Almeno una story pubblicata
   - Le stories del sito

### Setup Layout Components

1. Crea una story chiamata `layout-components` in ogni cartella locale
2. Configura i componenti Header e Footer in questa story
3. Questa story viene usata per header/footer globali

### Setup Datasource per Traduzioni

1. Vai su **Content > Datasources** in Storyblok
2. Crea un datasource chiamato **"labels"**
3. Abilita **"Add dimension for entries"**
4. Aggiungi dimensioni per ogni locale: `it` (default), `en`, `ar` (RTL)
5. Aggiungi entries con:
   - **Name**: Notazione a punti (es: `common.loading`, `nav.home`)
   - **Value**: Testo tradotto
   - **Dimension**: Codice locale (es: `it`, `en`, `ar`)

## 4. Genera TypeScript Types

Genera i types TypeScript dai componenti Storyblok:

```bash
npm run generate:types
```

Questo script:

- Scarica gli schemi dei componenti da Storyblok
- Genera interfacce TypeScript in `types/storyblok.d.ts`
- Aggiorna i types per tutti i componenti

**Importante**: Esegui questo comando ogni volta che modifichi gli schemi dei componenti su Storyblok.

## 5. Avvia il Server di Sviluppo

```bash
npm run dev --experimental-https
```

Il progetto sarà disponibile su `https://localhost:3000` (con HTTPS per il bridge di Storyblok).

## 6. Build per Produzione

```bash
npm run build
npm start
```

## Supporto RTL (Right-to-Left)

Il progetto supporta nativamente le lingue RTL come l'arabo:

- **Automatico**: Il tag `<html>` riceve automaticamente `dir="rtl"` per la lingua `ar`
- **CSS Logical Properties**: Tutti i componenti usano `inset-inline-start/end`, `padding-inline`, `margin-inline` invece di `left/right`
- **Font**: Inter supporta sia Latin che Arabic
- **Componenti**: Header, Footer, Navigation e tutti gli altri componenti sono compatibili RTL

### Lingue Supportate

- **it** (Italian) - Default, LTR
- **en** (English) - LTR
- **ar** (Arabic) - RTL

## Struttura del Progetto

```
newpharm/
├── app/                    # Next.js App Router
│   └── [locale]/          # Route con supporto multi-lingua
├── components/
│   ├── atoms/             # Componenti atomici (Button, Input, etc.)
│   ├── organisms/         # Componenti complessi (Header, Footer, Hero)
│   └── storyblok/         # Wrapper Storyblok (passano solo props)
├── lib/
│   ├── api/               # API functions (Storyblok, datasource, etc.)
│   ├── context/           # React Context providers
│   └── storyblok.tsx      # Storyblok provider e inizializzazione
├── i18n/                  # Configurazione next-intl
├── styles/                # SCSS globali e mixins
├── types/                 # TypeScript types generati
└── docs/                  # Documentazione
```

## Variabili d'Ambiente

### Sviluppo vs Produzione

Il progetto gestisce automaticamente la versione Storyblok in base all'ambiente:

- **Sviluppo** (`npm run dev`): Usa `version=draft` per vedere contenuti non pubblicati
- **Produzione** (`npm run build`): Usa `version=published` per contenuti pubblicati

### Variabili Richieste

| Variabile                            | Descrizione                        | Obbligatoria |
| ------------------------------------ | ---------------------------------- | ------------ |
| `NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN` | CDN Token per fetch contenuti      | ✅ Sì        |
| `NEXT_PUBLIC_STORYBLOK_SPACE_ID`     | ID dello Space Storyblok           | ✅ Sì        |
| `STORYBLOK_MANAGEMENT_TOKEN`         | Token per Management API (locales) | ✅ Sì        |

## Troubleshooting

### "No locales found"

- Verifica che `STORYBLOK_MANAGEMENT_TOKEN` sia configurato
- Controlla che ci siano cartelle root-level in Storyblok
- Assicurati che le cartelle abbiano almeno una story pubblicata

### "Story not found"

- Verifica che la story esista in Storyblok
- Controlla che sia pubblicata (in produzione) o in draft (in sviluppo)
- Verifica che lo slug corrisponda esattamente

### Types non aggiornati

```bash
npm run generate:types
```

### Build fallisce

- Verifica tutte le variabili d'ambiente sono configurate
- Controlla che i componenti Storyblok siano pubblicati
- Verifica la connessione a Storyblok API

## Comandi Disponibili

```bash
# Sviluppo
npm run dev              # Avvia dev server con HTTPS

# Build
npm run build            # Build per produzione
npm start                # Avvia server produzione

# Types
npm run generate:types   # Genera TypeScript types da Storyblok

# Lint
npm run lint             # Esegue ESLint
```

## Documentazione Aggiuntiva

- [Static Generation](./docs/STATIC_GENERATION.md) - Come funziona la generazione statica
- [next-intl Setup](./docs/NEXT_INTL_SETUP.md) - Configurazione internazionalizzazione
- [Datasource API](./docs/DATASOURCE_API.md) - API per traduzioni
- [Languages API](./docs/LANGS_API.md) - Gestione locale
- [Types Generation](./docs/TYPES_GENERATION.md) - Generazione types

## Supporto

Per problemi o domande, consulta la documentazione in `docs/` o apri una issue.
