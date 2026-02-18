'use client';


import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import CardNews from '@/components/molecules/CardNews';
import { RelatedStory } from '@/lib/api/storyblok/stories';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import Button from '@/components/atoms/Button';

const cn = classNames.bind(styles);

interface CarouselProps {

    title?: string;
    subtitle?: string;
    link?: any[];
    items: any[];
    variant?: 'news' | 'products' | 'insects';
}

const Carousel = ({ title, subtitle, link, items, variant }: CarouselProps) => {
    const format = useFormatter();
    const t = useTranslations('');

    if (items.length === 0) {
        return <></>;
    }

    // Calcola title e link basati su variant
    const computedTitle = useMemo(() => {
        if (variant === 'news') {
            return t('news');
        }
        return title;
    }, [variant, title, t]);

    const computedLink = useMemo(() => {
        if (variant === 'news' && items.length > 0) {
            const firstItem = items[0] as RelatedStory;
            if (firstItem?.full_slug) {
                // Estrae il padre rimuovendo l'ultimo segmento
                const slugParts = firstItem.full_slug.split('/');
                slugParts.pop(); // Rimuove l'ultimo segmento
                return slugParts.join('/');
            }
        }
        return link
    }, [variant, items, link]);

    return (
        <section className={cn('wrapper')}>
            <div className={cn('container')}>

                <div className={cn('header-wrapper')}>
                    <div className={cn('header')}>
                        {computedTitle && <h2 className={cn('title')}>{computedTitle}</h2>}
                        {subtitle && <p className={cn('subtitle')}>{subtitle}</p>}

                        {computedLink && <Button href={computedLink as string} label={computedTitle} />}
                    </div>


                    <div className={cn('buttons-wrapper')}>
                        <Button className={cn('button-prev')} icon='chevron-left' variant='tertiary' weight='normal' />
                        <Button className={cn('button-next')} icon='chevron-right' variant='tertiary' weight='normal' />
                    </div>
                </div>




                <div className={cn('carousel-wrapper')}>

                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={16}
                        slidesPerView="auto"
                        navigation={{ nextEl: '.button-next', prevEl: '.button-prev' }}

                        breakpoints={{
                            320: {
                                slidesPerView: 1.2,

                            },
                            768: {
                                slidesPerView: 2.5,

                            },
                            1024: {
                                slidesPerView: 3,

                            },
                            1280: {
                                slidesPerView: 4,

                            },
                        }}
                        className={cn('swiper')}
                    >


                        {variant === 'news' && (
                            items.map((item: RelatedStory) => {
                                const url = item.full_slug;
                                const image = item.asset?.length > 0 && item.asset[0] ? item.asset[0] : null;
                                const tags = item.tag ? (typeof item.tag === 'string' ? [item.tag] : item.tag) : [];
                                const formattedDate = item.date
                                    ? format.dateTime(new Date(item.date), { dateStyle: 'long' })
                                    : '';

                                return (
                                    <SwiperSlide key={item.full_slug} className={cn('swiper-slide')}>
                                        <CardNews
                                            title={item.title || ''}
                                            subtitle={formattedDate}
                                            image={image}
                                            href={url}
                                            tags={tags}
                                        />
                                    </SwiperSlide>
                                );
                            }))}

                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default Carousel;
