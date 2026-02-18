import { AssetStoryblok, LinkStoryblok } from '@/types/storyblok';
import React from 'react'
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Asset from '@/components/atoms/Asset';
import SmartLink from '@/components/atoms/SmartLink';
import { StoryblokLink } from '@/lib/api/utils/links';
import Tag from '@/components/atoms/Tag';
import { useTranslations } from 'next-intl';
const cn = classNames.bind(styles);

const CardNews = ({ title, subtitle, image, href, tags }: {
    title: string, subtitle: string, image: AssetStoryblok | null,
    href: string, tags: string[]
}) => {

    const t = useTranslations('');

    return <SmartLink href={href} className={cn('wrapper')}>

        <div className={cn('image')}>
            <Asset asset={image} size='s' overlay />
        </div>

        {tags.length > 0 && (
            <div className={cn('tags')}>
                {tags.map((tag) => (
                    <Tag key={tag} tag={t(tag)} variant='primary' />
                ))}
            </div>
        )}

        <div className={cn('content-wrapper')}>
            <div className={cn('content')}>
                <h3 className={cn('title')}>{title}</h3>
                <p className={cn('subtitle')}>{subtitle}</p>
            </div>
        </div>
    </SmartLink>;
}

export default CardNews;