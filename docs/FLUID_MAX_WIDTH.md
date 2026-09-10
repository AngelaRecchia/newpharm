# Max-width fluidi e fluid typography

Convenzione: quando un elemento tipografico (titolo, paragrafo, blocco di testo) ha bisogno di un `max-width`, questo deve essere **fluido** e **sincronizzato con la fluid typography**, usando i mixin appositi — mai un valore fisso.

## Perché

Il progetto usa **fluid typography**: le `font-size` scalano tra 375px e 1440px (con cap a 2560px) tramite `clamp()` nei mixin `t-*` (vedi `styles/_mixins.scss`). Se un `max-width` è un valore fisso (es. `max-width: 900px`), la proporzione tra larghezza del testo e dimensione del font **si rompe** al variare del viewport: su schermi piccoli il testo è piccolo ma il blocco resta largo, su schermi grandi il testo cresce ma il blocco resta stretto.

Il max-width deve quindi **crescere con la stessa ratio del font**, usando la stessa interpolazione `clamp()` della tipografia.

## Mixin appositi

In `styles/_mixins.scss`:

### `fluid-type-max-width($width-at-xxl, $type)`

Rende il `max-width` fluido, allineato a una scala tipografica.

- `$width-at-xxl`: larghezza desiderata **a 1440px** (px o rem).
- `$type`: chiave della scala tipografica (`h1`, `h2`, `h3`, `h6`, `huge`). Definisce la curva di interpolazione.
- Il mixin deriva il **ratio** `width / font-size@1440` e lo applica ai valori `min`/`xxl`/`max` della scala, producendo un `clamp()` sincronizzato con la font-size.

```scss
@mixin fluid-type-max-width($width-at-xxl, $type: h1) {
  // ...
  max-width: clamp(
    calc(#{$min} * #{$ratio}),
    calc((#{$min} + (#{$xxl} - #{$min}) * ((100vw - 375px) / (1440px - 375px))) * #{$ratio}),
    calc(#{$max} * #{$ratio})
  );
}
```

Scale disponibili (`$fluid-type-scales`): `h6`, `h3`, `h2`, `h1`, `huge`.

## Uso corretto

Sempre in coppia con il mixin tipografico dello stesso tipo:

```scss
.title {
  @include t-h1;                          // font-size fluida
  @include fluid-type-max-width(900px, h1); // max-width fluido, stessa ratio
}
```

Esempio reale nel codebase: `components/organisms/FullBanner/index.module.scss`:

```scss
.title {
  @include t-h1;
  @include fluid-type-max-width(900px, h1);
  // ...
}
```

Anche `components/molecules/HeroTertiary/index.module.scss` (titolo hero): max-width **solo da `lg` in su**, mobile senza limite (100% naturale):

```scss
.title {
  @include t-h1;
  margin: 0;

  @include lg {
    // Max-width fluido solo da lg in su — su mobile nessun limite.
    @include fluid-type-max-width(440px, h1);
  }
}
```

## Regole

1. **Mai `max-width` fissi** su elementi tipografici: usare `fluid-type-max-width`.
2. **Il `$type` deve combaciare** con il mixin tipografico usato (es. `t-h1` → `h1`), così la ratio è coerente.
3. **`$width-at-xxl` è la larghezza a 1440px**: ragionare al breakpoint di design, non a viewport arbitrari.
4. **Valutare il breakpoint**: se il limite deve valere solo da desktop, mettere il mixin dentro `@include lg` — su mobile il max-width naturale (100%) viene lasciato invariato.
5. Se serve una scala non coperta (`$fluid-type-scales`), **estendere la mappa** in `_mixins.scss` invece di scrivere un clamp manuale.

## Verifica

- Controllare che il `max-width` calcolato cresca proporzionalmente alla font-size tra 375px e 1440px (e fino al cap 2560px).
- Testare a viewport piccoli (375px) e grandi (1440px+): la proporzione testo/blocco deve restare costante.