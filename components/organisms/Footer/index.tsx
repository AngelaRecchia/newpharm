'use client'

import { LinkStoryblok, Social_itemStoryblok, FooterStoryblok } from "@/types/storyblok";
import { ISbRichtext } from "@storyblok/react";
import { storyblokEditable } from '@storyblok/react';
import { useRouter, usePathname } from '@/i18n/navigation'
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl'
import { useRef, useEffect } from 'react'
import styles from './index.module.scss';

import { render } from 'storyblok-rich-text-react-renderer';

import Input from "../../atoms/Input";
import SocialItem from "../../atoms/SocialItem";


import classNames from 'classnames/bind';
import SmartLink from "@/components/atoms/SmartLink";
import { useGlobalSettings } from "@/lib/context/global-settings-context";
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
    if (!blok) return null;

    const { newsletter_text, address, items, socials, bottom_links } = blok;

    const locale = useLocale()
    const { locales } = useGlobalSettings()
    const params = useParams()
    const pathname = usePathname()
    const t = useTranslations()

    const router = useRouter()
    const footerRef = useRef<HTMLElement>(null)

    useEffect(() => {
        if (typeof window === 'undefined' || !footerRef.current) return;

        // Wait for smooth-scrollbar to be initialized
        const scroller = document.querySelector('.scroller') as HTMLElement;
        const mainElement = document.querySelector('main.main') as HTMLElement;

        if (!scroller || !mainElement) return;

        let scrollTrigger: ScrollTrigger | null = null;

        // Wait for smooth-scrollbar and ScrollTrigger to be ready
        const initAnimation = () => {
            if (!footerRef.current || !mainElement) return;

            // Set initial position
            gsap.set(footerRef.current, { yPercent: -50 });

            // Create uncover animation
            const uncover = gsap.timeline({ paused: true });
            uncover.to(footerRef.current, { yPercent: 0, ease: 'none' });

            // Create ScrollTrigger
            scrollTrigger = ScrollTrigger.create({
                trigger: mainElement,
                start: 'bottom bottom',
                end: () => `+=${footerRef.current?.offsetHeight || 0}px`,
                animation: uncover,
                scrub: true,
            });
        };

        // Start initialization after smooth-scrollbar is ready
        // Use requestAnimationFrame to ensure DOM and smooth-scrollbar are ready
        let timeoutId: NodeJS.Timeout | null = null;
        const rafId = requestAnimationFrame(() => {
            timeoutId = setTimeout(initAnimation, 100);
        });

        // Cleanup
        return () => {
            cancelAnimationFrame(rafId);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (scrollTrigger) {
                scrollTrigger.kill();
            }
        };
    }, []);

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
                                <li key={item._uid} className={cn('link')}>
                                    <SmartLink link={item.link}>{item.label}</SmartLink>
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