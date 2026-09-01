export const GRID_EASE = [0.4, 0, 0.2, 1] as const
export const GRID_STAGGER = 0.04

export function getGridMotion(index: number, reduceMotion: boolean | null) {
  const delay = reduceMotion ? 0 : index * GRID_STAGGER
  const duration = reduceMotion ? 0.01 : 0.35

  return {
    layout: !reduceMotion,
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        opacity: { duration, ease: GRID_EASE, delay },
        y: { duration, ease: GRID_EASE, delay },
      },
    },
    exit: {
      opacity: 0,
      y: reduceMotion ? 0 : -8,
      transition: {
        duration: reduceMotion ? 0.01 : 0.2,
        ease: GRID_EASE,
      },
    },
    transition: {
      layout: {
        duration: reduceMotion ? 0.01 : 0.4,
        ease: GRID_EASE,
      },
    },
  }
}

export function getEmptyMotion(reduceMotion: boolean | null) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
    transition: {
      duration: reduceMotion ? 0.01 : 0.3,
      ease: GRID_EASE,
    },
  }
}
