# Generazione TypeScript Types da Storyblok

Questo progetto usa la generazione automatica di TypeScript types dagli schemi dei componenti Storyblok.

## Workflow

### 1. Crea/Modifica Componenti su Storyblok

1. Vai su Storyblok → Components
2. Crea o modifica i componenti (Header, Footer, Page, ecc.)
3. Definisci i campi (schema) per ogni componente

### 2. Genera i Types

Esegui lo script per generare i types TypeScript:

```bash
npm run generate:types
```

Questo script:
- Scarica gli schemi dei componenti da Storyblok (Management API)
- Genera interfacce TypeScript per ogni componente
- Salva i types in `types/storyblok.d.ts`

### 3. Usa i Types nei Componenti

Importa i types generati nei tuoi componenti:

```typescript
import { HeaderStoryblok } from '@/types/storyblok'

export default function Header({ blok }: { blok?: HeaderStoryblok }) {
  // blok è ora tipizzato!
  return <header>{blok?.text}</header>
}
```

## Setup

### Prerequisiti

1. **Management Token**: Ottieni il token da https://app.storyblok.com/#/me/account
2. Aggiungi al file `.env.local`:
   ```
   STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
   ```

### Script Disponibili

- `npm run generate:types` - Genera i types da Storyblok

## Struttura Types Generati

I types vengono salvati in `types/storyblok.d.ts` con questa struttura:

```typescript
export interface HeaderStoryblok {
  text?: string | null
  _uid: string
  component: string
  _editable?: string
}

export type StoryblokComponent = HeaderStoryblok | FooterStoryblok | ...
```

## Best Practices

1. **Rigenera dopo modifiche**: Ogni volta che modifichi uno schema su Storyblok, rigenera i types
2. **Non modificare manualmente**: Il file `types/storyblok.d.ts` è generato automaticamente - non modificarlo manualmente
3. **Usa i types**: Importa e usa i types generati invece di usare `any`
4. **CI/CD**: Considera di aggiungere la generazione dei types nel processo di build

## Esempio Completo

```typescript
// components/storyblok/Header.tsx
import { HeaderStoryblok } from '@/types/storyblok'

export default function Header({ blok }: { blok?: HeaderStoryblok }) {
  if (!blok) return null
  
  // TypeScript sa che blok.text esiste ed è string | null
  return <header>{blok.text}</header>
}
```

## Troubleshooting

### Types non aggiornati
- Rigenera i types: `npm run generate:types`
- Verifica che i componenti siano pubblicati su Storyblok

### Management Token non funziona
- Verifica che il token abbia i permessi corretti
- Controlla che sia nel file `.env.local`

### Types mancanti
- Verifica che i componenti esistano su Storyblok
- Controlla che lo Space ID sia corretto
