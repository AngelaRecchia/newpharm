import React from 'react'
import { StoryStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react'

import styles from './index.module.scss';
import classNames from 'classnames/bind';
import Tag from '@/components/atoms/Tag';
import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import FullBanner from '@/components/organisms/FullBanner';
import RichText from '@/components/organisms/RichText';
import { RelatedStory } from '@/lib/api/storyblok/stories';

import Carousel from '@/components/organisms/Carousel';
const cn = classNames.bind(styles);

interface StoryProps {
    blok: StoryStoryblok & {
        related_stories?: RelatedStory[]
    },
    relatedStories: RelatedStory[]
}

const Story = ({ blok, relatedStories }: StoryProps) => {

    const t = useTranslations('');
    const { title, author, reading_time, date, tag, asset, article, body, related_stories } = blok;
    const format = useFormatter();
    const dateTime = date ? new Date(date) : null;
    const formattedDate = dateTime ? format.dateTime(dateTime, { dateStyle: 'medium' }) : null;

    const tags = useMemo(() => typeof tag === 'string' ? [tag] : tag || [], [tag]);

    return (
        <div  {...storyblokEditable(blok as any)}>
            <div className={cn('hero-text')}>
                <div className={cn('content')}>
                    <div className={cn('tags')}>
                        {tags?.map((tag) => (
                            <Tag key={tag} tag={t(tag)} variant='secondary' />
                        ))}
                    </div>
                    {title && title.length > 0 && <h1 className={cn('title')}>{title}</h1>}

                    <div className={cn('info')}>
                        {author && <span className={cn('author')}>{author}</span>}
                        {reading_time && <span className={cn('reading-time')}>{reading_time}</span>}
                        {date && <span className={cn('date')}>{formattedDate}</span>}
                    </div>
                </div>
            </div>


            {asset && asset.length > 0 && (
                <FullBanner blok={{ asset: asset[0], _uid: '1', component: 'full_banner', variant: 'padding' }} />
            )}


            <div className={cn('article')}>
                <RichText content={article} />
            </div>

            {/* Renderizza le story correlate se presenti */}
            {related_stories && related_stories.length > 0 && (
                <div className={cn('related-stories')}>

                    <Carousel items={related_stories} variant='news' />



                </div>
            )}
        </div>
    )
}

export default Story




