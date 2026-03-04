import classNames from 'classnames/bind'
import styles from './not-found.module.scss'

const cn = classNames.bind(styles)

/**
 * Global not-found page (fallback)
 * 
 * This is shown when:
 * - User accesses an invalid locale
 * - Error occurs outside locale context
 */
export default function GlobalNotFound() {
  return (
    <div className={cn('container')}>
      <h1 className={cn('title')}>404</h1>
    </div>
  )
}
