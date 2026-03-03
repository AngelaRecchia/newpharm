'use client'

import { LinkStoryblok, Social_itemStoryblok, FooterStoryblok } from "@/types/storyblok";
import { ISbRichtext } from "@storyblok/react";
import { storyblokEditable } from '@storyblok/react';
import { useRouter, usePathname } from '@/i18n/navigation'
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl'
import { useRef, useEffect, useState } from 'react'
import styles from './index.module.scss';

import { render } from 'storyblok-rich-text-react-renderer';

import Input from "../../atoms/Input";
import SocialItem from "../../atoms/SocialItem";


import classNames from 'classnames/bind';
import SmartLink from "@/components/atoms/SmartLink";
import { useGlobalSettings } from "@/lib/context/global-settings-context";
import { useViewport } from "@/lib/context/viewport-context";
import Dropdown from "@/components/atoms/Dropdown";
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const cn = classNames.bind(styles);

interface FooterProps {
    blok?: FooterStoryblok;
}

export default function Footer({
    blok,
}: FooterProps) {
    const locale = useLocale()
    const { locales } = useGlobalSettings()
    const params = useParams()
    const pathname = usePathname()
    const t = useTranslations()

    const router = useRouter()
    const footerRef = useRef<HTMLElement>(null)
    const { height: viewportHeight } = useViewport()

    const [pageReady, setPageReady] = useState(false)

    useEffect(() => {
        if (document.readyState === 'complete') {
            setPageReady(true)
        } else {
            const onLoad = () => setPageReady(true)
            window.addEventListener('load', onLoad, { once: true })
            return () => window.removeEventListener('load', onLoad)
        }
    }, [])

    useEffect(() => {

        if (!pageReady || !footerRef.current) return;

        const mainElement = document.querySelector('main.main') as HTMLElement;
        if (!mainElement) return;

        const footer = footerRef.current;
        const footerHeight = footer.offsetHeight;
        const shouldAnimate = footerHeight <= viewportHeight;

        if (!shouldAnimate) {
            gsap.set(footer, { clearProps: 'yPercent' });
            return;
        }

        gsap.set(footer, { yPercent: -100 });

        const uncover = gsap.timeline({ paused: true });
        uncover.to(footer, { yPercent: 0, ease: 'none' });

        const scrollTrigger = ScrollTrigger.create({
            trigger: mainElement,
            start: 'bottom bottom',
            end: () => `+=${footer.offsetHeight}px`,
            animation: uncover,
            scrub: true,
            invalidateOnRefresh: true,
        });

        return () => {
            scrollTrigger.kill();
            uncover.kill();
            gsap.set(footer, { clearProps: 'yPercent' });
        };
    }, [pageReady, viewportHeight, pathname]);

    if (!blok) return null;

    const { newsletter_text, address, items, socials, bottom_links } = blok;

    return (
        <footer
            ref={footerRef}
            className={cn('footer')}
            {...storyblokEditable(blok as any)}
        >
            <div className={cn('newsletter')}>
                <p className={cn('newsletterText')}>{newsletter_text}</p>

                <div className={cn('newsletterInput')}>
                    <Input placeholder="Email" type="email" skin="light" />
                </div>

            </div>


            <div className={cn('content')}>

                <div className={cn('top')}>
                    <address className={cn('address')}>{render(address)}</address>


                    <div className={cn('linksContainer')}>
                        <ul className={cn('links')}>
                            {items?.map((item) => (
                                <li key={item._uid} className={cn('linkItem')}>
                                    <SmartLink className={cn('link')} link={item.link}>{item.label}</SmartLink>
                                </li>
                            ))}
                        </ul>


                        <ul className={cn('socials')}>
                            {socials?.map((social) => (
                                <li key={social._uid}>
                                    <SocialItem item={social} />
                                </li>
                            ))}
                        </ul>

                    </div>

                </div>


                <div className={cn('bottom')}>
                    <span className={cn('copyright')}>© Newpharm S.R.L. {new Date().getFullYear()}</span>

                    <div className={cn('bottomLinksContainer')}>
                        <ul className={cn('bottomLinks')}>
                            {bottom_links?.map((link) => (
                                <li key={link._uid} >
                                    <SmartLink link={link.link}>{link.label}</SmartLink>
                                </li>
                            ))}
                        </ul>

                        <div className={cn('langs')}>
                            <Dropdown
                                options={locales.map((locale) => ({
                                    value: locale,
                                    label: t(locale),
                                }))}
                                value={locale}
                                onChange={(value) => {
                                    // @ts-expect-error -- TypeScript will validate that only known `params`
                                    // are used in combination with a given `pathname`. Since the two will
                                    // always match for the current route, we can skip runtime checks.
                                    router.replace({ pathname, params }, { locale: value })
                                }}
                                openTo="top"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </footer>

    )
}