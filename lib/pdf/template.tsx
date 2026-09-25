import React from 'react'
import { readFileSync } from 'fs'
import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import { join } from 'path'
import { sheetStyles } from './styles'
import type { Style } from '@react-pdf/types'
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
 * Layout della scheda tecnica, fedele al template Mastro (settembre 2026):
 * - fascia grigia a sinistra con categoria e foto prodotto
 * - titolo, sottotitolo e testi nella colonna destra
 * - meta (target, composizione, pezzi) sotto la foto
 * - footer con logo, indirizzo, data e disclaimer
 */

const DEFAULT_DISCLAIMER =
  'Tale pubblicazione è strettamente riservata alla forza vendita, ai rivenditori ed ai tecnici specializzati. Le informazioni ivi riportate sono a carattere puramente informativo. L’utilizzatore deve pertanto leggere attentamente quanto riportato sulla confezione ed attenersi alle indicazioni presenti sull’etichetta dei singoli prodotti per il loro corretto utilizzo e per evitare danni a piante, persone ed animali. Newpharm S.r.l. declina ogni responsabilità per l’uso improprio dei prodotti o nel caso in cui gli stessi venissero impiegati in violazione di qualsiasi norma.'
const LOGO_PATH = join(process.cwd(), 'assets', 'pdf', 'newpharm-logo.png')
const LOGO_SRC = { data: readFileSync(LOGO_PATH), format: 'png' as const }

const LEFT_KINDS = new Set<SheetSection['kind']>(['targetPests', 'composition', 'units'])
const RIGHT_AFTER_INTRO: SheetSection['kind'][] = ['dosage', 'application', 'specifications']

function sectionToText(section: SheetSection): string {
  if (section.kind === 'targetPests' && Array.isArray(section.body)) {
    return (section.body as TargetPestView[])
      .map((pest) => pest.title)
      .filter(Boolean)
      .join(', ')
  }
  if (Array.isArray(section.body)) return section.body.join('\n')
  return section.body
}

function findSection(
  sections: SheetSection[],
  kind: SheetSection['kind'],
): SheetSection | undefined {
  return sections.find((section) => section.kind === kind && sectionToText(section).trim())
}

function SectionBlock({
  section,
  style,
}: {
  section: SheetSection
  style?: Style
}): React.ReactElement {
  return (
    <View style={style ?? sheetStyles.section} wrap>
      <Text style={sheetStyles.sectionLabel}>{section.label}</Text>
      <Text style={sheetStyles.body}>{sectionToText(section)}</Text>
    </View>
  )
}

/**
 * Componente function: react-pdf renderizza questo per ottenere il <Document>.
 */
export function TechnicalSheetDocument({
  data,
  disclaimer = DEFAULT_DISCLAIMER,
}: {
  data: TechnicalSheetData
  disclaimer?: string
}): React.ReactElement {
  const imageSource: SheetImageSource = data.image
  const characteristics = findSection(data.sections, 'characteristics')
  const leftBlocks = [
    findSection(data.sections, 'targetPests'),
    findSection(data.sections, 'composition'),
    findSection(data.sections, 'units'),
  ].filter((section): section is SheetSection => Boolean(section))
  const leftRow = leftBlocks.slice(0, leftBlocks.length >= 2 ? 2 : leftBlocks.length)
  const leftBelow = leftBlocks.length > 2 ? leftBlocks[2] : undefined
  const rightRest = RIGHT_AFTER_INTRO.map((kind) => findSection(data.sections, kind)).filter(
    (section): section is SheetSection => Boolean(section),
  )
  const hasLeftMeta = data.sections.some((section) => LEFT_KINDS.has(section.kind))

  return (
    <Document
      title={`${data.title} — Scheda tecnica`}
      author="Newpharm S.r.l."
      subject={`Scheda tecnica ${data.title}`}
      language={data.locale}
    >
      <Page size="A4" style={sheetStyles.page}>
        <View style={sheetStyles.leftColumn}>
          <View style={imageSource ? sheetStyles.hero : [sheetStyles.hero, { height: 72 }]}>
            {data.categoryLabel ? (
              <View style={sheetStyles.chip}>
                <Text style={sheetStyles.chipText}>{data.categoryLabel}</Text>
              </View>
            ) : null}
            {imageSource ? (
              <View style={sheetStyles.imageWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={imageSource} style={sheetStyles.image} />
              </View>
            ) : null}
          </View>

          {hasLeftMeta ? (
            <View style={sheetStyles.meta}>
              {leftRow.length > 0 ? (
                <View style={sheetStyles.metaRow}>
                  {leftRow.map((section) => (
                    <View key={section.kind} style={sheetStyles.metaCol}>
                      <SectionBlock section={section} style={sheetStyles.sectionFlush} />
                    </View>
                  ))}
                </View>
              ) : null}
              {leftBelow ? (
                <View style={sheetStyles.metaBelow}>
                  <SectionBlock section={leftBelow} style={sheetStyles.sectionFlush} />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {data.registration ? (
          <Text style={sheetStyles.registrationPin}>{data.registration}</Text>
        ) : null}

        <View style={imageSource ? sheetStyles.intro : undefined}>
          <Text style={sheetStyles.title}>{data.title}</Text>
          {data.subtitle ? <Text style={sheetStyles.subtitle}>{data.subtitle}</Text> : null}
          {characteristics ? (
            <SectionBlock
              section={characteristics}
              style={
                data.subtitle
                  ? sheetStyles.characteristicsAfterSubtitle
                  : sheetStyles.characteristics
              }
            />
          ) : null}
        </View>

        {rightRest.map((section, index) => (
          <SectionBlock
            key={section.kind}
            section={section}
            style={index === 0 ? sheetStyles.sectionFlush : sheetStyles.section}
          />
        ))}

        <View style={sheetStyles.footer} fixed>
          <View style={sheetStyles.footerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={LOGO_SRC} style={sheetStyles.logo} />
            <View style={sheetStyles.footerMeta}>
              <Text style={sheetStyles.footerAddress}>{data.footerCompany}</Text>
              {data.footerUpdated ? (
                <Text style={sheetStyles.footerDate}>{data.footerUpdated}</Text>
              ) : null}
            </View>
          </View>
          <Text style={sheetStyles.footerDisclaimer}>{disclaimer}</Text>
        </View>
      </Page>
    </Document>
  )
}
