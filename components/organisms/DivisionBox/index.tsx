import { Division_boxStoryblok } from '@/types/storyblok';
import { storyblokEditable } from '@storyblok/react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Button from '@/components/atoms/Button';
import DivisionCard from '@/components/atoms/DivisionCard';

const cn = classNames.bind(styles);

const DivisionBox = ({ blok }: { blok?: Division_boxStoryblok }) => {
    if (!blok) return <></>;

    const { title, link, cards } = blok;

    return (
        <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                <div className={cn('head')}>
                    <h2 className={cn('title')}>{title}</h2>
                    {link?.length > 0 && link[0] && <Button link={link[0].link} label={link[0].label} />}
                </div>

                <div className={cn('cards')}>
                    {cards?.map((card) => (
                        <DivisionCard key={card._uid} card={card} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DivisionBox;