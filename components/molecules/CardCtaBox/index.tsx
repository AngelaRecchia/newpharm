import { Card_cta_boxStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Button from '@/components/atoms/Button';
import SmartLink from '@/components/atoms/SmartLink';
import Asset from '@/components/atoms/Asset';
import { isEmpty, getFirstValidLink } from '@/lib/api/utils/links';
import { parseLinkAction } from '@/lib/link-action';

const cn = classNames.bind(styles);


const CardCtaBox = ({ blok }: { blok?: Card_cta_boxStoryblok }) => {
    if (!blok) return <></>;

    const { title, link, image, color } = blok;
    const validLink = getFirstValidLink(link);
    const action = parseLinkAction(validLink?.action);
    const isHref = Boolean(validLink && action.type === 'link');
    const hasImage = image && !isEmpty(image.filename);

    const Tag = isHref ? SmartLink : 'div';
    const props = isHref && validLink ? { link: validLink.link } : {};
    return (
        <Tag className={cn('wrapper', color, { hasImage })} {...storyblokEditable(blok as any)} {...props}>

            {hasImage && <Asset asset={image} size="l" overlay />}

            <div className={cn('content')}>
                {!isEmpty(title) && <h2 className={cn('title')}>{title}</h2>}
                {validLink && (
                    <Button
                        link={validLink}
                        inert={isHref}
                        variant={color === 'black' ? 'primary' : 'secondary'}
                    />
                )}
            </div>
        </Tag>
    )
}

export default CardCtaBox