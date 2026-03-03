import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { Split_bannerStoryblok } from '@/types/storyblok';
import { storyblokEditable } from '@storyblok/react';
import Asset from '@/components/atoms/Asset';
const cn = classNames.bind(styles);

const SplitBanner = ({ blok }: { blok: Split_bannerStoryblok }) => {
    if (!blok) return <></>;
    const { items } = blok;
    const hasMultiple = items && items.length > 1;

    return (
        <section className={cn('wrapper', hasMultiple && 'has-multiple')} {...storyblokEditable(blok as any)}>
            {items?.map((item) => (
                <div key={item._uid} className={cn('item')}>
                    <Asset asset={item} size="l" mode={hasMultiple ? 'bg' : 'fit'} overlay />
                </div>
            ))}
        </section>
    )
}

export default SplitBanner