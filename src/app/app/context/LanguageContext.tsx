'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Translations {
  [key: string]: any
}

interface LanguageContextType {
  locale: string
  t: (key: string) => string
  changeLanguage: (newLocale: string) => void
  isLoading: boolean
  availableLanguages: string[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'preferred-language'
const DEFAULT_LOCALE = 'en'
const AVAILABLE_LANGUAGES = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar']

interface LanguageProviderProps {
  children: React.ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE)
  const [translations, setTranslations] = useState<Translations>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load saved language preference on mount (client-side only)
  useEffect(() => {
    if (!isClient) return
    
    try {
      const savedLocale = localStorage.getItem(STORAGE_KEY)
      if (savedLocale && AVAILABLE_LANGUAGES.includes(savedLocale)) {
        setLocale(savedLocale)
      }
    } catch (error) {
      console.warn('Failed to load saved language preference:', error)
    }
  }, [isClient])

  // Load translations when locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true)
      try {
        // Try to load the requested locale
        let response = await fetch(`/locales/${locale}/common.json`)
        
        if (!response.ok) {
          console.warn(`Translation file not found for ${locale}, falling back to ${DEFAULT_LOCALE}`)
          // Fallback to default locale
          response = await fetch(`/locales/${DEFAULT_LOCALE}/common.json`)
        }
        
        if (response.ok) {
          const data = await response.json()
          setTranslations(data)
        } else {
          throw new Error(`Failed to load translations for both ${locale} and ${DEFAULT_LOCALE}`)
        }
      } catch (error) {
        console.error('Failed to load translations:', error)
        // Use empty translations object as last resort
        setTranslations({})
      } finally {
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [locale])

  const t = (key: string): string => {
    if (!key) return key
    
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Return key if translation not found
        console.warn(`Translation key "${key}" not found for locale "${locale}"`)
        return key
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  const changeLanguage = (newLocale: string) => {
    if (!AVAILABLE_LANGUAGES.includes(newLocale)) {
      console.warn(`Language "${newLocale}" is not available`)
      return
    }
    
    setLocale(newLocale)
    
    if (isClient) {
      try {
        localStorage.setItem(STORAGE_KEY, newLocale)
      } catch (error) {
        console.warn('Failed to save language preference:', error)
      }
    }
  }

  const contextValue: LanguageContextType = {
    locale,
    t,
    changeLanguage,
    isLoading,
    availableLanguages: AVAILABLE_LANGUAGES
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}