declare module '*.css'

declare module 'swiper/css' {
  const styles: string
  export default styles
}

declare module 'swiper/css/*' {
  const styles: string
  export default styles
}
