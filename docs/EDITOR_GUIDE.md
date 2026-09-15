# Guida Editor Newpharm — Storyblok & Creazione Contenuti

> **Versione**: 2.0 · **Data**: 9 settembre 2026 · **Autore**: Newpharm Digital

Benvenuto/a! Questa guida ti spiega, senza tecnicismi, come gestire i contenuti del sito
Newpharm su **Storyblok**: come si compilano i moduli, quando usarne uno piuttosto che
un altro, come si curano le traduzioni e come si pubblica.

La guida è pensata per chi lavora sui contenuti (testi, immagini, link), non per chi
sviluppa il sito. Se trovi un riferimento a "team tecnico", significa che quel passaggio
richiede un intervento che non puoi fare dal pannello contenuti.

---

## Sommario

1. [Come funziona il sito (in breve)](#1-come-funziona-il-sito-in-breve)
2. [Struttura dei contenuti](#2-struttura-dei-contenuti)
3. [I blocchi (moduli) del sito](#3-i-blocchi-moduli-del-sito)
   - [Eroi](#31-eroi)
   - [Banner e richieste d'azione (CTA)](#32-banner-e-richieste-dazione-cta)
   - [Listing e griglie](#33-listing-e-griglie)
   - [Card](#34-card)
   - [Sezioni di contenuto](#35-sezioni-di-contenuto)
   - [Elementi di pagina globali](#36-elementi-di-pagina-globali)
4. [Le schede prodotto e il template PDF](#4-le-schede-prodotto-e-il-template-pdf)
5. [Regole editoriali](#5-regole-editoriali)
6. [Creare, modificare e pubblicare](#6-creare-modificare-e-pubblicare)
7. [Contribuzione di team](#7-contribuzione-di-team)
8. [Le lingue del sito (locales)](#8-le-lingue-del-sito-locales)
9. [Le traduzioni](#9-le-traduzioni)
10. [I filtri dei listing](#10-i-filtri-dei-listing)
11. [Domande frequenti](#11-domande-frequenti)
12. [Glossario](#12-glossario)

---

## 1. Come funziona il sito (in breve)

I contenuti del sito (testi, immagini, link) vivono in **Storyblok**. Quando un contenuto
viene **pubblicato**, il sito si aggiorna da solo: non serve avvisare nessuno né fare
"deploy".

### Bozza o pubblicato?

| Stato | Cosa succede |
| --- | --- |
| **Bozza (draft)** | Visibile solo a chi lavora nell'editor. Non esiste sul sito pubblico. |
| **Pubblicato (published)** | Visibile a tutti sul sito. |

> **Regola d'oro**: sul sito pubblico conta **solo** ciò che è *pubblicato*.
> Un contenuto salvato ma non pubblicato **non esiste** per i visitatori.

Quando pubblichi un contenuto, il sito viene ricontrollato e aggiornato automaticamente
(si chiama *revalidation*). Vale anche per traduzioni e filtri: una volta pubblicati,
si aggiornano da soli.

### Dove lavori

- URL editor: `https://app.storyblok.com`
- Le **pagine** si costruiscono impilando **blocchi** (o *moduli*): ogni modulo è un
  componente visivo del sito (un grande titolo d'apertura, una griglia di card, una
  galleria foto, un'area domande/risposte…).

---

## 2. Struttura dei contenuti

### Le lingue sono cartelle

Nello spazio Storyblok i contenuti sono divisi in cartelle per lingua:

```
Root (space)
├── it/            ← italiano (lingua predefinita)
│   ├── home       ← pagina iniziale
│   ├── prodotti   ← elenco prodotti
│   └── ...
├── en/            ← inglese
└── ar/            ← arabo (da destra a sinistra)
```

Ogni lingua ha la **sua** versione di ogni pagina. Non mischiare: nella cartella `it/`
si scrive in italiano, in `en/` in inglese, e così via.

### I tipi di contenuto

Ogni voce in Storyblok ha un "tipo" che decide come viene usata:

| Tipo | A cosa serve | Ha una pagina? |
| --- | --- | --- |
| `page` | Home, chi siamo, contatti e simili | ✅ Sì |
| `product` | Le schede dei prodotti | ✅ Sì |
| `story` | News e articoli con tag | ✅ Sì |
| `job` | Le offerte di lavoro | ✅ Sì |
| `project` | Casi studio / progetti | ✅ Sì |
| `insect` | Schede su scarafaggi, formiche, ecc. | ❌ No (serve per i filtri) |
| `downloadable` | Cataloghi, brochure, schede di sicurezza | ❌ No (appare solo come card) |
| `glossary` | Voci di glossario | ❌ No (usata dal glossario) |

> **Attenzione**: `insect`, `downloadable` e `glossary` **non creano pagine**. Si usano
> solo come ingredienti dentro altre pagine (card, filtri, schede prodotto).

#### `insect` — macro categorie e famiglie

Ogni scheda infestante ha due campi di tassonomia (select in Storyblok):

| Campo | Uso |
| --- | --- |
| **Macro categoria** (`category`) | Filtri della pagina **Guida infestanti** |
| **Famiglia / gruppo** (`famiglia`) | Icona SVG in scheda prodotto (`target_pests`) |

**Macro categorie** (valori ammessi):

- Insetti volanti
- Insetti striscianti
- Infestanti delle derrate
- Rettili e anfibi
- Uccelli
- Roditori
- Infestanti del legno
- Ragni
- Zeche e acari

**Famiglie / gruppi** (valori ammessi):

- Zanzare, Mosche, Vespe, Calabroni, Formiche, Blatte
- Pesciolini d'argento, Termiti, Tarli cerambicidi, Tarli siricidi
- Cimici dei letti, Cimici, Zeche, Pulci, Pidocchi, Acari, Acaro pollino
- Tarme, Coleottero dei tappeti
- Ratto grigio, Ratto nero, Topolino domestico, Piccioni
- Insetti delle derrate

> Dopo aggiornamenti alla lista, in dev eseguire `npm run configure:insect-taxonomy`
> per allineare le opzioni del content type `insect` su Storyblok.
>
> Le icone per famiglia sono in `public/icons/pests/` (slug = valore `famiglia`).
> Per reimportare da asset locali: `npm run import:pest-icons`.

---

## 3. I blocchi (moduli) del sito

I blocchi (in Storyblok si chiamano **blok**, in codice **componenti**) sono i mattoni
con cui costruisci una pagina. Qui sotto trovi il **nome esatto del componente** come
è definito nel codice, con la spiegazione di quando usarlo e come si compila.

> Quando aggiungi un blocco in Storyblok trovi il **nome tecnico del componente**
> (in minuscolo, con trattini bassi, es. `hero`, `box_image`). Usa quei nomi: sono
> gli stessi del design system e della libreria Figma.
> I campi contrassegnati **Obbligatorio** devono essere compilati perché il modulo
> appaia correttamente; quelli **Facoltativo** possono restare vuoti.

### 3.1 Eroi

L'**eroe** è la sezione d'apertura di una pagina: il grande titolo con il testo
sopra la piega. Ce ne sono tre varianti, da usare in base all'importanza e al contesto.

#### `hero`

Il grande banner d'apertura della home e delle pagine principali, con vista desktop e
mobile. Contiene un'immagine o un breve video di sfondo, un titolo e un pulsante.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Media** | Obbligatorio | Un breve video (max 2 MB) oppure un'immagine statica |
| **Titolo** | Obbligatorio | Il titolo principale della sezione |
| **Sottotitolo** | Facoltativo | Una riga sotto il titolo |
| **Pulsante** | Facoltativo | Link a una pagina interna o a un sito esterno |
| **Video controlli** | Facoltativo | Al tocco il video si ferma e l'icona cambia |
| **Overlay** | Obbligatorio | L'ombreggiatura scura in basso (per la leggibilità) |

![Hero Primary](assets/figma/hero-primary.png)

#### HeroTertiary — `hero_tertiary_...` *(componente `HeroTertiary`)*

La variante più compatta: titolo e sottotitolo senza immagine di sfondo. Usala per
aprire sezioni o pagine di approfondimento.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Obbligatorio | Il titolo della sezione |
| **Descrizione** | Facoltativo | Breve testo introduttivo |

> In Figma trovi tre varianti di `hero` (Primary, Secondary, Tertiary): nell'editor
> il componente resta **`hero`**, con i campi che cambiano a seconda della variante
> scelta. `HeroTertiary` ha anche una voce separata per le aperture compatte.

### 3.2 Banner e richieste d'azione (CTA)

Sezioni pensate per spingere il visitatore a fare qualcosa: scaricare, contattare,
esplorare.

#### `full_banner`

Una fascia a tutta larghezza con immagine di sfondo, titolo e pulsante. Usala come
"pausa visiva" o chiusura convincente di una pagina.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Media** | Obbligatorio | Immagine di sfondo a tutta larghezza |
| **Titolo** | Obbligatorio | Frase d'impatto |
| **Pulsante** | Facoltativo | Azione da compiere (es. "Scarica il catalogo") |

#### `split_banner`

Come `full_banner` ma diviso in due: immagine da un lato, testo dall'altro.
Ottimo quando vuoi mostrare sia contenuto che immagine.

#### `banner_accordion`

Un banner con una tendina a fisarmonica. Usalo per presentare una sezione che può
essere espansa, ad esempio un servizio con dettagli a comparsa.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Obbligatorio | Titolo del banner |
| **Pulsante** | Obbligatorio | Apre il pannello con i contenuti |

#### `cta_box`

Un riquadro dedicato alla call-to-action: può contenere più pulsanti e funge da
"invito all'azione" fisso dentro una pagina (es. "Vuoi saperne di più? Scrivici").

#### `box_image` / `box_image_carousel`

Una coppia (o carosello) di testo e immagine. Usala per raccontare un prodotto,
un servizio o un progetto alternando immagine e testo.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Icona** (variante `box_image`) | Facoltativo | Icona decorativa sopra il contenuto |
| **Media** | Obbligatorio | Immagine (o media carosello) |
| **Video controlli** | Facoltativo | Per i media video |

#### `sticky_image`

Immagine che resta "appiccicata" mentre scorri la pagina, con del testo che gli
scorre accanto. Usala per storie o approfondimenti lunghi.

#### `text_reveal`

Testo che appare progressivamente con lo scroll. Usalo per citazioni o messaggi
che vuoi rivelare con effetto.

### 3.3 Listing e griglie

I listing mostrano elenchi di contenuti (prodotti, progetti, articoli) con filtri e
card. Servono per le pagine "scrigno" del sito: prodotti, progetti, news.

#### `listing`

La griglia in evidenza con card selezionate a mano. Usala in home o in apertura
di sezione per mettere in vetrina i contenuti più importanti.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Facoltativo | Titolo della sezione |
| **Sottotitolo** | Facoltativo | Breve introduzione |
| **Elementi della lista** | Obbligatorio | I contenuti da mostrare (card) |

#### `products`

La griglia intera dei prodotti con **filtri laterali** (per divisione, categoria,
target). Usala per la pagina prodotti, dove il visitatore cerca e filtra.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Facoltativo | Titolo della pagina |
| **Sottotitolo** | Facoltativo | Introduzione |
| **Filtri** | Facoltativo | Le categorie per filtrare (vedi §10) |

#### `projects`

Come `products`, ma dedicata ai **progetti** (casi studio).

#### `stories`

Come `products`, ma dedicata agli **articoli / news**.

#### `infestanti`

La griglia delle schede **infestanti** (scarafaggi, formiche…). Serve a far conoscere
i target trattati, con le relative card.

#### `projects_highlight`

Come il `listing`, ma dedicato ai progetti: mostra le card dei **progetti selezionati**
in evidenza.

#### `carousel`

Una striscia di card a scorrimento (es. le ultime news, i prodotti correlati).
Ogni elemento del carosello è una card che punta a un contenuto.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Facoltativo | Titolo della sezione |
| **Sottotitolo** | Facoltativo | Breve introduzione |
| **Pulsante** | Facoltativo | Link alla raccolta completa |

### 3.4 Card

Le card sono i "rettangoli" con cui si presentano i contenuti nei listing. Non le
compili caso per caso: sono generate automaticamente dal contenuto collegato.
Le principali (nome componente → a cosa serve):

| Componente | A cosa serve |
| --- | --- |
| **CardListingProduct** | Prodotto: immagine, titolo, breve descrizione |
| **CardNews** | Articolo: immagine, tag, titolo, data |
| **CardListingProject** | Progetto: immagine, titolo, descrizione |
| **CardListingInsect** | Infestante (nei filtri prodotto) |
| **CardListingCatalog** / **DownloadPreviewList** | File scaricabile: immagine, titolo, pulsante download |
| **CardListingCourse** | Corsi / accademy |
| **CardListingTeam** | Membro del team |
| **CardJob** | Offerta di lavoro |
| **CardApp** | Applicazione |
| **CardBox** / **CardCtaBox** | Varianti riquadro per CTA |
| **DivisionCard** | Divisione di business |

Le card si riempiono da sole: basta **collegare il contenuto giusto** (una story)
nel listing o nel campo relativo. Non scrivere il testo a mano dentro la card.

### 3.5 Sezioni di contenuto

Blocchi ricchi per spiegare, documentare e arricchire una pagina.

#### `spec_table`

Una tabella dati. Nella prima colonna va il **nome del parametro** (es. "Dimensioni"),
nelle successive i valori. Usala per specifiche, confronti, dati tecnici.

#### `article_body`

L'articolo: il corpo di testo completo di un articolo/news, con paragrafi,
sottotitoli e media. Usala insieme a `stories` / `carousel`.

#### `alphabetical_accordion`

Un elenco a fisarmonica **ordinato alfabeticamente** (es. glossario, elenco termini).

#### `faqs`

Sezione domande/risposte: titolo, descrizione e coppie domanda → risposta.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Facoltativo | Titolo della sezione |
| **Descrizione** | Facoltativo | Introduzione opzionale |

#### `tabs`

Sezioni a schede: i contenuti si alternano con un clic. Usalo per organizzare
informazioni in gruppi (es. "Uso", "Composizione", "Sicurezza").

#### `gallery`

Galleria di immagini, con eventuale scorrimento. Le foto si caricano come singole
immagini nel blocco.

#### `slideshow`

Un carosello a schermo (immagini a tutto campo che si alternano). Usalo per
foto di grande impatto.

#### `video_yt`

Incolla l'URL del video (o l'ID) e il sito lo incorpora. Usalo per video
promozionali o tutorial.

#### `icon_text_highlight`

Una breve frase con un'icona accanto, in evidenza. Usala per punti di forza,
caratteristiche, vantaggi (es. "Residuo minimo" con l'icona a goccia).

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Obbligatorio | La frase da mostrare |
| **Icona** | Obbligatorio | L'icona da affiancare |

#### `partners`

La striscia con i loghi dei partner. Ogni partner è un logo con un link (se serve).

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Facoltativo | Titolo della sezione |
| **Immagine** | Facoltativo | Logo del partner |

#### `milestone`

Una linea temporale o un elenco numerico di traguardi (anni, numeri, risultati).

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Facoltativo | Titolo della sezione |
| **Voce** | Obbligatorio | Ogni traguardo/numero da mostrare |

#### `division_box`

Un riquadro dedicato a una **divisione/linea di business**, con immagine e testo.

#### `divider`

Una riga di separazione tra sezioni. Non richiede contenuti.

#### `compare`

La **comparazione prodotti**: seleziona più prodotti e confrontali in una griglia.

#### `job_list`

L'elenco delle posizioni aperte: ogni voce è un'offerta pubblicata (`job`).

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Obbligatorio | Titolo della sezione |
| **Descrizione** | Facoltativo | Introduzione |
| **Pulsante** | Facoltativo | Link alla posizione |

#### `catalogs_download`

Modulo per raccogliere cataloghi e brochure scaricabili. Nel campo di selezione sono
disponibili solo i contenuti `catalog` e i `downloadable` di tipo **Catalogo** o
**Brochure** che hanno un file PDF allegato. Il download richiede sempre la compilazione
del form.

La sezione con le card di download dei cataloghi.

| Campo | Obbligatorio? | Note |
| --- | --- | --- |
| **Titolo** | Obbligatorio | Titolo della sezione |
| **Immagine** | Facoltativo | Copertina/immagine del catalogo |

#### `downloadable_resources`

Le risorse scaricabili (schede tecniche, brochure, app): le card con download
gestito dal DownloadGate.

#### `molecules` e `atoms` (supporto)

Sotto alla library Figma ci sono due gruppi di componenti **riutilizzabili** che NON
sono blocchi di pagina ma elementi di design:

| Gruppo | Componenti |
| --- | --- |
| **Molecules** | `Card*`, `FilterChips`, `PaginationNumbers`, `Select`, `Modal`, `TargetPests`, `ProductActionBar`, `ProductFilters`… |
| **Atoms** | `Button`, `Icon`, `Tag`, `TextField`, `CheckboxField`, `SmartLink`, `Breadcrumbs`, `AnchorLink`, `Asset`, `SocialItem`, `NavItem`… |

Questi elementi sono già montati nel sito: non li compili direttamente, li vedi
comparire dentro gli altri blocchi.

### 3.6 Elementi di pagina globali

Questi componenti non sono "blocchi di pagina" che aggiungi tu: sono già presenti e
valgono su tutte le pagine.

| Componente | Dove lo vedi |
| --- | --- |
| **`header`** | Il menu in alto, con megamenu al passaggio del mouse |
| **`footer`** | La chiusura del sito con newsletter e link |
| **`settings`** | Le impostazioni globali (configurazione sito) |
| **`page`** / **`Product`** / **`Project`** / **`Job`** / **`Story`** | I contenitori (template) delle pagine |

> **Non modificare** `header`, `footer` e `settings` se non sei sicuro/a: sono globali
> e valgono su tutte le pagine.

---

## 4. Le schede prodotto e il template PDF

Le schede prodotto seguono il template grafico delle schede tecniche. Ogni sezione
della scheda corrisponde a un **campo del prodotto** in Storyblok (i nomi sotto sono
quelli esatti che trovi nello schema `product`):

| Sezione nella scheda | Campo | Note |
| --- | --- | --- |
| Nome prodotto | `title` | Obbligatorio |
| Sottotitolo / claim | `secondary_title` | Breve, una riga |
| Descrizione breve | `short_description` | Usata dalle card |
| Caratteristiche | `features` | Testo descrittivo |
| Campi d'impiego | `application_areas` + `application_areas_text` | Dove si usa |
| Dosi e modalità | `dosage_and_application` (e `usage`) | Dosi per superficie/volume |
| Composizione | `composition` | Principi attivi, percentuali |
| PZ/cartone | `units_per_carton` | Es. "Flacone 1 L, 12 pz" |
| Target | `target_pests` | Seleziona le schede infestanti |
| Specifiche | `dimensions`, `registration`, `formulazione` | Valori tecnici |
| Sicurezza | `safety_data_sheet` | Il file PDF della SDS |
| Foto | `images` | Foto del prodotto |
| Video | `video` | URL YouTube |
| Prodotti correlati | `related_products` | Solo prodotti: selezione manuale o dinamica per categoria/sottocategoria/application area. Nelle news non crea un carosello: le news compaiono nel carosello delle schede prodotto referenziate. |
| Evidenze | `bestseller` | Se attivo, appare nelle evidenze |
| Risorse | `resources` | Documenti/risorse collegate |

### Il campo `target_pests`

- Apri il campo e **seleziona una o più schede infestanti** già esistenti
  (es. scarafaggi, formiche, mosche).
- Puoi aggiungere un testo accanto (es. il nome scientifico).
- Il sito mostra il nome e l'icona **da soli**: basta il collegamento.

> Se l'infestante non esiste, va **creata prima** la scheda dedicata, poi collegata.

### Le tabelle delle specifiche (`spec_table`)

- Nella prima colonna va il **nome del parametro** (es. "Dimensioni").
- Nelle colonne successive vanno i **valori**.
- Non incollare testo grezzo: usa la tabella.

---

## 5. Regole editoriali

### Lunghezze consigliate

| Campo | Lunghezza | Perché |
| --- | --- | --- |
| `title` | ≤ 80 caratteri | Deve stare in card e titolo |
| `secondary_title` | ≤ 120 caratteri | Una riga |
| `short_description` | ≤ 160 caratteri | Le card troncano il testo |
| `features` / `composition` | 2-3 frasi per paragrafo | Meglio brevi e leggibili |

### Buone pratiche

1. **Titoli senza punto finale.**
2. **Niente TUTTO MAIUSCOLO**: il design gestisce già le maiuscole grafiche.
3. **I link si fanno selezionando la pagina**, non scrivendo l'URL a mano
   (così funzionano in tutte le lingue).
4. **Immagini ottimizzate**: carica formati web, non file enormi.
5. **Ogni lingua con i propri testi**: in `it/` scrivi in italiano, in `en/` in inglese.
6. **Non duplicare**: se un contenuto è collegato in più punti, modificalo una volta sola.
7. **Niente segnaposto**: mai "lorem ipsum", "XXX", "inserire testo".

### Checklist prima di pubblicare

- [ ] `title` entro gli 80 caratteri
- [ ] `target_pests` compilati (se è insetticida/acaricida)
- [ ] Almeno 1 immagine (`images`)
- [ ] Tutte le sezioni della scheda compilate (o volutamente vuote)
- [ ] Nessun testo segnaposto
- [ ] Verificato in italiano **e** inglese (e arabo se previsto)

---

## 6. Creare, modificare e pubblicare

### Creare un contenuto

1. Vai su **Contenuti → + Nuovo** nella cartella giusta (es. `it/prodotti/`).
2. Scegli il tipo (es. `product`).
3. Compila i campi.
4. **Salva**: resta in bozza.

### Anteprima

- Apri il contenuto nell'editor: vedi l'anteprima dal vivo.
- Se non appare nulla, controlla che il contenuto sia **salvato**.

### Pubblicare

1. Clicca **Pubblica**.
2. Il sito si aggiorna da solo (revalidation).
3. Apri la pagina pubblica e controlla (aggiorna con Ctrl+F5 se serve).

### Modificare un contenuto esistente

- Modifica → **Salva** → **Ripubblica**.
- Se modifichi ma non ripubblichi, le modifiche restano solo in bozza.
- Attenzione ai contenuti collegati (es. la scheda infestante usata in molti prodotti):
  modificandola, cambi in tutti i punti dove è collegata.

### Eliminare o archiviare

- Meglio **archiviare** che eliminare se il contenuto è collegato altrove.
- Prima di eliminare, controlla dove viene usato.

---

## 7. Contribuzione di team

| Ruolo | Cosa può fare |
| --- | --- |
| **Editor contenuti** | Crea/modifica/pubblica i propri contenuti |
| **Editor traduzioni** | Come sopra + gestisce le traduzioni |
| **Amministratore** | Tutto: schemi, plugin, ruoli, webhook |

### Flusso consigliato

1. Prepara il contenuto **in bozza** (con la checklist del §5).
2. **Fai rivedere** da un collega (titolo, lingua, target).
3. **Pubblica**.
4. **Verifica** la pagina pubblicata.

> Nel dubbio: pubblica solo ciò che è pronto **in tutte le lingue**.
> Un contenuto pubblicato in italiano ma non in inglese crea vuoti nei listing.

---

## 8. Le lingue del sito (locales)

| Lingua | Direzione | Stato |
| --- | --- | --- |
| Italiano (`it`) | Da sinistra a destra | Predefinita |
| Inglese (`en`) | Da sinistra a destra | Attiva |
| Arabo (`ar`) | Da destra a sinistra | Attiva se c'è contenuto |

### Come aggiungere una lingua

1. Crea la **cartella** della lingua in Storyblok (es. `de/`).
2. Aggiungi almeno un contenuto **pubblicato** (es. la home).
3. Il sito vedrà la lingua da solo.
4. Compila i contenuti in quella lingua.
5. Traduci le etichette (vedi §9).

> La lingua non appare finché non c'è contenuto pubblicato.

---

## 9. Le traduzioni

Le piccole etichette (menu, bottoni, messaggi) non stanno nelle pagine: vivono in una
lista chiamata **`labels`** (in Storyblok: Contenuti → Datasource → `labels`).

### Come funziona

- Una **chiave** è un nome con punti (es. `nav.home`).
- Per ogni chiave esiste un **valore in italiano** e una **colonna per le altre lingue**.
- Esempio: `nav.home` = "Home" in italiano, "Home" in inglese, "الرئيسية" in arabo.

### Come aggiungere o modificare una traduzione

1. Vai in **Contenuti → Datasource → `labels`**.
2. Cerca la chiave (es. `banner.title`). Se non esiste, creala:
   - **Name**: il nome della chiave (es. `banner.title`)
   - **Value**: il testo in italiano
   - **Dimension** (`en`, `ar`): il testo tradotto
3. **Pubblica** la voce.
4. Verifica sul sito.

> ⚠️ **Errore comune**: la voce esiste ma non è **pubblicata** → sul sito compare il
> nome della chiave al posto del testo. **Pubblica sempre** dopo ogni modifica.

### Regole per le chiavi

- Minuscole, con punti per la gerarchia (`nav.home`, `footer.newsletter`).
- Niente spazi o caratteri speciali nel nome.
- Se rinomini una chiave, aggiorna **tutte** le lingue.
- Ogni colonna nella **sua** lingua: mai tradurre in italiano dentro la colonna inglese.

---

## 10. I filtri dei listing

Le pagine "scrigno" (prodotti, progetti) usano filtri a sinistra. Le voci dei filtri
vivono nel datasource **`filtri`**.

- Apri **Contenuti → Datasource → `filtri`**.
- Aggiungi/modifica le voci (es. categorie, divisioni, target).
- Dopo la modifica, **pubblica** la voce: i filtri si aggiornano da soli.

> Se un filtro nuovo non compare subito, controlla di averlo pubblicato.

---

## 11. Domande frequenti

### Compare il nome della chiave (es. `nav.home`) al posto del testo

La voce nel datasource `labels` non è **pubblicata**. Aprila, compila le colonne e
**pubblica**.

### La pagina non si aggiorna dopo la pubblicazione

- Lo stato è davvero **Pubblicato**? (non solo Salvato)
- Fai un aggiornamento forzato (Ctrl+F5).
- Se hai cambiato solo le etichette: pubblica anche la voce del datasource.

### Un blocco non appare nella pagina

- Il blocco non è abilitato per quel tipo di contenuto → contatta il team tecnico.
- Hai **salvato** e **ripubblicato**?

### Un prodotto non compare nel listing

- È **pubblicato**? È nella cartella giusta (es. `it/prodotti/`)?
- Se serve un filtro nuovo, aggiungilo nel datasource `filtri` e pubblicalo.

### Posso usare HTML nei testi?

- I campi normali usano un editor di testo (testo ricco), non HTML.
- Solo il campo "tabella (code)" accetta HTML, e va usato per casi particolari.
- Non incollare HTML da altri programmi: rompe la pagina.

### Voglio aggiungere una lingua

Crea la cartella + un contenuto pubblicato, poi traduci le etichette (vedi §8 e §9).

---

## 12. Glossario

| Termine | Significato |
| --- | --- |
| **Story** | Un contenuto in Storyblok (pagina, prodotto, articolo…) |
| **Bozza** | Stato non pubblicato; visibile solo nell'editor |
| **Pubblicato** | Stato visibile a tutti |
| **Blocco (modulo)** | Componente di pagina (hero, tabella, FAQ…) |
| **Card** | Il riquadro che presenta un contenuto nei listing |
| **Datasource** | Una lista chiave/valore (es. `labels`, `filtri`) |
| **Dimension** | La "colonna" per lingua di un datasource |
| **Revalidation** | L'aggiornamento automatico del sito dopo la pubblicazione |
| **RTL** | Testo da destra a sinistra (arabo) |
| **SDS** | Scheda di sicurezza (Safety Data Sheet) |

---

*Fine della guida. Per modifiche a design system, schemi o plugin, contatta il team
tecnico Newpharm.*