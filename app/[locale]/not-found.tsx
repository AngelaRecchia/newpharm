'use client'

import { Link } from '@/i18n/navigation'
import './not-found.scss'

/**
 * Custom 404 Not Found page
 * 
 * This page is shown when:
 * - A story doesn't exist in the current locale
 * - User navigates to an invalid route
 * - notFound() is called in any page/layout
 */
export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Page Not Found</h2>
                <p className="not-found-description">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <Link href="/" className="not-found-button">
                    Back to Home
                </Link>
            </div>
        </div>
    )
}
