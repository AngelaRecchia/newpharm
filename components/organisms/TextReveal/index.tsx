'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { StoryblokComponent, storyblokEditable } from '@storyblok/react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { Text_revealStoryblok } from '@/types/storyblok'

gsap.registerPlugin(ScrollTrigger)

const cn = classNames.bind(styles)

const TextReveal = ({ blok }: { blok?: Text_revealStoryblok }) => {
    const wrapperRef = useRef<HTMLElement>(null)
    const textRef = useRef<HTMLHeadingElement>(null)
    const linksRef = useRef<HTMLDivElement>(null)

    const text = blok?.text
    const link = blok?.link

    useEffect(() => {
        if (!wrapperRef.current || !textRef.current || !text?.trim()) return
        const wrapper = wrapperRef.current
        const textElement = textRef.current
        const linksContainer = linksRef.current

        // Funzione per dividere il testo in parole/lettere e applicare l'effetto reveal
        const setupTextReveal = (element: HTMLElement | null) => {
            if (!element) return
            element.innerHTML = ''
            const textContent = text
            const words = textContent.split(/(\s+)/).filter((item: string) => item.length > 0)

            words.forEach((word) => {
                if (word.trim()) {
                    const wordSpan = document.createElement('span')
                    wordSpan.className = styles.word

                    for (const char of word) {
                        const charSpan = document.createElement('span')
                        charSpan.textContent = char
                        charSpan.className = styles.char
                        charSpan.setAttribute('aria-hidden', 'true')
                        wordSpan.appendChild(charSpan)
                    }

                    element.appendChild(wordSpan)
                } else {
                    element.appendChild(document.createTextNode(word))
                }
            })

            const charSpans = element.querySelectorAll<HTMLElement>(`.${styles.char}`)
            if (charSpans.length === 0) return

            gsap.set(charSpans, {
                color: 'rgba(0, 0, 0, 0.2)',
            })

            // Setup iniziale per i links
            if (linksContainer) {
                gsap.set(linksContainer, {
                    opacity: 0,
                    y: 40,
                })
            }

            // Crea l'animazione di reveal basata sullo scroll
            const scrollTrigger = ScrollTrigger.create({
                trigger: wrapper,
                start: 'top 80%',
                end: 'top 20%',
                scrub: 1, // Aumenta lo smoothing (1 = 1 secondo di lag)
                onUpdate: (self) => {
                    const progress = self.progress
                    const totalChars = charSpans.length
                    const revealProgress = progress * totalChars

                    charSpans.forEach((char, index) => {
                        let charProgress = 0

                        if (index < Math.floor(revealProgress)) {
                            charProgress = 1
                        } else if (index === Math.floor(revealProgress)) {
                            charProgress = revealProgress - index
                        }

                        const opacity = 0.2 + charProgress * 0.8
                        gsap.set(char, { color: `rgba(0, 0, 0, ${opacity})` })
                    })

                    // Animazione links quando lo scroll è quasi completato (progress > 0.8)
                    if (linksContainer) {
                        const linksProgress = Math.max(0, Math.min(1, (progress - 0.8) / 0.2)) // Da 0.8 a 1.0
                        gsap.to(linksContainer, {
                            opacity: linksProgress,
                            y: 40 * (1 - linksProgress),
                            duration: 0.1,
                            overwrite: true,
                        })
                    }
                },
            })

            return scrollTrigger
        }

        // Setup reveal per la colonna testo
        const textScrollTrigger = setupTextReveal(textElement)

        return () => {
            textScrollTrigger?.kill()
        }
    }, [text, link])

    if (!blok) return <></>

    // Gestisce link come array o singolo elemento
    const linkArray = Array.isArray(link) ? link : link ? [link] : []

    return (
        <section ref={wrapperRef} className={cn('wrapper')} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>

                <div className={cn('content')}>
                    {text && (
                        <h2 className={cn('text')}>
                            <span className='sr-only'>{text}</span>
                            <span ref={textRef}>{text}</span>
                        </h2>
                    )}

                    {linkArray.length > 0 && (
                        <div ref={linksRef} className={cn('links')}>
                            {linkArray.map((linkItem) => (
                                <StoryblokComponent blok={linkItem} key={linkItem._uid} />
                            ))}
                        </div>
                    )}
                </div>
            </div>


        </section>
    )
}

export default TextReveal
