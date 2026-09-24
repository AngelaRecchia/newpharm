'use client'

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useRouter } from '@/i18n/navigation'
import { internalPathFromHref } from '@/lib/view-transition/navigationPath'
import { storeProductFlip } from '@/lib/view-transition/productFlip'
import {
  productImageViewTransitionName,
  shouldUseProductImageTransition,
} from '@/lib/view-transition/productImage'

type ProductViewTransitionContextValue = {
  navigateToProduct: (
    href: string,
    productUuid: string,
    sourceImageEl?: HTMLElement | null,
  ) => void
}

const ProductViewTransitionContext =
  createContext<ProductViewTransitionContextValue | null>(null)

function findSourceImage(
  productUuid: string,
  sourceImageEl?: HTMLElement | null,
): HTMLElement | null {
  if (sourceImageEl) return sourceImageEl
  if (typeof document === 'undefined') return null
  return document.querySelector(
    `[data-vt-product-image="${productUuid}"]:not([data-vt-product-hero])`,
  )
}

function prepareSourceSnapshot(source: HTMLElement, vtName: string) {
  source.style.viewTransitionName = vtName
  const scaled = source.querySelector<HTMLElement>('[data-asset], img, picture')
  if (scaled) {
    scaled.style.transform = 'none'
  }
}

function clearSourceSnapshot(source: HTMLElement | null) {
  if (!source) return
  source.style.viewTransitionName = ''
}

export function ProductViewTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const navigateToProduct = useCallback(
    (href: string, productUuid: string, sourceImageEl?: HTMLElement | null) => {
      const targetPath = internalPathFromHref(href)
      const source = findSourceImage(productUuid, sourceImageEl)

      if (source) {
        storeProductFlip(productUuid, source.getBoundingClientRect())
      }

      const useVt = shouldUseProductImageTransition() && Boolean(source)
      let vtName: string | undefined

      if (useVt && source) {
        vtName = productImageViewTransitionName(productUuid)
        prepareSourceSnapshot(source, vtName)
      }

      const push = () => {
        startTransition(() => {
          router.push(targetPath)
        })
      }

      if (useVt && typeof document.startViewTransition === 'function') {
        const transition = document.startViewTransition(() => {
          push()
        })
        void transition.finished.finally(() => {
          clearSourceSnapshot(source)
        })
      } else {
        push()
      }
    },
    [router],
  )

  const value = useMemo(
    () => ({ navigateToProduct }),
    [navigateToProduct],
  )

  return (
    <ProductViewTransitionContext.Provider value={value}>
      {children}
    </ProductViewTransitionContext.Provider>
  )
}

export function useProductViewTransition() {
  return useContext(ProductViewTransitionContext)
}
