'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

interface HalftoneOverlayBaseProps {
    imageSrc: string
    columns: number
}

interface HalftoneOverlayAutoProps extends HalftoneOverlayBaseProps {
    /** Transizione automatica con GSAP tween */
    mode?: 'auto'
    overlayVisible: boolean
    progressRef?: never
}

interface HalftoneOverlayScrollProps extends HalftoneOverlayBaseProps {
    /** Progress legato direttamente allo scroll (0–1) */
    mode: 'scroll'
    progressRef: React.MutableRefObject<number>
    overlayVisible?: never
}

type HalftoneOverlayProps = HalftoneOverlayAutoProps | HalftoneOverlayScrollProps

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`

const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_columns;

varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;

  float aspect = u_resolution.x / u_resolution.y;
  float cellW = 1.0 / u_columns;
  // cellH = cellW * aspect → celle quadrate in pixel → cerchi veri a qualsiasi ratio
  float cellH = cellW * aspect;

  vec2 cellSize = vec2(cellW, cellH);
  vec2 cell = floor(uv / cellSize);
  vec2 cellCenter = (cell + 0.5) * cellSize;
  cellCenter = clamp(cellCenter, vec2(0.0), vec2(1.0));

  vec2 cellUV = (uv - cell * cellSize) / cellSize - 0.5;
  // Con celle quadrate in pixel, length(cellUV) è già circolare in screen space
  float dist = length(cellUV);

  float pull = pow(u_progress, 0.6);

  // Campionamento: converge linearmente verso il centro con il progress
  // p=0 → campiona dalla posizione reale (non campionato)
  // p=1 → campiona dal centro cella (campionato)
  vec2 movedCellUV = cellUV * (1.0 - pull);
  vec2 sampledUV = clamp(cellCenter + movedCellUV * cellSize, vec2(0.0), vec2(1.0));

  vec4 color = texture2D(u_image, sampledUV);

  // Raggio che si restringe geometricamente: nessuna opacità, solo il bordo che si chiude
  // p=0 → raggio copre l'intera cella (immagine piena)
  // p=1 → raggio = 0.42 (cerchio halftone)
  float onePx = (1.0 / u_resolution.x) * (0.5 / cellW);
  float maxDist = length(vec2(0.5, 0.5)) + onePx * 2.0;
  float circlePull = smoothstep(0.2, 1.0, pull);
  float radius = mix(maxDist, 0.42, circlePull);
  float inCircle = 1.0 - smoothstep(radius - onePx, radius + onePx, dist);

  gl_FragColor = vec4(color.rgb, color.a * inCircle);

}

`

const HalftoneOverlay: React.FC<HalftoneOverlayProps> = (props) => {
    const { imageSrc, columns, mode = 'auto' } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<WebGLProgram | null>(null)
    const textureRef = useRef<WebGLTexture | null>(null)
    const internalProgressRef = useRef(0)
    const progressRef = (mode === 'scroll' ? props.progressRef : internalProgressRef) as React.MutableRefObject<number>
    const rafRef = useRef<number | null>(null)
    const tweenRef = useRef<gsap.core.Tween | null>(null)

    const compileShader = useCallback((gl: WebGLRenderingContext, type: number, src: string) => {
        const s = gl.createShader(type)
        if (!s) return null
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error('Shader error:', gl.getShaderInfoLog(s))
            gl.deleteShader(s)
            return null
        }
        return s
    }, [])

    const linkProgram = useCallback((gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) => {
        const p = gl.createProgram()
        if (!p) return null
        gl.attachShader(p, vs)
        gl.attachShader(p, fs)
        gl.linkProgram(p)
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.error('Program error:', gl.getProgramInfoLog(p))
            gl.deleteProgram(p)
            return null
        }
        return p
    }, [])

    const renderFrame = useCallback(() => {
        const gl = glRef.current
        const program = programRef.current
        const texture = textureRef.current
        const canvas = canvasRef.current
        if (!gl || !program || !texture || !canvas) return

        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(program)

        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height)
        gl.uniform1f(gl.getUniformLocation(program, 'u_progress'), progressRef.current)
        gl.uniform1f(gl.getUniformLocation(program, 'u_columns'), columns)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns]) // progressRef è un ref, non deve essere nelle dipendenze

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container || !imageSrc) return

        const dpr = window.devicePixelRatio || 1
        const w = container.offsetWidth
        const h = container.offsetHeight
        if (w === 0 || h === 0) return

        canvas.width = w * dpr
        canvas.height = h * dpr

        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
        }) as WebGLRenderingContext | null
        if (!gl) { console.warn('WebGL non supportato'); return }
        glRef.current = gl

        gl.clearColor(0, 0, 0, 0)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
        if (!vs || !fs) return

        const program = linkProgram(gl, vs, fs)
        if (!program) return
        programRef.current = program
        gl.useProgram(program)

        const posBuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW)
        const posLoc = gl.getAttribLocation(program, 'a_position')
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        const tcBuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, tcBuf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 1, 1, 1, 0, 0,
            0, 0, 1, 1, 1, 0,
        ]), gl.STATIC_DRAW)
        const tcLoc = gl.getAttribLocation(program, 'a_texCoord')
        gl.enableVertexAttribArray(tcLoc)
        gl.vertexAttribPointer(tcLoc, 2, gl.FLOAT, false, 0, 0)

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const tex = gl.createTexture()
            if (!tex) return
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            textureRef.current = tex
        }
        img.onerror = () => console.warn('Halftone: impossibile caricare immagine', imageSrc)

        const src = imageSrc.startsWith('http')
            ? imageSrc
            : imageSrc.startsWith('//')
                ? `https:${imageSrc}`
                : `https://${imageSrc}`
        img.src = src

        const ro = new ResizeObserver(() => {
            const nw = container.offsetWidth
            const nh = container.offsetHeight
            if (nw > 0 && nh > 0) {
                canvas.width = nw * dpr
                canvas.height = nh * dpr
            }
        })
        ro.observe(container)

        let running = true
        let lastProgress = progressRef.current
        let rafId: number | null = null
        
        const loop = () => {
            if (!running) return
            
            const currentProgress = progressRef.current
            // Renderizza solo se il progress è cambiato
            if (currentProgress !== lastProgress) {
                renderFrame()
                lastProgress = currentProgress
            }
            
            // Continua il loop solo se necessario
            if (running) {
                rafId = requestAnimationFrame(loop)
            }
        }
        
        // Avvia il loop
        rafId = requestAnimationFrame(loop)
        rafRef.current = rafId

        return () => {
            running = false
            ro.disconnect()
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSrc, columns, compileShader, linkProgram, renderFrame]) // progressRef è un ref, non deve essere nelle dipendenze

    // Transizione automatica – solo in mode 'auto'
    const overlayVisible = mode === 'auto' ? props.overlayVisible : false
    useEffect(() => {
        if (mode !== 'auto') return

        if (tweenRef.current) tweenRef.current.kill()

        tweenRef.current = gsap.to(progressRef, {
            current: overlayVisible ? 1 : 0,
            duration: overlayVisible ? 5 : 1,
            ease: overlayVisible ? 'ease-in-out' : 'ease-in-out',
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, overlayVisible]) // progressRef è un ref, non deve essere nelle dipendenze

    return (
        <div ref={containerRef} className={cn('halftone-overlay')} style={{ opacity: 1 }}>
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
        </div>
    )
}

export default HalftoneOverlay