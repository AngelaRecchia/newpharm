import React from 'react'
import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import { join } from 'path'
import { sheetStyles } from './styles'
import type { SheetSection, TechnicalSheetData } from './document'
import type { TargetPestView } from '@/lib/products/targetPests'

/**
 * Sorgente immagine per react-pdf:
 * - URL remoto o data URI (stringa)
 * - Buffer già scaricato: `{ data: Buffer, format: 'png' | 'jpg' }`
 */
export type SheetImageSource =
  | string
  | { data: Buffer; format: 'png' | 'jpg' }
  | null
  | undefined

/**
 * Layout della scheda tecnica, fedele al PDF di esempio (catalogo Newpharm):
 * - branding Newpharm e intestazione prodotto
 * - immagine prodotto accanto al riepilogo e ai dati identificativi
 * - sezioni a tutta larghezza per mantenere leggibili i testi lunghi
 * - footer con disclaimer, info azienda e data aggiornamento
 */

/** Citazione legale del template (tradotta per locale). */
const DEFAULT_DISCLAIMER =
  'Tale pubblicazione è strettamente riservata alla forza vendita, ai rivenditori ed ai tecnici specializzati. Le informazioni ivi riportate sono a carattere puramente informativo. L’utilizzatore deve pertanto leggere attentamente quanto riportato sulla confezione ed attenersi alle indicazioni presenti sull’etichetta dei singoli prodotti per il loro corretto utilizzo e per evitare danni a piante, persone ed animali. Newpharm S.r.l. declina ogni responsabilità per l’uso improprio dei prodotti o nel caso in cui gli stessi venissero impiegati in violazione di qualsiasi norma.'
const LOGO_PATH = join(process.cwd(), 'assets', 'pdf', 'newpharm-logo.svg')

function renderPestTitle(pest: TargetPestView): string {
  return pest.title
}

function renderSectionBody(section: SheetSection): React.ReactNode {
  // Lista (target peste, specifiche)
  if (section.kind === 'targetPests' && Array.isArray(section.body)) {
    const pests = section.body as TargetPestView[]
    return (
      <Text style={sheetStyles.sectionBodyList}>
        {pests.map((pest) => renderPestTitle(pest)).join(', ')}
      </Text>
    )
  }

  if (section.kind === 'specifications' && Array.isArray(section.body)) {
    const specs = section.body as string[]
    return (
      <View>
        {specs.map((spec, index) => {
          const [key, ...rest] = spec.split(':')
          const value = rest.join(':').trim()
          return (
            <View key={index} style={sheetStyles.specRow}>
              <Text style={sheetStyles.specKey}>{key.trim()}</Text>
              <Text style={sheetStyles.specValue}>{value}</Text>
            </View>
          )
        })}
      </View>
    )
  }

  // Testo semplice
  const text = Array.isArray(section.body) ? section.body.join('\n') : section.body
  return <Text style={sheetStyles.sectionBody}>{text}</Text>
}

/**
 * Componente function: react-pdf renderizza questo per ottenere il <Document>.
 * (react-pdf si aspetta un componente che RITORNA <Document>, non l'elemento
 * Document direttamente — altrimenti fallisce con React error #31.)
 */
export function TechnicalSheetDocument({
  data,
  disclaimer = DEFAULT_DISCLAIMER,
}: {
  data: TechnicalSheetData
  disclaimer?: string
}): React.ReactElement {
  const imageSource: SheetImageSource = data.image

  return (
    <Document
      title={`${data.title} — Scheda tecnica`}
      author="Newpharm S.r.l."
      subject={`Scheda tecnica ${data.title}`}
      language={data.locale}
    >
      <Page size="A4" style={sheetStyles.page}>
        <View style={sheetStyles.brandBar}>
          <View style={sheetStyles.brand}>
            {/* react-pdf Image does not support the HTML alt prop. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={LOGO_PATH} style={sheetStyles.logo} />
          </View>
          <Text style={sheetStyles.documentType}>SCHEDA TECNICA</Text>
        </View>

        <View style={sheetStyles.header}>
          {data.categorySlug ? (
            <Text style={sheetStyles.headerCategory}>{data.categorySlug}</Text>
          ) : null}
          <Text style={sheetStyles.headerTitle}>{data.title}</Text>
          {data.subtitle ? (
            <Text style={sheetStyles.headerSubtitle}>{data.subtitle}</Text>
          ) : null}
        </View>

        {/* Immagine e riepilogo restano affiancati; le sezioni seguono a tutta larghezza. */}
        <View style={sheetStyles.productRow}>
          {imageSource ? (
            <View style={sheetStyles.imageBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={imageSource} style={sheetStyles.image} />
            </View>
          ) : null}

          <View style={sheetStyles.contentColumn}>
            {data.summary ? (
              <Text style={sheetStyles.summary}>{data.summary}</Text>
            ) : null}

            {data.registration ? (
              <Text style={sheetStyles.registration}>{data.registration}</Text>
            ) : null}
          </View>
        </View>

        {data.sections.map((section) => (
          <View key={section.kind} style={sheetStyles.section}>
            <Text style={sheetStyles.sectionLabel}>{section.label}</Text>
            {renderSectionBody(section)}
          </View>
        ))}

        {/* Footer — disclaimer + azienda + data */}
        <View style={sheetStyles.footer} fixed>
          <Text style={sheetStyles.footerBrand}>newpharm S.r.l.</Text>
          <Text style={sheetStyles.footerLine}>{disclaimer}</Text>
          <Text style={sheetStyles.footerLine}>{data.footerCompany}</Text>
          {data.footerUpdated ? (
            <Text style={sheetStyles.footerLine}>{data.footerUpdated}</Text>
          ) : null}
        </View>
      </Page>
    </Document>
  )
}