type RichTextNode = {
  type?: string
  text?: string
  content?: RichTextNode[]
}

/**
 * Verifica se un documento richtext Storyblok/ProseMirror contiene testo non vuoto.
 * Un doc con solo `{ type: 'paragraph' }` senza nodi text viene considerato vuoto.
 */
export function hasRichTextContent(
  node: RichTextNode | null | undefined
): boolean {
  if (!node || typeof node !== 'object') return false
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text.trim().length > 0
  }
  if (Array.isArray(node.content)) {
    return node.content.some(hasRichTextContent)
  }
  return false
}
