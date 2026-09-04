'use client'

import classNames from 'classnames/bind'
import Asset, { type StoryblokAsset } from '@/components/atoms/Asset'
import Container from '@/components/atoms/Container'
import HeroTertiary from '@/components/molecules/HeroTertiary'
import DownloadLeadForm from '@/components/organisms/CatalogsDownload/DownloadLeadForm'
import { useTranslations } from 'next-intl'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type DownloadGateProps = {
  title: string
  description?: string
  cover: StoryblokAsset | null
  fileUrl: string
  fileName: string
}

export default function DownloadGate({
  title,
  description,
  cover,
  fileUrl,
  fileName,
}: DownloadGateProps) {
  const t = useTranslations()

  return (
    <section className={cn('wrapper')}>
      <Container className={cn('content')} flushBlock>
        <HeroTertiary title={title} subtitle={description} as="h1" />
        <div className={cn('layout')}>
          {cover ? (
            <div className={cn('cover')}>
              <Asset asset={cover} size="m" />
            </div>
          ) : null}
          <div className={cn('formWrap')}>
            <p className={cn('fileHint')}>{fileName}</p>
            <p className={cn('formTitle')}>{t('download_selected_file')}</p>
            <DownloadLeadForm fileUrl={fileUrl} />
          </div>
        </div>
      </Container>
    </section>
  )
}
