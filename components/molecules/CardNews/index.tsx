import { AssetStoryblok } from '@/types/storyblok';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Asset from '@/components/atoms/Asset';
import SmartLink from '@/components/atoms/SmartLink';
import Tag from '@/components/atoms/Tag';
import { useTranslations } from 'next-intl';
import type { MosaicImageRatio } from '@/lib/stories/mosaic';
import { mosaicRatioClass } from '@/lib/stories/mosaic';

const cn = classNames.bind(styles);

const CardNews = ({ title, subtitle, image, href, tags, imageRatio }: {
    title: string, subtitle: string, image: AssetStoryblok | null,
    href: string, tags: string[], imageRatio?: MosaicImageRatio
}) => {

    const t = useTranslations('');
    const mosaic = Boolean(imageRatio);

    return <SmartLink href={href} className={cn('wrapper', { mosaic })}>

        <div className={cn('image', imageRatio ? mosaicRatioClass(imageRatio) : null)}>
            <Asset asset={image} size={mosaic ? 'm' : 's'} overlay />
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
