# Scripts di Sincronizzazione

Script per sincronizzare componenti Pixso con Storyblok.

## Setup

1. Ottieni il **Management Token** da Storyblok:
   - Vai su https://app.storyblok.com/#/me/account
   - Crea un nuovo token con permessi di scrittura
   - Aggiungilo al file `.env.local`:
     ```
     STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
     ```

## Uso

### Sincronizzare tutti i componenti

```bash
npm run sync:pixso
```

Questo script:
- Recupera i componenti esistenti da Storyblok
- Crea o aggiorna i componenti mappati da Pixso
- Mostra un riepilogo delle operazioni

### Lista componenti disponibili

```bash
npm run sync:components -- --list
```

### Sincronizzare un componente specifico

```bash
npm run sync:components -- --component Hero
```

## Componenti Mappati

I seguenti componenti Pixso sono mappati a Storyblok:

- **Header** → `header`
- **Footer** → `footer`
- **Hero** → `hero`
- **Card** → `card`
- **Button** → `button`
- **Grid** → `grid`

## Aggiungere Nuovi Componenti

Per aggiungere nuovi componenti:

1. Modifica `scripts/sync-pixso-storyblok.ts`
2. Aggiungi il mapping in `componentMapping`
3. Definisci lo schema Storyblok per il componente
4. Esegui `npm run sync:pixso`

## Schema Componenti

Ogni componente Storyblok ha uno schema che definisce:
- **Campi**: Proprietà del componente
- **Tipi**: text, textarea, asset, link, option, number, bloks
- **Validazione**: required, min, max, options
- **Relazioni**: component_whitelist per bloks

Esempio schema Hero:
```typescript
{
  title: { type: 'text', required: true },
  subtitle: { type: 'textarea' },
  cta_text: { type: 'text' },
  cta_link: { type: 'link' },
  background_image: { type: 'asset', filetypes: ['images'] }
}
```

## Note

- Il Management Token è diverso dal Preview/Public Token
- I componenti vengono creati nello spazio Storyblok configurato
- I componenti esistenti vengono aggiornati, non sovrascritti completamente
- Mantieni sempre un backup prima di sincronizzare in produzione
