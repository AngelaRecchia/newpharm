import { Division_boxStoryblok } from '@/types/storyblok';
import { storyblokEditable } from '@storyblok/react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Button from '@/components/atoms/Button';
import DivisionCard from '@/components/molecules/DivisionCard';
import { isEmpty, getFirstValidLink } from '@/lib/api/utils/links';

const cn = classNames.bind(styles);

const DivisionBox = ({ blok }: { blok?: Division_boxStoryblok }) => {
    if (!blok) return <></>;

    const { title, link, cards } = blok;
    const hasTitle = !isEmpty(title);
    const validLink = getFirstValidLink(link);

    return (
        <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                <div className={cn('head')}>
                    {hasTitle && <h2 className={cn('title')}>{title}</h2>}
                    {validLink && <Button link={validLink.link} label={validLink.label} />}
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