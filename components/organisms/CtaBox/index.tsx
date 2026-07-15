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

    const { cards } = blok;

    return (
        <section
            className={cn('wrapper')}
            id={getStoryblokAnchorId(blok.anchor_id)}
            data-cta-box
            {...storyblokEditable(blok as any)}
            style={{ '--cards-count': cards?.length || 0 } as React.CSSProperties}
        >

            {cards?.map((card) => (
                <CardCtaBox key={card._uid} blok={card} />
            ))}

        </section>
    );
}

export default CtaBox;