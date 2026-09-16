import { Cta_boxStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react';
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Button from '@/components/atoms/Button';
import CardCtaBox from '@/components/molecules/CardCtaBox';

const cn = classNames.bind(styles);


const CtaBox = ({ blok }: { blok?: Cta_boxStoryblok }) => {


    if (!blok) return <></>;

    const { cards, theme } = blok;
    const isDark = theme === 'dark';

    return (
        <section
            className={cn('wrapper', { dark: isDark })}
            id={getStoryblokAnchorId(blok.anchor_id)}
            data-cta-box
            {...storyblokEditable(blok as any)}
            style={{ '--cards-count': cards?.length || 0 } as React.CSSProperties}
        >
            <div className={cn('container')}>
                {cards?.map((card, index) => (
                    <CardCtaBox key={card._uid ?? `cta-card-${index}`} blok={card} dark={isDark} />
                ))}
            </div>
        </section>
    );
}

export default CtaBox;