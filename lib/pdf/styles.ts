import { StyleSheet } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'

/**
 * Stili della scheda tecnica.
 * Fedeli al template PDF di esempio (Newpharm):
 * intestazione grigia, box con etichette, corpo in Inter.
 */

const BASE_FONT = 'Inter'

/** Grigio dell'intestazione — dal template (header grigio). */
const PRIMARY = '#006fb2'
const ALERT = '#e2071c'
const HEADER_BG = '#f3f4f6'
const BORDER = '#d9dde2'
const BODY_COLOR = '#263238'
const DISCLAIMER_COLOR = '#66717a'

export const sheetStyles = StyleSheet.create({
  // ===== Document / Page =====
  page: {
    paddingTop: 30,
    paddingHorizontal: 38,
    paddingBottom: 58,
    fontSize: 9.5,
    fontFamily: BASE_FONT,
    color: BODY_COLOR,
  },

  // ===== Brand / header =====
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 145,
    height: 27,
    objectFit: 'contain',
  },
  documentType: {
    fontSize: 8,
    fontFamily: BASE_FONT,
    fontWeight: 600,
    color: PRIMARY,
    letterSpacing: 1,
  },
  header: {
    backgroundColor: HEADER_BG,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: ALERT,
  },
  headerCategory: {
    fontSize: 9,
    color: PRIMARY,
    fontFamily: BASE_FONT,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: BASE_FONT,
    fontWeight: 700,
    color: '#111820',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: BASE_FONT,
    fontWeight: 400,
    color: '#52606a',
    marginTop: 4,
  },

  // ===== Product overview =====
  productRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  imageBox: {
    width: '34%',
    minHeight: 150,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 145,
    objectFit: 'contain',
  },
  contentColumn: {
    width: '66%',
    paddingLeft: 18,
    paddingRight: 2,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.45,
    color: BODY_COLOR,
    marginBottom: 10,
  },
  registration: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    fontSize: 9,
    color: PRIMARY,
    fontFamily: BASE_FONT,
    fontWeight: 600,
  },

  // ===== Sections =====
  section: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  sectionLabel: {
    width: '28%',
    paddingRight: 10,
    fontSize: 9,
    fontFamily: BASE_FONT,
    fontWeight: 600,
    color: PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  sectionBody: {
    width: '72%',
    fontSize: 9.5,
    lineHeight: 1.4,
    fontFamily: BASE_FONT,
    color: BODY_COLOR,
  },
  sectionBodyList: {
    width: '72%',
    fontSize: 9.5,
    lineHeight: 1.4,
    fontFamily: BASE_FONT,
    color: BODY_COLOR,
  },

  // ===== Specifiche (lista chiave: valore) =====
  specRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  specKey: {
    width: '40%',
    fontSize: 9,
    fontFamily: BASE_FONT,
    fontWeight: 600,
    color: BODY_COLOR,
  },
  specValue: {
    width: '60%',
    fontSize: 9,
    fontFamily: BASE_FONT,
    color: BODY_COLOR,
  },

  // ===== Footer =====
  footer: {
    position: 'absolute',
    left: 38,
    right: 38,
    bottom: 24,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    fontSize: 8,
    fontFamily: BASE_FONT,
    color: DISCLAIMER_COLOR,
  },
  footerBrand: {
    color: PRIMARY,
    fontSize: 8,
    fontFamily: BASE_FONT,
    fontWeight: 600,
    marginBottom: 3,
  },
  footerLine: {
    fontSize: 7.5,
    fontFamily: BASE_FONT,
    color: DISCLAIMER_COLOR,
    lineHeight: 1.25,
    marginBottom: 1,
  },
})

export type SheetStyle = Style