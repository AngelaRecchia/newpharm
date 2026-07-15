'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { StoryblokComponent, storyblokEditable } from '@storyblok/react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { Text_revealStoryblok } from '@/types/storyblok'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'

gsap.registerPlugin(ScrollTrigger)

const cn = classNames.bind(styles)

const DIM_COLOR = 'rgba(0, 0, 0, 0.2)'
const FULL_COLOR = 'rgba(0, 0, 0, 1)'

function splitTextIntoChars(element: HTMLElement, text: string) {
    element.innerHTML = ''
    const words = text.split(/(\s+)/).filter((item) => item.length > 0)

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

    return element.querySelectorAll<HTMLElement>(`.${styles.char}`)
}

const TextReveal = ({ blok }: { blok?: Text_revealStoryblok }) => {
    const wrapperRef = useRef<HTMLElement>(null)
    const textRef = useRef<HTMLSpanElement>(null)
    const linksRef = useRef<HTMLDivElement>(null)

    const text = blok?.text
    const link = blok?.link

    useEffect(() => {
        if (!wrapperRef.current || !textRef.current || !text?.trim()) return

        const wrapper = wrapperRef.current
        const textElement = textRef.current
        const linksContainer = linksRef.current

        const charSpans = splitTextIntoChars(textElement, text)
        if (charSpans.length === 0) return

        gsap.set(charSpans, { color: DIM_COLOR })

        if (linksContainer) {
            gsap.set(linksContainer, { opacity: 0, y: 40 })
        }

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrapper,
                start: 'top 85%',
                end: 'top 15%',
                scrub: 2.5,
            },
        })

        tl.to(
            charSpans,
            {
                color: FULL_COLOR,
                ease: 'power1.inOut',
                duration: 0.35,
                stagger: {
                    amount: 0.9,
                    from: 'start',
                    ease: 'power2.inOut',
                },
            },
            0
        )

        if (linksContainer) {
            tl.to(
                linksContainer,
                {
                    opacity: 1,
                    y: 0,
                    ease: 'power2.out',
                    duration: 0.25,
                },
                0.78
            )
        }

        return () => {
            tl.scrollTrigger?.kill()
            tl.kill()
        }
    }, [text, link])

    if (!blok) return <></>

    const linkArray = Array.isArray(link) ? link : link ? [link] : []

    return (
        <section ref={wrapperRef} className={cn('wrapper')} id={getStoryblokAnchorId(blok?.anchor_id)} {...storyblokEditable(blok as any)}>
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
