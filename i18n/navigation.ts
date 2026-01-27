import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Navigation APIs with automatic locale handling
 * 
 * These are lightweight wrappers around Next.js navigation APIs that:
 * - Automatically handle the user's locale
 * - Provide type-safe navigation
 * - Support locale switching
 * 
 * Usage:
 * ```tsx
 * import { Link, useRouter, usePathname } from '@/i18n/navigation'
 * 
 * // In components
 * <Link href="/about">About</Link>
 * 
 * // Programmatic navigation
 * const router = useRouter()
 * router.push('/about')
 * 
 * // Get current pathname (without locale prefix)
 * const pathname = usePathname()
 * ```
 * 
 * @see https://next-intl.dev/docs/routing/navigation
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
