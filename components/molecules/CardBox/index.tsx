import { Card_boxStoryblok } from '@/types/storyblok'
import React, { useState, useRef, useEffect } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import SmartLink from '@/components/atoms/SmartLink'
import Button from '@/components/atoms/Button'
import RichText from '@/components/organisms/RichText'
import { StoryblokRichText } from '@storyblok/react'
import { gsap } from 'gsap'

const cn = classNames.bind(styles)

interface CardBoxProps {
    blok?: Card_boxStoryblok
    isOpen?: boolean
    onToggle?: () => void
}

const CardBox = ({ blok, isOpen: controlledIsOpen, onToggle }: CardBoxProps) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    const { title, text, link } = blok || {};

    // Usa lo stato controllato se fornito, altrimenti usa lo stato interno
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen

    const handleToggle = () => {
        if (onToggle) {
            onToggle()
        } else {
            setInternalIsOpen(!internalIsOpen)
        }
    }

    const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement

        // Se il click è su un link, button o elemento interattivo, non fare toggle
        if (
            target.closest('a') ||
            target.closest('button') ||
            target.closest('[role="button"]') ||
            target.closest('[onclick]')
        ) {
            return
        }

        handleToggle()
    }

    // Anima quando isOpen cambia
    useEffect(() => {
        if (!contentRef.current) return

        const content = contentRef.current

        if (isOpen) {
            // Apri: anima da 0 all'altezza naturale
            const height = content.scrollHeight
            gsap.fromTo(content,
                { height: 0, opacity: 0 },
                {
                    height: height,
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    overflow: 'hidden',
                    onComplete: () => {
                        gsap.set(content, { height: 'auto', overflow: 'visible' })
                    }
                }
            )
        } else {
            // Chiudi: anima dall'altezza corrente a 0
            const height = content.scrollHeight
            gsap.set(content, { height: height, overflow: 'hidden' })
            gsap.to(content, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
                overflow: 'hidden'
            })
        }
    }, [isOpen])

    return (
        <section className={cn('wrapper')} onClick={handleCardClick}>

            <h3 className={cn('title')}>{title}</h3>

            <div ref={contentRef} className={cn('content', { 'content-open': isOpen })} inert={!isOpen}>
                <StoryblokRichText doc={text as any} />


            </div>

            <div inert={!isOpen} className={cn('primary-link', { 'primary-link-closed': !isOpen })}>
                {link?.map((link) => (
                    <Button key={link._uid} link={link.link} label={link.label} variant='primary' />
                ))}

            </div>

            <Button
                className={cn('trigger', { 'trigger-closed': !isOpen })}
                icon='close'
                variant='secondary'
                onClick={handleToggle}
            />

        </section>
    )
}

export default CardBox