'use client';

import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import CardNews from '@/components/molecules/CardNews';
import CardListing from '@/components/molecules/CardListing';
import { RelatedStory } from '@/lib/api/storyblok/stories';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import { isEmpty, isLinkEmpty, type StoryblokLink } from '@/lib/api/utils/links';
import {
  Card_listing_editorialStoryblok,
  CarouselStoryblok,
} from '@/types/storyblok';
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor';
import { storyblokEditable } from '@storyblok/react';
import { resolveCarouselItemsAction } from '@/lib/carousel/actions';
import { parseCarouselVariant } from '@/lib/carousel/parseCarouselVariant';
import { mapStoryToNewsCard } from '@/lib/carousel/mapStoryToNewsCard';
import { mapProductStoryToCard } from '@/lib/listing/mapProductToCard';
import type { ListingStoryResolved } from '@/lib/listing/types';

const cn = classNames.bind(styles);

interface CarouselProps {
    blok?: CarouselStoryblok;
    title?: string;
    subtitle?: string;
    link?: CarouselStoryblok['link'];
    items?: RelatedStory[];
    variant?: 'news';
    anchor_id?: string | null;
}

function getCarouselDestination(
    link: CarouselStoryblok['link'],
): StoryblokLink | null {
    if (!link) return null

    if (Array.isArray(link)) {
        const first = link[0]
        if (!first || typeof first !== 'object') return null
        if ('link' in first) {
            const nested = (first as { link?: StoryblokLink }).link
            return nested && !isLinkEmpty(nested) ? nested : null
        }
        return isLinkEmpty(first as StoryblokLink) ? null : (first as StoryblokLink)
    }

    if (typeof link === 'object' && 'link' in link) {
        const nested = (link as { link?: StoryblokLink }).link
        return nested && !isLinkEmpty(nested) ? nested : null
    }

    return isLinkEmpty(link as StoryblokLink) ? null : (link as StoryblokLink)
}

