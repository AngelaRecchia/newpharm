'use client'

import { type MutableRefObject, type ReactNode, useEffect, useRef } from 'react'
import classNames from 'classnames/bind'
import { FreeMode, Mousewheel } from 'swiper/modules'
import { Swiper, type SwiperClass, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import type { FilterChipSize } from '@/components/atoms/FilterChip'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

/** Gap track: `s` più stretto (search), `m` come product/stories. */
const SPACE_BY_SIZE: Record<'s' | 'm', { base: number; md: number }> = {
  s: { base: 8, md: 12 },
  m: { base: 12, md: 16 },
}

function resolveTrackSize(size: FilterChipSize): 's' | 'm' {
  return size === 'm' || size === 'large' ? 'm' : 's'
}

export type ChipSwiperProps = {
  children: ReactNode
  className?: string
  size?: FilterChipSize
  /** Espone l’istanza Swiper (es. slideTo al select). */
  swiperRef?: MutableRefObject<SwiperClass | null>
}

export function ChipSwiperSlide({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <SwiperSlide className={cn('slide', className)}>{children}</SwiperSlide>
}
/** Swiper React riconosce solo i figli con displayName === 'SwiperSlide'. */
ChipSwiperSlide.displayName = 'SwiperSlide'

/** Track orizzontale condiviso (bleed container) per chip filter / tab / suggest. */
export default function ChipSwiper({
  children,
  className,
  size = 's',
  swiperRef,
}: ChipSwiperProps) {
  const localRef = useRef<SwiperClass | null>(null)
  const space = SPACE_BY_SIZE[resolveTrackSize(size)]

  useEffect(() => {
    return () => {
      if (swiperRef) swiperRef.current = null
    }
  }, [swiperRef])

  return (
    // Niente data-lenis-prevent: spegnerebbe lo smooth scroll verticale della pagina
    // mentre il mouse è sulle chip (anche senza overflow orizzontale).
    <div className={cn('track', className)}>
      <Swiper
        className={cn('swiper')}
        modules={[FreeMode, Mousewheel]}
        freeMode
        grabCursor
        mousewheel={{
          forceToAxis: true,
          // Con overflow assente o ai bordi, la rotella torna alla pagina.
          releaseOnEdges: true,
          sensitivity: 1,
        }}
        slidesPerView="auto"
        spaceBetween={space.base}
        breakpoints={{ 768: { spaceBetween: space.md } }}
        onSwiper={(swiper) => {
          localRef.current = swiper
          if (swiperRef) swiperRef.current = swiper

          const syncMousewheel = () => {
            // Senza overflow orizzontale lo wheel deve restare alla pagina (Lenis).
            if (swiper.isLocked) swiper.mousewheel.disable()
            else swiper.mousewheel.enable()
          }

          requestAnimationFrame(() => {
            swiper.update()
            syncMousewheel()
          })
          swiper.on('resize', syncMousewheel)
          swiper.on('update', syncMousewheel)
        }}
      >
        {children}
      </Swiper>
    </div>
  )
}
