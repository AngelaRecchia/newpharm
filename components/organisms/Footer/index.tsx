'use client'

import { FooterStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import styles from './index.module.scss'
import { render } from 'storyblok-rich-text-react-renderer'
import TextField from '@/components/atoms/TextField'
import SocialItem from '../../atoms/SocialItem'
import classNames from 'classnames/bind'
import SmartLink from '@/components/atoms/SmartLink'
import { useGlobalSettings } from '@/lib/context/global-settings-context'
import Select from '@/components/molecules/Select'

const cn = classNames.bind(styles)

interface FooterProps {
  blok?: FooterStoryblok
}

export default function Footer({ blok }: FooterProps) {
  const locale = useLocale()
  const { locales } = useGlobalSettings()
  const params = useParams()
  const pathname = usePathname()
  const t = useTranslations()
  const router = useRouter()

  if (!blok) return null

  const { newsletter_text, address, items, socials, bottom_links } = blok

  return (
    <footer className={cn('footer')} {...storyblokEditable(blok as any)}>
      <div className={cn('newsletter')}>
        <p className={cn('newsletterText')}>{newsletter_text}</p>

        <div className={cn('newsletterInput')}>
          <TextField variant="inline" placeholder="Email" type="email" skin="light" />
        </div>
      </div>

      <div className={cn('content')}>
        <div className={cn('top')}>
          <address className={cn('address')}>{render(address)}</address>

          <div className={cn('linksContainer')}>
            <ul className={cn('links')}>
              {items?.map((item) => (
                <li key={item._uid} className={cn('linkItem')}>
                  <SmartLink className={cn('link')} link={item.link}>
                    {item.label}
                  </SmartLink>
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
          <span className={cn('copyright')}>
            © Newpharm S.R.L. {new Date().getFullYear()}
          </span>

          <div className={cn('bottomLinksContainer')}>
            <ul className={cn('bottomLinks')}>
              {bottom_links?.map((link) => (
                <li key={link._uid}>
                  <SmartLink link={link.link}>{link.label}</SmartLink>
                </li>
              ))}
            </ul>

            <div className={cn('langs')}>
              <Select
                variant="menu"
                options={locales.map((loc) => ({
                  value: loc,
                  label: t(loc),
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
