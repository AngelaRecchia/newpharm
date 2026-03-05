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

    if (!blok) return <></>

    const { text, link } = blok
    useEffect(() => {
        if (!wrapperRef.current || !textRef.current || !text?.trim()) return
        const wrapper = wrapperRef.current
        const textElement = textRef.current
        const linksContainer = linksRef.current

        // Funzione per dividere il testo in parole e applicare l'effetto reveal
        const setupTextReveal = (element: HTMLElement | null) => {
            if (!element) return
            element.innerHTML = ''
            const textContent = text;
            // Dividi il testo in parole mantenendo gli spazi
            const words = textContent.split(/(\s+)/).filter((item: string) => item.length > 0)

            // Crea uno span per ogni parola (non per gli spazi)
            words.forEach((word) => {
                if (word.trim()) {
                    const span = document.createElement('span')
                    span.textContent = word
                    span.className = styles.word
                    element.appendChild(span)
                } else {
                    // Mantieni gli spazi come text node
                    element.appendChild(document.createTextNode(word))
                }
            })

            const wordSpans = element.querySelectorAll(`.${styles.word}`)
            if (wordSpans.length === 0) return

            // Imposta colore iniziale grigio chiaro per tutte le parole
            gsap.set(wordSpans, {
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
                    const totalWords = wordSpans.length
                    const revealProgress = progress * totalWords

                    // Animazione reveal del testo con interpolazione graduale
                    wordSpans.forEach((word, index) => {
                        // Calcola quanto è rivelata questa parola (0 = grigio, 1 = nero)
                        let wordProgress = 0

                        if (index < Math.floor(revealProgress)) {
                            // Parola completamente rivelata
                            wordProgress = 1
                        } else if (index === Math.floor(revealProgress)) {
                            // Parola parzialmente rivelata (interpolazione)
                            wordProgress = revealProgress - index
                        }

                        // Interpola il colore tra grigio chiaro e nero
                        const opacity = 0.2 + (wordProgress * 0.8) // Da 0.2 a 1.0
                        const color = `rgba(0, 0, 0, ${opacity})`

                        gsap.to(word, {
                            color: color,
                            duration: 0.3,
                            ease: 'power2.out',
                            overwrite: true,
                        })
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
