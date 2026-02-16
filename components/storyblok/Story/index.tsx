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
const cn = classNames.bind(styles);


const Story = ({ blok }: { blok: StoryStoryblok }) => {

    const t = useTranslations('');
    const { title, author, reading_time, date, tag, asset, article, body } = blok;
    const format = useFormatter();
    const dateTime = date ? new Date(date) : null;
    const formattedDate = dateTime ? format.dateTime(dateTime, { dateStyle: 'medium' }) : null;

    const tags = useMemo(() => typeof tag === 'string' ? [tag] : tag || [], [tag]);

    console.log(article)
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
        </div>
    )
}

export default Story




