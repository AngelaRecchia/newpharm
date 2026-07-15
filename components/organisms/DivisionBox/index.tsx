'use client';

import { useRef } from 'react';
import { Division_boxStoryblok } from '@/types/storyblok';
import { storyblokEditable } from '@storyblok/react'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import Button from '@/components/atoms/Button';
import DivisionCard from '@/components/molecules/DivisionCard';
import { isEmpty, getFirstValidLink } from '@/lib/api/utils/links';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';

const cn = classNames.bind(styles);

const DivisionBox = ({ blok }: { blok?: Division_boxStoryblok }) => {
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    if (!blok) return <></>;

    const { title, link, cards } = blok;
    const hasTitle = !isEmpty(title);
    const validLink = getFirstValidLink(link);

    if (!cards?.length) return <></>;

    return (
        <section className={cn('wrapper')} id={getStoryblokAnchorId(blok.anchor_id)} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                <div className={cn('head')}>
                    {hasTitle && <h2 className={cn('title')}>{title}</h2>}
                    {validLink && <Button link={validLink.link} label={validLink.label} />}
                </div>

                <div className={cn('carousel-wrapper')}>
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={16}
                        slidesPerView="auto"
                        className={cn('swiper')}
                        onInit={(swiper) => {
                            if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                                swiper.params.navigation.prevEl = prevRef.current;
                                swiper.params.navigation.nextEl = nextRef.current;
                            }
                            swiper.navigation.init();
                            swiper.navigation.update();
                        }}
                    >
                        {cards.map((card) => (
                            <SwiperSlide key={card._uid} className={cn('swiper-slide')}>
                                <DivisionCard card={card} />
                            </SwiperSlide>
                        ))}

                        <div className={cn('buttons-wrapper')}>
                            <Button
                                ref={prevRef}
                                className={cn('button-prev')}
                                icon="chevron-left"
                                variant="tertiary"
                                weight="normal"
                                animated
                                aria-label="Slide precedente"
                            />
                            <Button
                                ref={nextRef}
                                className={cn('button-next')}
                                icon="chevron-right"
                                variant="tertiary"
                                weight="normal"
                                animated
                                aria-label="Slide successiva"
                            />
                        </div>
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default DivisionBox;
