/** Campo boolean `bestseller` su story product (Storyblok). */
export function isProductBestseller(
  content: Record<string, unknown> | null | undefined,
): boolean {
  const value = content?.bestseller
  return value === true || value === 'true' || value === 1
}
