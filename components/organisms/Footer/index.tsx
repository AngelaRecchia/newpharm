import { LinkStoryblok, Social_itemStoryblok } from "@/types/storyblok";
import { ISbRichtext } from "@storyblok/react";
import { useRouter, usePathname } from '@/i18n/navigation'
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl'
import styles from './index.module.scss';

import { render } from 'storyblok-rich-text-react-renderer';

import Input from "../../atoms/Input";
import SocialItem from "../../atoms/SocialItem";


import classNames from 'classnames/bind';
import Link from "next/link";
import { getLinkUrl } from "@/lib/api/utils/links";
import { useGlobalSettings } from "@/lib/context/global-settings-context";
import Dropdown from "@/components/atoms/Dropdown";
const cn = classNames.bind(styles);

interface FooterProps {
    newsletter_text?: string;
    address?: ISbRichtext;
    items?: LinkStoryblok[];
    socials?: Social_itemStoryblok[];
    bottom_links?: LinkStoryblok[];
}

export default function Footer({
    newsletter_text,
    address,
    items,
    socials,
    bottom_links,
}: FooterProps) {

    const locale = useLocale()
    const { locales } = useGlobalSettings()
    const params = useParams()
    const pathname = usePathname()
    const t = useTranslations()

    const router = useRouter()
    return (
        <footer className={cn('footer')}>
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
                                    <Link href={getLinkUrl(item.link) || '#'}>{item.label}</Link>
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
                                    <Link href={getLinkUrl(link.link) || '#'}>{link.label}</Link>
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