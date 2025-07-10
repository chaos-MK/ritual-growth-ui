import { useState, useEffect } from 'react'

interface Translations {
  [key: string]: any
}

const STORAGE_KEY = 'preferred-language'
const DEFAULT_LOCALE = 'en'

export function useTranslation() {
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE)
  const [translations, setTranslations] = useState<Translations>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load saved language preference on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(STORAGE_KEY)
    if (savedLocale) {
      setLocale(savedLocale)
    }
  }, [])

  // Load translations when locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/locales/${locale}/common.json`)
        if (response.ok) {
          const data = await response.json()
          setTranslations(data)
        } else {
          throw new Error(`Failed to load translations for ${locale}`)
        }
      } catch (error) {
        console.error('Failed to load translations:', error)
        // Fallback to English
        if (locale !== DEFAULT_LOCALE) {
          try {
            const response = await fetch(`/locales/${DEFAULT_LOCALE}/common.json`)
            if (response.ok) {
              const data = await response.json()
              setTranslations(data)
            }
          } catch (fallbackError) {
            console.error('Failed to load fallback translations:', fallbackError)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [locale])

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  const changeLanguage = (newLocale: string) => {
    setLocale(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }

  return {
    t,
    locale,
    changeLanguage,
    isLoading
  }
}