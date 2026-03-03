import { Card_cta_boxStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Button from '@/components/atoms/Button';
import SmartLink from '@/components/atoms/SmartLink';
import Asset from '@/components/atoms/Asset';
const cn = classNames.bind(styles);


const CardCtaBox = ({ blok }: { blok?: Card_cta_boxStoryblok }) => {
    if (!blok) return <></>;

    const { title, link, image, color } = blok;
    const hasLink = link && link.length > 0 && link[0];

    const Tag = hasLink ? SmartLink : 'div';
    const props = hasLink ? { link: link[0].link } : {};
    return (
        <Tag className={cn('wrapper', color, { hasImage: image && image.filename.length > 0 })} {...storyblokEditable(blok as any)} {...props}>

            {image && image.filename.length > 0 && <Asset asset={image} size="l" overlay />}

            <div className={cn('content')}>
                <h2 className={cn('title')}>{title}</h2>
                {hasLink && < Button label={link[0].label} variant={color === 'black' ? 'primary' : 'secondary'} />}
            </div>
        </Tag>
    )
}

export default CardCtaBox