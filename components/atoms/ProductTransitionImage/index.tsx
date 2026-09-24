'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { productImageViewTransitionName } from '@/lib/view-transition/productImage'
import {
  consumeProductFlip,
  flipTransformFromRect,
} from '@/lib/view-transition/productFlip'

type ProductTransitionImageProps = {
  uuid?: string
  role: 'source' | 'destination'
  className?: string
  children: React.ReactNode
}

const FLIP_EASE = [0.4, 0, 0.2, 1] as const

export default function ProductTransitionImage({
  uuid,
  role,
  className,
  children,
}: ProductTransitionImageProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [flipInitial, setFlipInitial] = useState<{
    x: number
    y: number
    scaleX: number
    scaleY: number
  } | null>(null)

  useLayoutEffect(() => {
    if (role !== 'destination' || !uuid || reduceMotion) return
    const from = consumeProductFlip(uuid)
    if (!from) return
    const el = ref.current
    if (!el) return
    const to = el.getBoundingClientRect()
    setFlipInitial(flipTransformFromRect(from, to))
  }, [role, uuid, reduceMotion])

  if (!uuid) {
    return className ? <div className={className}>{children}</div> : <>{children}</>
  }

  if (role === 'source') {
    return (
      <div className={className} data-vt-product-image={uuid}>
        {children}
      </div>
    )
  }

  const vtName = productImageViewTransitionName(uuid)

  if (flipInitial && !reduceMotion) {
    return (
      <motion.div
        ref={ref}
        className={className}
        data-vt-product-image={uuid}
        data-vt-product-hero
        style={{ viewTransitionName: vtName }}
        initial={{
          x: flipInitial.x,
          y: flipInitial.y,
          scaleX: flipInitial.scaleX,
          scaleY: flipInitial.scaleY,
        }}
        animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1 }}
        transition={{ duration: 0.48, ease: FLIP_EASE }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      ref={ref}
      className={className}
      data-vt-product-image={uuid}
      data-vt-product-hero
      style={{ viewTransitionName: vtName }}
    >
      {children}
    </div>
  )
}
