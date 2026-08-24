import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import Container from '@/components/atoms/Container'
import type { DividerStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const Divider = ({ blok }: { blok?: DividerStoryblok }) => {
  if (!blok) return null

  const line = <hr className={cn('line')} />

  return (
    <div className={cn('wrapper')} {...storyblokEditable(blok as never)}>
      {blok.padding ? (
        <Container flushBlock>{line}</Container>
      ) : (
        line
      )}
    </div>
  )
}

export default Divider
