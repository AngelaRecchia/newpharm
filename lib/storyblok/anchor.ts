/** ID HTML per anchor link (#sezione) da campo Storyblok anchor_id */
export function getStoryblokAnchorId(anchorId?: string | null): string | undefined {
  if (anchorId == null) return undefined
  const id = anchorId.trim()
  return id.length > 0 ? id : undefined
}
