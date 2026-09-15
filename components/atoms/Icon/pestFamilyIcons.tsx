import { PEST_FAMILIES, type PestIconType } from '@/lib/insects/families'

/** Icone famiglia infestante (PNG in /public/icons/pests). */
export const pestFamilyIcons = Object.fromEntries(
  PEST_FAMILIES.map((family) => {
    const iconKey = `pest-${family}` as PestIconType
    return [
      iconKey,
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={iconKey}
        src={`/icons/pests/${family}.png`}
        alt=""
        width={24}
        height={24}
        aria-hidden
        draggable={false}
      />,
    ]
  }),
) as Record<PestIconType, JSX.Element>
