# Storyblok Datasource API

Utilities for fetching and transforming Storyblok datasource entries, primarily used for i18n translations.

## Overview

The datasource API provides a way to fetch translation strings from Storyblok datasources instead of static JSON files. This allows content editors to manage translations directly in Storyblok.

## API Functions

### `getDatasourceEntries(datasource, dimension?)`

Fetches all entries from a Storyblok datasource with pagination support.

**Parameters:**

- `datasource` (string): The datasource slug (e.g., 'translations', 'labels')
- `dimension` (string, optional): Dimension filter (e.g., locale: 'en', 'it')

**Returns:** `Promise<DatasourceEntry[]>`

**Example:**

```typescript
// Get all translations for Italian
const entries = await getDatasourceEntries("translations", "it");

// Get all entries without filtering
const entries = await getDatasourceEntries("translations");
```

### `transformDatasourceToMessages(entries)`

Transforms flat datasource entries into a nested messages object for next-intl.

Converts entries with dot-notation names (e.g., "common.loading", "nav.home") into nested structure.

**Parameters:**

- `entries` (DatasourceEntry[]): Array of datasource entries

**Returns:** `Record<string, any>`

**Example:**

```typescript
const entries = [
  { name: "common.loading", value: "Caricamento..." },
  { name: "nav.home", value: "Home" },
];
const messages = transformDatasourceToMessages(entries);
// Result: { common: { loading: 'Caricamento...' }, nav: { home: 'Home' } }
```

### `getMessagesFromDatasource(datasource, locale)`

Combines fetching and transforming in one call. Gets translation messages ready for next-intl.

**Parameters:**

- `datasource` (string): The datasource slug (default: 'labels')
- `locale` (string): The locale dimension (e.g., 'it', 'en')

**Returns:** `Promise<Record<string, any>>`

**Example:**

```typescript
const messages = await getMessagesFromDatasource("labels", "it");
// Returns: { common: { loading: 'Caricamento...' }, ... }
```

## Storyblok Setup

### 1. Create Datasource

1. Go to **Content > Datasources** in Storyblok
2. Click **Add datasource**
3. Name it **"labels"** (or "translations" if you prefer)
4. Enable **"Add dimension for entries"**
5. Save

### 2. Configure Dimensions

Add dimension values for each locale:

- `it` (Italian)
- `en` (English)
- `de` (German)
- etc.

### 3. Add Entries

Add translation entries with:

- **Name**: Dot-notation key (e.g., `common.loading`)
- **Value**: Translated text (e.g., `Caricamento...`)
- **Dimension**: Locale code (e.g., `it`)

**Example Entries:**

| Name               | Value                            | Dimension |
| ------------------ | -------------------------------- | --------- |
| `common.loading`   | Caricamento...                   | it        |
| `common.loading`   | Loading...                       | en        |
| `common.error`     | Si è verificato un errore        | it        |
| `common.error`     | An error occurred                | en        |
| `nav.home`         | Home                             | it        |
| `nav.home`         | Home                             | en        |
| `footer.copyright` | © 2024 Tutti i diritti riservati | it        |
| `footer.copyright` | © 2024 All rights reserved       | en        |

## Naming Convention

Use dot notation to create nested structure:

```
common.loading          → { common: { loading: "..." } }
common.error            → { common: { error: "..." } }
nav.home                → { nav: { home: "..." } }
nav.about               → { nav: { about: "..." } }
footer.copyright        → { footer: { copyright: "..." } }
button.submit           → { button: { submit: "..." } }
button.cancel           → { button: { cancel: "..." } }
```

### Recommended Structure

```
common.*         - Generic UI strings (loading, error, success, etc.)
nav.*            - Navigation items
footer.*         - Footer content
button.*         - Button labels
form.*           - Form labels and validation
error.*          - Error messages
validation.*     - Validation messages
```

## Integration with next-intl

The datasource API is integrated with next-intl in `i18n/request.ts`:

```typescript
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // Validate locale
  if (!locale || !hasLocale([routing.defaultLocale], locale)) {
    locale = routing.defaultLocale;
  }

  // Fetch messages from Storyblok datasource
  const messages = await getMessagesFromDatasource("labels", locale);

  return {
    locale,
    messages,
    timeZone: "Europe/Rome",
    now: new Date(),
  };
});
```

## Performance

- **Pagination**: Automatically fetches all pages (100 entries per page)
- **Cache version (cv)**: Uses Storyblok cache version parameter for optimized CDN caching
- **Build time**: Datasources are fetched at build time for static generation

## Error Handling

The API handles errors gracefully:

- Returns empty array if datasource not found
- Logs warnings for missing dimensions
- Continues with empty messages object on error

## Migration from JSON Files

If you're migrating from local JSON files:

1. Export your JSON structure
2. Flatten it to dot notation
3. Create datasource entries
4. Test in draft mode
5. Remove local JSON files

**Example migration script:**

```typescript
const messages = require("./messages/it.json");

function flattenObject(obj: any, prefix = ""): Record<string, string> {
  return Object.keys(obj).reduce(
    (acc, key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        Object.assign(acc, flattenObject(value, newKey));
      } else {
        acc[newKey] = value;
      }

      return acc;
    },
    {} as Record<string, string>
  );
}

const flatMessages = flattenObject(messages);
console.log(JSON.stringify(flatMessages, null, 2));
```

## Related Documentation

- [next-intl Setup](./NEXT_INTL_SETUP.md)
- [Locales API](./LANGS_API.md)
- [Storyblok API Reference](https://www.storyblok.com/docs/api/content-delivery)
