import { StyleSheet } from '@react-pdf/renderer'

/**
 * Griglia del template Mastro (A4, misure in pt dal PDF del 4 settembre 2026).
 * Colonna sinistra 283.5 a filo pagina; testi a destra da x=311.8.
 * Inter Regular ovunque: nel template i titoli non sono bold.
 */

const FONT = 'Inter'
const INK = '#231f20'
const MUTED = '#939598'
const PANEL = '#f3f2f1'

/** paddingLeft della pagina: i testi scorrono nella colonna destra su ogni pagina. */
export const PAGE_PAD_LEFT = 312
export const PAGE_PAD_TOP = 76
export const PAGE_PAD_RIGHT = 28
export const PAGE_PAD_BOTTOM = 96

export const sheetStyles = StyleSheet.create({
  page: {
    paddingTop: PAGE_PAD_TOP,
    paddingLeft: PAGE_PAD_LEFT,
    paddingRight: PAGE_PAD_RIGHT,
    paddingBottom: PAGE_PAD_BOTTOM,
    fontFamily: FONT,
    fontSize: 7,
    lineHeight: 1.2,
    color: INK,
  },

  // Assoluto rispetto alla pagina (non al padding). Solo prima pagina.
  leftColumn: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 283.5,
    height: 748,
    flexDirection: 'column',
  },
  hero: {
    height: 300,
    backgroundColor: PANEL,
    paddingTop: 28,
    paddingHorizontal: 28,
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingTop: 2,
    paddingBottom: 1,
    paddingHorizontal: 6,
  },
  chipText: {
    fontFamily: FONT,
    fontSize: 7,
    lineHeight: 1.15,
    color: INK,
  },
  imageWrap: {
    marginTop: 10,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 180,
    height: 202,
    objectFit: 'contain',
  },

  meta: {
    paddingTop: 13,
    paddingLeft: 28,
    paddingRight: 0,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaCol: {
    width: 135,
    flexShrink: 0,
  },
  metaBelow: {
    marginTop: 18,
    width: 240,
  },

  // Blocco titolo + caratteristiche: altezza minima fino alla quota y=313 del template.
  intro: {
    minHeight: 237,
  },
  title: {
    fontFamily: FONT,
    fontSize: 26,
    lineHeight: 1.15,
    color: INK,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FONT,
    fontSize: 8,
    lineHeight: 1.2,
    color: INK,
  },
  section: {
    marginTop: 16,
  },
  sectionFlush: {
    marginTop: 0,
  },
  characteristics: {
    marginTop: 88,
  },
  characteristicsAfterSubtitle: {
    marginTop: 68,
  },
  sectionLabel: {
    fontFamily: FONT,
    fontSize: 8,
    lineHeight: 1.4,
    color: INK,
    marginBottom: 4,
  },
  body: {
    fontFamily: FONT,
    fontSize: 7,
    lineHeight: 1.2,
    color: INK,
  },

  registrationPin: {
    position: 'absolute',
    left: 28,
    bottom: 112,
    width: 240,
    fontFamily: FONT,
    fontSize: 7,
    lineHeight: 1.2,
    color: INK,
  },

  footer: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 14,
    height: 68,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerLeft: {
    width: 284,
  },
  logo: {
    width: 118,
    height: 22,
    objectFit: 'contain',
  },
  footerMeta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  footerAddress: {
    width: 128,
    fontFamily: FONT,
    fontSize: 6,
    lineHeight: 1.2,
    color: MUTED,
  },
  footerDate: {
    marginLeft: 8,
    fontFamily: FONT,
    fontSize: 6,
    lineHeight: 1.2,
    color: MUTED,
  },
  footerDisclaimer: {
    width: 255,
    fontFamily: FONT,
    fontSize: 6,
    lineHeight: 1.2,
    color: MUTED,
  },
})
