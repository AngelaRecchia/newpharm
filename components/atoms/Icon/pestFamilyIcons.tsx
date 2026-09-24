import { PEST_FAMILIES, type PestFamily, type PestIconType } from '@/lib/insects/families'
import styles from './index.module.scss'

/** Famiglie con icona vettoriale (le PNG originali erano 25–36px e si sgranavano). */
const PEST_SVG_FAMILIES = new Set<PestFamily>([
  'blatte',
  'formiche',
  'mosche',
  'vespe',
  'zanzare',
])

function pestIconSrc(family: PestFamily): string {
  const ext = PEST_SVG_FAMILIES.has(family) ? 'svg' : 'png'
  return `/icons/pests/${family}.${ext}`
}

/** Icone famiglia infestante in /public/icons/pests. */
export const pestFamilyIcons = Object.fromEntries(
  PEST_FAMILIES.map((family) => {
    const iconKey = `pest-${family}` as PestIconType
    return [
      iconKey,
      <span
        key={iconKey}
        className={styles.pest}
        aria-hidden
        style={{
          WebkitMaskImage: `url(${pestIconSrc(family)})`,
          maskImage: `url(${pestIconSrc(family)})`,
        }}
      />,
    ]
  }),
) as Record<PestIconType, JSX.Element>
