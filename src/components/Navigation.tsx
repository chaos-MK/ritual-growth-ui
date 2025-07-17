'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useTranslation } from '@/hooks/useTranslation'
import NavigationTree from './NavigationTree'
import { usePathname } from 'next/navigation'

import { 
  MagnifyingGlassIcon, 
  BellIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  CheckIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { ComponentType } from 'react'
import { useBreadcrumbs } from '@/app/stores/navigationStore'
import {
  useDropdowns,
  useTheme,
  useUserInfo,
  useNavigationStore
} from '@/app/stores/navigationStore'

interface NavigationProps {
  children?: React.ReactNode
}

interface MenuItem {
  name?: string
  icon?: ComponentType<React.SVGProps<SVGSVGElement>>
  href?: string
  hasArrow?: boolean
  external?: boolean
  type?: 'separator'
  onClick?: () => void
}

interface UserInfo {
  token: string
  email: string
  userId: string
  displayName: string
}

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

export default function Navigation({ children }: NavigationProps) {
  const router = useRouter()
   const pathname = usePathname()
  const { t, locale, changeLanguage } = useTranslation()
  const [renderKey, setRenderKey] = useState(0)

  const breadcrumbs = useBreadcrumbs()
 

  const {
    isDropdownOpen,
    isLanguageDropdownOpen,
    toggleDropdown,
    toggleLanguageDropdown,
    closeAllDropdowns,
  } = useDropdowns()

  const { isDarkMode, toggleTheme, setIsDarkMode } = useTheme()

  const userInfo = useUserInfo()
  const setUserInfo = useNavigationStore((state) => state.setUserInfo)
  const setIsLoggingOut = useNavigationStore((state) => state.setIsLoggingOut)
  const isLoggingOut = useNavigationStore((state) => state.isLoggingOut)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const languageDropdownRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const languageButtonRef = useRef<HTMLButtonElement>(null)

  // Available languages - matches your next.config.js locales
  const languages: Language[] = [
    { code: 'nl', name: t('languages.nl'), nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'en', name: t('languages.en'), nativeName: 'English', flag: '🇺🇸' },
    { code: 'fi', name: t('languages.fi'), nativeName: 'Suomi', flag: '🇫🇮' },
    { code: 'fr', name: t('languages.fr'), nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: t('languages.de'), nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: t('languages.it'), nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: t('languages.ja'), nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: t('languages.ko'), nativeName: '한국어', flag: '🇰🇷' },
    { code: 'no', name: t('languages.no'), nativeName: 'Norsk', flag: '🇳🇴' },
    { code: 'pl', name: t('languages.pl'), nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'pt', name: t('languages.pt'), nativeName: 'Português', flag: '🇵🇹' },
    { code: 'sr', name: t('languages.sr'), nativeName: 'Српски', flag: '🇷🇸' },
    { code: 'es', name: t('languages.es'), nativeName: 'Español', flag: '🇪🇸' },
    { code: 'sv', name: t('languages.sv'), nativeName: 'Svenska', flag: '🇸🇪' },
    { code: 'tr', name: t('languages.tr'), nativeName: 'Türkçe', flag: '🇹🇷' },
  ]

  // Helper function to get individual cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift()
      return cookieValue || null
    }
    return null
  }

  // Helper function to set cookie
  const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') return
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`
  }

  // Helper function to clear all auth cookies
  const clearAuthCookies = () => {
    const authCookies = ['userToken', 'userEmail', 'userId', 'userDisplayName']
    authCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
  }

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode)
    closeAllDropdowns()
    
    // Force re-render by updating the key
    setRenderKey(prev => prev + 1)
    
    if (router.refresh) {
      router.refresh()
    } else {
      router.replace(pathname)
    }
  }

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === locale) || languages[0]
  }

  useEffect(() => {
    const savedTheme = getCookie('theme')
    const prefersDark = savedTheme === 'dark'
    setIsDarkMode(prefersDark)
  }, [setIsDarkMode])

  useEffect(() => {
    const loadUserInfo = () => {
      const userToken = getCookie('userToken')
      const userEmail = getCookie('userEmail')
      const userId = getCookie('userId')
      const userDisplayName = getCookie('userDisplayName')

      if (userToken && userEmail && userId) {
        setUserInfo({
          token: userToken,
          email: userEmail,
          userId,
          displayName: userDisplayName || '',
        })

        // Restore user's saved theme preference on login
        const savedUserTheme = getCookie('userThemePreference')
        if (savedUserTheme) {
          const shouldUseDark = savedUserTheme === 'dark'
          setIsDarkMode(shouldUseDark)
          if (shouldUseDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          setCookie('theme', savedUserTheme)
        }
      }
    }

    loadUserInfo()

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUserInfo(null)
      }
    })

    return () => unsubscribe()
  }, [setUserInfo, setIsDarkMode])

  const clearUserState = useNavigationStore((state) => state.clearUserState)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Save current theme preference before logout
      const currentTheme = isDarkMode ? 'dark' : 'light'
      setCookie('userThemePreference', currentTheme)

      await signOut(auth)
      clearAuthCookies()
      clearUserState()
      
      // Switch to light mode for logout state but keep the preference saved
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
      setCookie('theme', 'light')
      
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      
      // Save current theme preference even on error
      const currentTheme = isDarkMode ? 'dark' : 'light'
      setCookie('userThemePreference', currentTheme)
      
      clearAuthCookies()
      clearUserState()
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
      setCookie('theme', 'light')
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close user dropdown
      if (
        dropdownRef.current &&
        avatarRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        closeAllDropdowns()
      }

      // Close language dropdown
      if (
        languageDropdownRef.current &&
        languageButtonRef.current &&
        !languageDropdownRef.current.contains(event.target as Node) &&
        !languageButtonRef.current.contains(event.target as Node)
      ) {
        closeAllDropdowns()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [closeAllDropdowns])

  // Close dropdowns on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAllDropdowns()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeAllDropdowns])

  const menuItems: MenuItem[] = [
    { name: t('navigation.profile'), icon: UserIcon, href: '/profile' },
    { name: t('navigation.mute_notifications'), icon: BellIcon, href: '/mute', hasArrow: true },
    { name: t('navigation.themes'), icon: PaintBrushIcon, href: '/themes' },
    { name: t('navigation.settings'), icon: Cog6ToothIcon, href: '/settings' },
    { type: 'separator' },
    { name: t('navigation.help'), icon: QuestionMarkCircleIcon, href: '/help', external: true },
    { type: 'separator' },
    { 
      name: isLoggingOut ? t('navigation.signing_out') : t('navigation.sign_out'), 
      icon: ArrowRightOnRectangleIcon, 
      onClick: handleLogout 
    }
  ]

  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!userInfo) return 'A'
    
    if (userInfo.displayName) {
      return userInfo.displayName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    
    return userInfo.email.charAt(0).toUpperCase()
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-800 shadow-md flex flex-col">
        <div className="p-4.5 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ritual Growth</h1>
        </div>
        
        {/* Breadcrumbs - show above the tree for context 
        {breadcrumbs.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRightIcon className="h-3 w-3 mx-1" />
                  )}
                  <Link
                    href={crumb.href}
                    className={`hover:text-gray-700 dark:hover:text-gray-200 ${
                      index === breadcrumbs.length - 1
                        ? 'font-medium text-gray-700 dark:text-gray-300'
                        : 'hover:underline'
                    }`}
                  >
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}*/}
        
        {/* Navigation Tree */}
        <NavigationTree userEmail={userInfo?.email} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 relative">
        {/* Top navigation bar */}
        <header className="bg-white dark:bg-gray-800 shadow px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          {/* Search bar */}
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder={t('navigation.search_placeholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Language selector, theme toggle, notification and avatar */}
          <div className="flex items-center space-x-4 ml-6 relative">
            {/* Language Selector */}
            <div className="relative">
              <button
                ref={languageButtonRef}
                onClick={toggleLanguageDropdown}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 flex items-center space-x-1"
                title={t('navigation.change_language')}
              >
                <LanguageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {locale?.toUpperCase()}
                </span>
              </button>

              {/* Language Dropdown */}
              {isLanguageDropdownOpen && (
                <div
                  ref={languageDropdownRef}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-64 overflow-y-auto"
                >
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t('navigation.select_language')}
                    </p>
                  </div>
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{language.flag}</span>
                        <div className="text-left">
                          <p className="font-medium">{language.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {language.nativeName}
                          </p>
                        </div>
                      </div>
                      {locale === language.code && (
                        <CheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150"
              title={isDarkMode ? t('navigation.switch_to_light_mode') : t('navigation.switch_to_dark_mode')}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <MoonIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Notification Button */}
            <button
              type="button"
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none transition-colors duration-150"
            >
              <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            {/* Avatar */}
            <div className="relative">
              <button
                ref={avatarRef}
                onClick={toggleDropdown}
                className="w-9 h-9 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-150"
              >
                {getUserInitials()}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-semibold">
                        {getUserInitials()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {userInfo?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {userInfo?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {menuItems.map((item, index) => {
                      if (item.type === 'separator') {
                        return <div key={index} className="border-t border-gray-100 dark:border-gray-700 my-1" />
                      }

                      const IconComponent = item.icon

                      if (item.onClick) {
                        return (
                          <button
                            key={item.name}
                            onClick={item.onClick}
                            disabled={isLoggingOut}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center">
                              {IconComponent && <IconComponent className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />}
                              {item.name}
                            </div>
                          </button>
                        )
                      }

                      return (
                        <Link
                          key={item.name}
                          href={item.href || '#'}
                          onClick={closeAllDropdowns}
                          className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                          <div className="flex items-center">
                            {IconComponent && <IconComponent className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />}
                            {item.name}
                          </div>
                          {item.external && (
                            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                          )}
                          {item.hasArrow && (
                            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <div key={`${locale}-${renderKey}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}