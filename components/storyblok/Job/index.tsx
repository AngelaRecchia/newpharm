'use client'

import dynamic from 'next/dynamic'
import classNames from 'classnames/bind'
import { StoryblokComponent, storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import Tag from '@/components/atoms/Tag'
import CtaBox from '@/components/organisms/CtaBox'
import Divider from '@/components/organisms/Divider'
import { getJobExperienceLabel } from '@/lib/jobs/experience'
import { JOB_PAGE_CTA_BOX } from '@/lib/jobs/jobPageCtaBox'
import { JOB_DESCRIPTION_DIVIDER } from '@/lib/jobs/jobPageDivider'
import { isEmpty } from '@/lib/api/utils/links'
import type { JobStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const Carousel = dynamic(() => import('@/components/organisms/Carousel'))

const cn = classNames.bind(styles)

export default function Job({ blok }: { blok: JobStoryblok }) {
  const t = useTranslations('')
  const { title, short_description, area, esperienza, description, latest_stories } = blok
  const experienceLabel = getJobExperienceLabel(esperienza)
  const hasTitle = !isEmpty(title)
  const hasShortDescription = !isEmpty(short_description)
  const metaItems = [area, experienceLabel].filter(Boolean)
  const descriptionBlocks = description ?? []
  const hasDescription = descriptionBlocks.length > 0
  const hasLatestStories = (latest_stories?.length ?? 0) > 0
  const showDescriptionDivider = hasShortDescription && hasDescription

  return (
    <div {...storyblokEditable(blok as never)}>
      <div className={cn('hero-text')}>
        <div className={cn('content')}>
          <div className={cn('tags')}>
            <Tag tag={t('open_position')} variant="secondary" />
          </div>
          {hasTitle ? <h1 className={cn('title')}>{title}</h1> : null}

          {metaItems.length > 0 ? (
            <div className={cn('info')}>
              {metaItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}

          {hasShortDescription ? (
            <p className={cn('lead')}>{short_description}</p>
          ) : null}
        </div>
      </div>

      {showDescriptionDivider ? <Divider blok={JOB_DESCRIPTION_DIVIDER} /> : null}

      <div className={cn('description')}>
        {descriptionBlocks.map((nestedBlok, index) => (
          <StoryblokComponent
            key={`${nestedBlok._uid}-${index}`}
            blok={nestedBlok}
          />
        ))}
      </div>

      <CtaBox blok={JOB_PAGE_CTA_BOX} />

      {hasLatestStories ? (
        <div className={cn('carousel')}>
          <Carousel variant="news" items={latest_stories ?? []} />
        </div>
      ) : null}
    </div>
  )
}
