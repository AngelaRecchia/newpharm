import type { ReactNode } from 'react'
import SmartLink from '@/components/atoms/SmartLink'

export function renderTermsMessage(
  message: string,
  href = '/termini',
): ReactNode {
  const match = message.match(/<a(?:\s[^>]*)?>([\s\S]*?)<\/a>/i)
  if (!match) return message

  const [tag, label] = match
  const [before, after] = message.split(tag)
  return (
    <>
      {before}
      <SmartLink href={href}>{label}</SmartLink>
      {after}
    </>
  )
}
