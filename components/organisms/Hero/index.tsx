'use client';
import { HeroStoryblok } from '@/types/storyblok';
import Asset from '@/components/atoms/Asset';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
import { useMemo } from 'react';
import AnchorLink from '@/components/atoms/AnchorLink';
import Button from '@/components/atoms/Button';

import { getLinkUrl } from '@/lib/api/utils/links';
import { storyblokEditable } from '@storyblok/react';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';

const cn = classNames.bind(styles);


export default function HeroComponent({ blok }: { blok?: HeroStoryblok }) {

    if (!blok) return <></>;

    const { title, subtitle, background, links, variant } = blok;
    console.log(links?.[0]?.link?.anchor);
    const renderLinks = useMemo(() => {
        if (variant === 'primary') {
            return links?.map((link) => (
                <Button key={link._uid} href={getLinkUrl(link.link) || ''} label={link.label} variant='secondary' />
            ))
        } else if (variant === 'secondary') {

            return <Swiper spaceBetween={8} slidesPerView='auto' className={cn('swiper')}>
                {links?.map((link) => (
                    <SwiperSlide key={link._uid} className={cn('swiper-slide')}>

                        <AnchorLink key={link._uid} link={link.link} label={link.label} description={link.description} />
                    </SwiperSlide>
                ))}
            </Swiper>
        }
    }, [links, variant])
    return (
        <section className={cn('wrapper', variant)} {...storyblokEditable(blok as any)}>


            {variant !== 'tertiary' && background?.filename ?
                <div className={cn('background')}>
                    <Asset src={background?.filename} alt={background?.alt} />
                </div>
                : null}

            <div className={cn('container')}>

                <div className={cn('content')}>
                    <h1 className={cn('title')}>{title}</h1>
                    <p className={cn('subtitle')}>{subtitle}</p>
                </div>

                {links && links.length > 0 && (
                    <div className={cn('links')}>
                        {renderLinks}
                    </div>
                )}

            </div>
        </section>
    )
}