import { getLangs } from './api/storyblok/languages'

/**
 * Usage examples for getLangs with Global Settings
 */

// Example 1: Access available locales from global settings context
// In any component that has access to GlobalSettingsProvider
export function ExampleUseLocalesFromContext() {
  // This is a client component example
  // 'use client'
  // import { useGlobalSettings } from '@/lib/global-settings-context'
  
  // const settings = useGlobalSettings()
  // const availableLocales = settings?.availableLocales || []
  
  // return (
  //   <div>
  //     <h2>Available Languages</h2>
  //     <ul>
  //       {availableLocales.map(locale => (
  //         <key={locale}>
  //           <a href={`/${locale}`}>{locale.toUpperCase()}</a>
  //         </li>
  //       ))}
  //     </ul>
  //   </div>
  // )
}

// Example 2: Language Selector Component using context
export function ExampleLanguageSelector() {
  // 'use client'
  // import { useGlobalSettings } from '@/lib/global-settings-context'
  // import { useParams } from 'next/navigation'
  
  // const settings = useGlobalSettings()
  // const params = useParams()
  // const currentLocale = params.locale as string
  // const availableLocales = settings?.availableLocales || []
  
  // const localeNames: Record<string, string> = {
  //   'en': 'English',
  //   'it': 'Italiano',
  //   'de': 'Deutsch',
  // }
  
  // return (
  //   <select value={currentLocale} onChange={(e) => {
  //     window.location.href = `/${e.target.value}`
  //   }}>
  //     {availableLocales.map(locale => (
  //       <option key={locale} value={locale}>
  //         {localeNames[locale] || locale}
  //       </option>
  //     ))}
  //   </select>
  // )
}

// Example 3: Direct usage in server components (without context)
export async function exampleGenerateStaticParams() {
  const locales = await getLangs()
  
  return locales.map((locale) => ({
    locale,
  }))
}

// Example 4: With content verification
export async function exampleVerifiedLocales() {
  const locales = await getLangs({
    excludePaths: ['layout-components', 'drafts'],
    checkForContent: true
  })
  
  console.log('Locales with published content:', locales)
  return locales
}

// Example 5: Custom exclude paths
export async function exampleCustomExclude() {
  const locales = await getLangs({
    excludePaths: ['layout-components', 'test', 'archive'],
    checkForContent: true
  })
  
  return locales
}

// Example 6: Check if locale is available in client component
export function ExampleCheckLocaleAvailable() {
  // 'use client'
  // import { useGlobalSettings } from '@/lib/global-settings-context'
  
  // const settings = useGlobalSettings()
  // const availableLocales = settings?.availableLocales || []
  
  // function isLocaleAvailable(locale: string): boolean {
  //   return availableLocales.includes(locale)
  // }
  
  // if (!isLocaleAvailable('fr')) {
  //   return <div>French locale is not available</div>
  // }
  
  // return <div>French locale is available!</div>
}
