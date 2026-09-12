import React from 'react'

type RichTextMark = {
  type: string
  attrs?: Record<string, unknown> | null
}

function getLinkHref(attrs?: Record<string, unknown> | null): string | undefined {
  if (!attrs) return undefined

  const linktype = attrs.linktype as string | undefined
  const href = attrs.href as string | undefined
  const anchor = attrs.anchor as string | undefined

  switch (linktype) {
    case 'email':
      return href ? `mailto:${href}` : undefined
    case 'story':
      if (!href) return undefined
      return anchor ? `${href}#${anchor}` : href
    default:
      return href
  }
}

export function applyRichTextMarks(
  marks: RichTextMark[],
  content: React.ReactNode,
): React.ReactNode {
  return marks.reduce<React.ReactNode>((current, mark) => {
    switch (mark.type) {
      case 'bold':
      case 'strong':
        return React.createElement('strong', null, current)
      case 'italic':
        return React.createElement('em', null, current)
      case 'underline':
        return React.createElement('u', null, current)
      case 'strike':
        return React.createElement('s', null, current)
      case 'code':
        return React.createElement('code', null, current)
      case 'superscript':
        return React.createElement('sup', null, current)
      case 'subscript':
        return React.createElement('sub', null, current)
      case 'link':
      case 'anchor': {
        const href = getLinkHref(mark.attrs)
        const target = mark.attrs?.target as string | undefined
        if (!href) return current
        return React.createElement(
          'a',
          {
            href,
            target,
            rel: target === '_blank' ? 'noopener noreferrer' : undefined,
          },
          current,
        )
      }
      case 'styled': {
        const className = mark.attrs?.class as string | undefined
        return React.createElement('span', { className }, current)
      }
      case 'highlight': {
        const color = mark.attrs?.color as string | undefined
        return React.createElement(
          'mark',
          { style: color ? { backgroundColor: color } : undefined },
          current,
        )
      }
      case 'textStyle': {
        const color = mark.attrs?.color as string | undefined
        return React.createElement(
          'span',
          { style: color ? { color } : undefined },
          current,
        )
      }
      default:
        return current
    }
  }, content)
}
