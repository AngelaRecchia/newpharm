# Upload traduzioni nei datasource Storyblok

Guida generica per **aggiungere o aggiornare chiavi di traduzione** (es. `related_products`) nei
datasource Storyblok usati da next-intl. Documenta il processo "giusto" per evitare errori comuni
già incontrati (entry in draft non pubblicate, autenticazione API sbagliata, paginazione mancata).

## Contesto

- Le traduzioni UI vivono nel datasource **`labels`** dello space (`it`/`en`/`ar`)
- next-intl le carica via `i18n/request.ts` → `getMessagesFromDatasource("labels", locale)` → **CDN published**
- Quindi: una chiave per essere visibile a runtime deve essere **creata/aggiornata** e **pubblicata** sul datasource.



## Ciclo di vita corretto

1. **Individua il datasource** e le sue **dimension** (locale)
2. **Cerca** la chiave nel datasource (**paginando**: le entries possono superare le 100)
3. **Crea o aggiorna** la entry con i valori per ogni locale
4. **Pubblica** la entry (`publish: 1`)
5. **Verifica** sul **CDN published** (default + con `dimension=en|ar`)

> Senza il passo 4 la entry resta in **draft**: il CDN published non la serve
> e next-intl logga `[next-intl] MISSING_MESSAGE: <chiave>` — sintomo fuorviante
> visto che la chiave "esiste" ma non è pubblicata.



## Regola d'oro: autenticazione Management API

La Management API di Storyblok (`mapi.storyblok.com/v1/...`) vuole il token **grezzo**:
- ✅ `Authorization: <token>` (header raw, senza "Bearer")
- ❌ `Authorization: Bearer <token>` → 401/404
- ❌ `?token=<token>` in query → 401

Attenzione: alcuni client (es. `storyblok-js-client` con `oauthToken`) possono **fallire silenziosamente**
(stampare "✅" pur non avendo creato nulla) se il token non è autorizzato. **Verifica sempre la risposta reale**.

## Workflow operativo

### 1. Elenco datasource e dimensioni

```powershell
$mt = (Get-Content ".env.local" | Select-String "^STORYBLOK_MANAGEMENT_TOKEN") -replace "^.*= *", ""
$h = @{ Authorization = $mt }
$space = "290143894590522"   # SPACE_ID attivo
Invoke-RestMethod -Uri "https://mapi.storyblok.com/v1/spaces/$space/datasources" -Headers $h
```

Cerca il datasource `labels` e annota `id` (datasource_id) e le dimension (`en`, `ar` con i loro `id`).

### 2. Cercare la chiave (paginata)

```powershell
$labelsDs = "151091165038840"        # datasource_id di labels
$e = Invoke-RestMethod -Uri "https://mapi.storyblok.com/v1/spaces/$space/datasource_entries?datasource_id=$labelsDs&per_page=100&page=1" -Headers $h
$e.datasource_entries | Where-Object { $_.name -eq "<chiave>" }
# se non trovata: ripeti con page=2,3,...
```

### 3. Crea la entry (se assente)

```powershell
$body = '{"datasource_entry":{"datasource_id":151091165038840,"name":"<chiave>","value":"<traduzione default it>"}}'
Invoke-RestMethod -Method Post -Uri "https://mapi.storyblok.com/v1/spaces/$space/datasource_entries" -Headers $h -Body $body -ContentType "application/json"
```

Se risponde `"Name has already been taken"` → la chiave esiste: passa al PUT sull'id esistente.



### 4. Aggiorna (con publish, per tutti i locali)

```powershell
$entryId = "<id_entry_trovata>"              # es. 217416920926901
$dimEn  = 151426310106857                # id dimensione en
$dimAr  = 151426310119146                # id dimensione ar

# Default (it, nello `value`) + publish
$body = '{"datasource_entry":{"id":' +$entryId+ ',"datasource_id":151091165038840,"name":"<chiave>","value":"<it>","publish":1}}'
Invoke-RestMethod -Method Put -Uri "https://mapi.storyblok.com/v1/spaces/$space/datasource_entries/$entryId" -Headers $h -Body $body -ContentType "application/json"

# EN
$bodyEn = '{"datasource_entry":{"id":' +$entryId+ ',"datasource_id":151091165038840,"name":"<chiave>","value":"<en>","dimension_value":"<en>","publish":1},"dimension_id":' +$dimEn+ '}'
Invoke-RestMethod -Method Put -Uri "https://mapi.storyblok.com/v1/spaces/$space/datasource_entries/$entryId" -Headers $h -Body $bodyEn -ContentType "application/json"

# AR
$bodyAr = '{"datasource_entry":{"id":' +$entryId+ ',"datasource_id":151091165038840,"name":"<chiave>","value":"<ar>","dimension_value":"<ar>","publish":1},"dimension_id":' +$dimAr+ '}'
Invoke-RestMethod -Method Put -Uri "https://mapi.storyblok.com/v1/spaces/$space/datasource_entries/$entryId" -Headers $h -Body $bodyAr -ContentType "application/json"
```

### 5. Verifica sul CDN published

```powershell
$token = (Get-Content ".env.local" | Select-String "^NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN") -replace "^.*= *", ""
# default (it)
Invoke-RestMethod -Uri "https://api.storyblok.com/v2/cdn/datasource_entries?datasource=labels&token=$token&version=published&per_page=100&page=1"
# con dimensione
Invoke-RestMethod -Uri "https://api.storyblok.com/v2/cdn/datasource_entries?datasource=labels&token=$token&version=published&per_page=100&page=1&dimension=en"
Invoke-RestMethod -Uri "https://api.storyblok.com/v2/cdn/datasource_entries?datasource=labels&token=$token&version=published&per_page=100&page=1&dimension=ar"
```

Cerca la chiave e verifica `value`/`dimension_value`. Nota: l'output AR può comparire come `????`
nel terminale Windows per l'encoding — controlla la lunghezza (es. `منتجات ذات صلة` = 14 caratteri).



## Errori comuni e cause

| Errore / sintomo | Causa probabile |
| --- | --- |
| `[next-intl] MISSING_MESSAGE: <chiave>` | Entry in **draft** (non pubblicata) o chiave assente dal datasource |
| `401 Unauthorized` su `mapi.storyblok.com` | Token inviato come Bearer o in query — usare header raw |
| `"Name has already been taken"` su POST | La entry esiste già: fare **PUT sull'id esistente**, non POST |
| `422 Attributes are required` su PUT | Mandare almeno `name`/`value` (con `publish:1` per pubblicare) |
| `404` su `api.storyblok.com/v2/spaces/...` | Quelle rotte sono della **CDN**, non della management: usare `mapi.storyblok.com/v1` |

## Note operative

- Il datasource `labels` ha **più di 100 entries**: gli script/query devono **paginare** o la chiave non viene trovata.
- Lo spazio "vecchio" `289806242201975` compare commentato in `.env.local`; quello **attivo** è `290143894590522`. Verifica su quale space stai operando.
- Gli script seed esistenti (`scripts/seed-*.ts`) possono fallire silenziosamente con `oauthToken`: preferisci il workflow PowerShell sopra o verifica sempre la risposta reale.
- Dopo l'upload, riavvia/attendi la cache del dev server: i messaggi vengono caricati a ogni richiesta da next-intl.