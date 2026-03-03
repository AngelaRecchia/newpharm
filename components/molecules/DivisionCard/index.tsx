'use client';

import SmartLink from '@/components/atoms/SmartLink';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Asset from '@/components/atoms/Asset';
import { Card_divisionStoryblok } from '@/types/storyblok';

const cn = classNames.bind(styles);

interface DivisionCardProps {
    card: Card_divisionStoryblok;
}

const DivisionCard = ({ card }: DivisionCardProps) => {

    const cardContent = (
        <>
            <div className={cn('card-cover')}>
                {card.image && (
                    <>

                        <Asset asset={card.image} />

                        <div className={cn('card-overlay')} />
                    </>
                )}

                <div className={cn('card-info')}>

                    {card.label && (
                        <div className={cn('card-label')}>{card.label}</div>
                    )}

                    {card.number && (
                        <div className={cn('card-number')}>{card.number}</div>
                    )}
                </div>
            </div>
            {card.title && (
                <div className={cn('card-footer')}>
                    <div className={cn('card-dot')} />
                    <h3 className={cn('card-title')}>{card.title}</h3>
                </div>
            )}
        </>
    );

    if (card.link) {
        return (
            <SmartLink
                link={card.link}
                className={cn('card', 'cardLink')}
            >
                {cardContent}
            </SmartLink>
        );
    }

    return (
        <div className={cn('card')}>
            {cardContent}
        </div>
    );
};

export default DivisionCard;
