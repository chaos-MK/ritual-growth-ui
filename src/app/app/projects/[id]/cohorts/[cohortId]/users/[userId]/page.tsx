'use client'

import { useCallback, useEffect, useState, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useNavigation } from '@/hooks/useNavigation'
import { useTranslation } from '@/hooks/useTranslation'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Types
interface User {
  id: number
  apUid: string
  email: string
  fullName: string
  creationTime: string
  statuses: string[]
  privileges: Array<{ id: number; name: string }>
  reactivationToken: string
  disabled: boolean
  displayName: string
}

interface Session {
  id: number
  startTime: string
  duration: string
  pageViews: number
  bounce: boolean
  endTime?: string
}

interface Stats {
  name: string
  stat: string
  change: string
  changeType: 'increase' | 'decrease'
}

interface UserInfo {
  token: string
  email: string
  userId: string
  displayName: string
}

interface UserSummaryProps {
  params: Promise<{ id: string; cohortId: string; userId: string }>
}

export default function UserSummary({ params }: UserSummaryProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: projectId, cohortId, userId } = resolvedParams
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const { loadNavigationData, breadcrumbs } = useNavigation()
  const { t, locale, changeLanguage } = useTranslation()
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [debouncedLoading, setDebouncedLoading] = useState(false)
  const [hasInitialData, setHasInitialData] = useState(false)

  // Fallback breadcrumbs
  const [fallbackBreadcrumbs, setFallbackBreadcrumbs] = useState([
    { name: 'Projects', href: '/app/projects' },
    { name: 'Project', href: `/app/projects/${projectId}` },
    { name: 'Cohorts', href: `/app/projects/${projectId}/cohorts` },
    { name: `Cohort ${cohortId}`, href: `/app/projects/${projectId}/cohorts/${cohortId}` },
    { name: `User ${userId}`, href: `/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}` }
  ])

  const displayBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : fallbackBreadcrumbs

  // Debounced loading state
  useEffect(() => {
    if (apiLoading && !hasInitialData) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      loadingTimeoutRef.current = setTimeout(() => {
        setDebouncedLoading(true)
      }, 300) // 300ms debounce
    } else {
      setDebouncedLoading(false)
      if (user || sessions.length > 0) {
        setHasInitialData(true)
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [apiLoading, hasInitialData, user, sessions.length])

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

  // Helper function to clear all auth cookies
  const clearAuthCookies = () => {
    const authCookies = ['userToken', 'userEmail', 'userId', 'userDisplayName']
    authCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
  }

  // Validate token with Firebase
  const validateToken = async (): Promise<boolean> => {
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        const freshToken = await currentUser.getIdToken(true)
        const expires = new Date()
        expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000))
        document.cookie = `userToken=${freshToken}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
        return true
      }
      return false
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }

  // Fetch specific user data from API
  const fetchUserById = async (userId: string): Promise<User | null> => {
    setApiLoading(true)
    setApiError(null)

    const userToken = getCookie('userToken')
    if (!userToken) {
      setApiError(t('errors.no_auth_token'))
      setApiLoading(false)
      return null
    }

    // Check session storage for cached user data
    const cachedUser = sessionStorage.getItem(`user_${userId}`)
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser)
        setUser(parsedUser)
        setApiLoading(false)
        return parsedUser
      } catch (e) {
        console.warn('Failed to parse cached user data')
      }
    }
    
    try {
      const response = await fetch(`http://localhost:8080/users/${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'hippo-api-version': '1.0.0',
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          const tokenRefreshed = await validateToken()
          if (tokenRefreshed) {
            const newToken = getCookie('userToken')
            const retryResponse = await fetch(`http://localhost:8080/users/${encodeURIComponent(userId)}`, {
              method: 'GET',
              headers: {
                'hippo-api-version': '1.0.0',
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (!retryResponse.ok) {
              throw new Error(`API Error: ${retryResponse.status} ${retryResponse.statusText}`)
            }
            
            const userData = await retryResponse.json()
            const transformedUser = transformUserData(userData)
            sessionStorage.setItem(`user_${userId}`, JSON.stringify(transformedUser)) // Cache the data
            return transformedUser
          } else {
            clearAuthCookies()
            router.push('/login')
            return null
          }
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const userData = await response.json()
      const transformedUser = transformUserData(userData)
      sessionStorage.setItem(`user_${userId}`, JSON.stringify(transformedUser)) // Cache the data
      return transformedUser
    } catch (error) {
      console.error(t('errors.fetch_user'), error)
      setApiError(error instanceof Error ? error.message : t('errors.fetch_user'))
      return null
    } finally {
      setApiLoading(false)
    }
  }

  // Fetch user sessions data from API
  const fetchUserSessions = async (userId: string): Promise<Session[]> => {
    const userToken = getCookie('userToken')
    if (!userToken) {
      return []
    }

    // Check session storage for cached sessions data
    const cachedSessions = sessionStorage.getItem(`sessions_${userId}`)
    if (cachedSessions) {
      try {
        const parsedSessions = JSON.parse(cachedSessions)
        setSessions(parsedSessions)
        return parsedSessions
      } catch (e) {
        console.warn('Failed to parse cached sessions data')
      }
    }
    
    try {
      const response = await fetch(`http://localhost:8080/session/user/${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'hippo-api-version': '1.0.0',
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          const tokenRefreshed = await validateToken()
          if (tokenRefreshed) {
            const newToken = getCookie('userToken')
            const retryResponse = await fetch(`http://localhost:8080/session/user/${encodeURIComponent(userId)}`, {
              method: 'GET',
              headers: {
                'hippo-api-version': '1.0.0',
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (!retryResponse.ok) {
              throw new Error(`API Error: ${retryResponse.status} ${retryResponse.statusText}`)
            }
            
            const sessionsData = await retryResponse.json()
            const transformedSessions = transformSessionsData(sessionsData)
            sessionStorage.setItem(`sessions_${userId}`, JSON.stringify(transformedSessions)) // Cache the data
            return transformedSessions
          }
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const sessionsData = await response.json()
      const transformedSessions = transformSessionsData(sessionsData)
      sessionStorage.setItem(`sessions_${userId}`, JSON.stringify(transformedSessions)) // Cache the data
      return transformedSessions
    } catch (error) {
      console.error(t('user_summary.failed_to_load_sessions'), error)
      setApiError(t('user_summary.failed_to_load_sessions'))
      return []
    }
  }

  // Helper function to calculate duration between two dates
  const calculateDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const minutes = Math.floor(diffMs / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
    return `${minutes}m ${seconds}s`
  }

  // Transform user data from backend format to frontend format
  const transformUserData = (userData: any): User => {
    return {
      id: userData.userId || userData.id,
      apUid: userData.userId?.toString() || userData.id?.toString(),
      email: userData.email || userData.userName + '@example.com',
      fullName: userData.fullName || userData.userName,
      creationTime: userData.creationTime || userData.startDate,
      statuses: userData.statuses || [userData.status],
      privileges: userData.privileges || [],
      reactivationToken: userData.reactivationToken || '',
      disabled: userData.disabled || userData.status !== 'ACTIVE',
      displayName: userData.displayName || userData.userName,
    }
  }

  // Transform sessions data from backend format to frontend format
  const transformSessionsData = (sessionsData: any[]): Session[] => {
    return sessionsData.map(session => ({
      id: session.sessionId || session.id,
      startTime: session.startDate 
        ? `${session.startDate}T00:00:00Z`
        : session.startTime
          ? `${session.startTime}T00:00:00Z`
          : session.createdAt
            ? `${session.createdAt}T00:00:00Z`
            : new Date().toISOString(),
      duration: session.duration || calculateDuration(
        session.startDate || session.startTime || session.createdAt,
        session.endTime
      ),
      pageViews: session.pageViews || session.views || Math.floor(Math.random() * 10) + 1,
      bounce: session.bounce || session.bounced || false,
      endTime: session.endTime,
    }))
  }

  // Calculate stats from user and sessions data
  const calculateStats = (user: User | null, sessions: Session[]): Stats[] => {
    if (!user || !sessions.length) {
      return [
        { name: t('user_summary.stats.total_sessions'), stat: '0', change: '+0', changeType: 'increase' },
        { name: t('user_summary.stats.avg_session_duration'), stat: '0m 0s', change: '+0s', changeType: 'increase' },
        { name: t('user_summary.stats.page_views'), stat: '0', change: '+0', changeType: 'increase' },
        { name: t('user_summary.stats.bounce_rate'), stat: '0%', change: '+0%', changeType: 'increase' },
      ]
    }

    const totalSessions = sessions.length
    const totalPageViews = sessions.reduce((sum, session) => sum + session.pageViews, 0)
    const bouncedSessions = sessions.filter(session => session.bounce).length
    const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0

    // Calculate average session duration
    const totalDurationMinutes = sessions.reduce((sum, session) => {
      const durationParts = session.duration.split(' ')
      const minutes = parseInt(durationParts[0].replace('m', ''))
      const seconds = parseInt(durationParts[1].replace('s', ''))
      return sum + minutes + (seconds / 60)
    }, 0)

    const avgDurationMinutes = Math.floor(totalDurationMinutes / totalSessions)
    const avgDurationSeconds = Math.round(((

totalDurationMinutes / totalSessions) % 1) * 60)

    return [
      { name: t('user_summary.stats.total_sessions'), stat: totalSessions.toString(), change: '+2', changeType: 'increase' },
      { 
        name: t('user_summary.stats.avg_session_duration'),
        stat: `${avgDurationMinutes}m ${avgDurationSeconds}s`, 
        change: '+45s', 
        changeType: 'increase' 
      },
      { name: t('user_summary.stats.page_views'), stat: totalPageViews.toString(), change: '+8', changeType: 'increase' },
      { name: t('user_summary.stats.bounce_rate'), stat: `${bounceRate}%`, change: '-5%', changeType: 'decrease' },
    ]
  }

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!userInfo || !userId) return

      try {
        const [userData, sessionsData] = await Promise.all([
          fetchUserById(userId),
          fetchUserSessions(userId),
        ])

        setUser(userData)
        setSessions(sessionsData)

        const calculatedStats = calculateStats(userData, sessionsData)
        setStats(calculatedStats)

        await loadNavigationData(userInfo.email)
      } catch (error) {
        console.error(t('errors.fetch_user'), error)
      }
    }

    loadUserData()
  }, [userInfo?.userId, userId, loadNavigationData])

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userToken = getCookie('userToken')
        const userEmail = getCookie('userEmail')
        const userId = getCookie('userId')
        const userDisplayName = getCookie('userDisplayName')
        
        if (!userToken || !userEmail || !userId) {
          console.log(t('errors.missing_auth_cookies'))
          router.push('/login')
          return
        }

        const isTokenValid = await validateToken()
        if (!isTokenValid) {
          console.log(t('errors.token_validation_failed'))
          clearAuthCookies()
          router.push('/login')
          return
        }

        setUserInfo({
          token: userToken,
          email: userEmail,
          userId: userId,
          displayName: userDisplayName || '',
        })
      } catch (error) {
        console.error(t('errors.auth_check_failed'), error)
        clearAuthCookies()
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && !isLoading) {
        clearAuthCookies()
        router.push('/login')
      }
    })

    checkAuth()

    return () => unsubscribe()
  }, [router, isLoading])

  // If no user is found, don't render anything (will redirect)
  if (!userInfo) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            {displayBreadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center">
                <BreadcrumbItem>
                  {index === displayBreadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="text-gray-900 dark:text-white font-medium">
                      {breadcrumb.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      href={breadcrumb.href}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {breadcrumb.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < displayBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {debouncedLoading && !hasInitialData ? (
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              user?.displayName || user?.fullName || t('company.users.title')
            )}
          </h2>
          <p className="text-sm text-gray-500">
            {debouncedLoading && !hasInitialData ? (
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              user?.email || t('company.users.title')
            )}
          </p>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{t('company.error')}: {apiError}</p>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {item.changeType === 'increase' ? (
                  <ArrowUpIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {t(`company.${item.changeType}`)} {t('company.by')}
                </span>
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Sessions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{t('user_summary.sessions')}</h3>
            {apiLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200">
          {apiLoading ? (
            <ul role="list" className="divide-y divide-gray-200">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={`skeleton-session-${i}`} className="px-4 py-4">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : !sessions || sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              {apiError ? t('user_summary.failed_to_load_sessions') : t('user_summary.no_sessions_found')}
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}/sessions/${session.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="truncate text-sm font-medium text-indigo-600">
                            {t('user_summary.session')} {session.id}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t('user_summary.started')}: {new Date(session.startTime).toLocaleString(locale)}
                          </p>
                        </div>
                        <div className="ml-2 flex flex-shrink-0">
                          <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {session.duration}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {session.pageViews} {t('user_summary.page_views_unit')}
                          </p>
                          {session.bounce && (
                            <p className="mt-2 flex items-center text-sm text-red-500 sm:mt-0 sm:ml-6">
                              {t('user_summary.bounced')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}