const Carousel = ({ blok, title, subtitle, link, items = [], variant, anchor_id }: CarouselProps) => {
    const resolvedTitle = title ?? blok?.title ?? undefined;
    const resolvedSubtitle = subtitle ?? blok?.subtitle ?? undefined;
    const resolvedLink = link ?? blok?.link ?? undefined;
    const resolvedAnchorId = getStoryblokAnchorId(anchor_id ?? blok?.anchor_id);
    const format = useFormatter();
    const t = useTranslations('');
    const locale = useLocale();
    const isRelatedNews = variant === 'news';
    const parsedVariant = isRelatedNews ? null : parseCarouselVariant(blok?.variant);
    const navId = blok?._uid ?? 'related';
    const hasSsrItems = Array.isArray(blok?.resolved_items);
    const [fallbackItems, setFallbackItems] = useState<ListingStoryResolved[] | null>(null);
    const resolvedItems = (hasSsrItems ? blok?.resolved_items : fallbackItems) ?? [];
    const variantKey = JSON.stringify(blok?.variant ?? null);

    useEffect(() => {
        if (isRelatedNews || hasSsrItems) return;
        if (parsedVariant?.variant === 'editorial') return;

        let cancelled = false;
        resolveCarouselItemsAction(variantKey === 'null' ? null : JSON.parse(variantKey), locale).then((items) => {
            if (!cancelled) setFallbackItems(items);
        });

        return () => {
            cancelled = true;
        };
    }, [isRelatedNews, hasSsrItems, parsedVariant?.variant, variantKey, locale]);

    const computedTitle = useMemo(() => {
        if (isRelatedNews) {
            return t('news');
        }
        return resolvedTitle;
    }, [isRelatedNews, resolvedTitle, t]);

    const computedRelatedHref = useMemo(() => {
        if (!isRelatedNews || items.length === 0) return undefined;
        const firstItem = items[0];
        if (!firstItem?.full_slug) return undefined;
        const slugParts = firstItem.full_slug.split('/');
        slugParts.pop();
        return slugParts.join('/');
    }, [isRelatedNews, items]);

    const newsCards = useMemo(() => {
        if (isRelatedNews) return items;
        if (parsedVariant?.variant !== 'story') return [];
        return resolvedItems.map(mapStoryToNewsCard);
    }, [isRelatedNews, items, parsedVariant?.variant, resolvedItems]);

    const productCards = useMemo(() => {
        if (parsedVariant?.variant !== 'prodotto') return [];
        return resolvedItems.map((story: ListingStoryResolved) =>
            mapProductStoryToCard(story),
        );
    }, [parsedVariant?.variant, resolvedItems]);

    const editorialCards = (
        parsedVariant?.variant === 'editorial'
            ? (blok?.cards ?? [])
            : []
    ) as Card_listing_editorialStoryblok[];

    const hasSlides =
        newsCards.length > 0 || productCards.length > 0 || editorialCards.length > 0;

    if (!hasSlides) {
        return null;
    }

    const carouselDestination = isRelatedNews ? null : getCarouselDestination(resolvedLink);
    const showBlokCta = Boolean(carouselDestination);
    const showRelatedCta = isRelatedNews && Boolean(computedRelatedHref);

    return (
        <section
            className={cn('wrapper')}
            id={resolvedAnchorId}
            {...(blok ? storyblokEditable(blok as never) : {})}
        >
            <div className={cn('container')}>
                <div className={cn('header-wrapper')}>
                    <div className={cn('header')}>
                        {computedTitle && <h2 className={cn('title')}>{computedTitle}</h2>}
                        {!isEmpty(resolvedSubtitle) && <p className={cn('subtitle')}>{resolvedSubtitle}</p>}

                        {showRelatedCta && (
                            <Button href={computedRelatedHref} label={computedTitle} />
                        )}
                        {showBlokCta && (
                            <Button link={carouselDestination} label={t('load_more')} />
                        )}
                    </div>

                    <div className={cn('buttons-wrapper')}>
                        <Button className={`carousel-prev-${navId}`} icon='chevron-left' variant='tertiary' weight='normal' animated={true} />
                        <Button className={`carousel-next-${navId}`} icon='chevron-right' variant='tertiary' weight='normal' animated={true} />
                    </div>
                </div>

                <div className={cn('carousel-wrapper')}>
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={16}
                        slidesPerView="auto"
                        navigation={{
                            nextEl: `.carousel-next-${navId}`,
                            prevEl: `.carousel-prev-${navId}`,
                        }}
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
                        {newsCards.map((item) => {
                            const image = item.asset?.length > 0 && item.asset[0] ? item.asset[0] : null;
                            const tags = item.tag
                                ? (typeof item.tag === 'string' ? [item.tag] : item.tag)
                                : [];
                            const formattedDate = item.date
                                ? format.dateTime(new Date(item.date), { dateStyle: 'long' })
                                : '';

                            return (
                                <SwiperSlide key={item.full_slug} className={cn('swiper-slide')}>
                                    <CardNews
                                        title={item.title || ''}
                                        subtitle={formattedDate}
                                        image={image}
                                        href={item.full_slug}
                                        tags={tags}
                                    />
                                </SwiperSlide>
                            );
                        })}

                        {productCards.map((card, index) => (
                            <SwiperSlide key={card.uuid ?? `${card.href}-${index}`} className={cn('swiper-slide')}>
                                <CardListing
                                    title={card.title}
                                    description={card.description}
                                    image={card.image}
                                    href={card.href}
                                />
                            </SwiperSlide>
                        ))}

                        {editorialCards.map((card) => (
                            <SwiperSlide key={card._uid} className={cn('swiper-slide')}>
                                <CardListing
                                    title={card.title}
                                    subtitle={card.subtitle}
                                    description={card.description}
                                    image={card.image}
                                    link={card.link}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default Carousel;
