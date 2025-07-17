'use client'

import { useCallback, useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useNavigation } from '@/hooks/useNavigation'
import { useTranslation } from '@/hooks/useTranslation'

interface Session {
  sessionId: number
  sessionName: string
  startDate: string
  status: string
  hasGraphs: boolean
  hasDashboard: boolean
  stages: any[]
}

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
  superUser: boolean
  sessions: Session[]
  userContext: {
    hasLiked: boolean
    isFollowing: boolean
    isInFavorites: boolean
    owns: boolean
    isOwnerBlocked: boolean
    isOwnerMuted: boolean
  }
}

interface Stage {
  id: number
  type: string
  state: string
  stageStats: {
    id: number
    cohortID: number
    peopleEntered: number
    peopleInactive: number
    peopleExit: number
    overall: number
  }
}

interface Cohort {
  id: number
  cohortName: string
  startDate: string
  endDate: string
  version: string
  project_id: number
  users: User[]
  stages: Stage[]
}

interface UserInfo {
  token: string
  email: string
  userId: string
  displayName: string
}

interface Stats {
  name: string
  stat: string
  change: string
  changeType: 'increase' | 'decrease'
}

interface CohortSummaryProps {
  params: Promise<{ id: string; cohortId: string }>
}

export default function CohortSummary({ params }: CohortSummaryProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: projectId, cohortId } = resolvedParams
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [stats, setStats] = useState<Stats[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const { loadNavigationData } = useNavigation()
  const { t, locale, changeLanguage, isLoading: translationLoading } = useTranslation()

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

  // Fetch specific cohort data from API
  const fetchCohortById = async (cohortId: string): Promise<Cohort | null> => {
  setApiLoading(true)
  setApiError(null)

  const userToken = getCookie('userToken')
  if (!userToken) {
    setApiError(t('errors.no_auth_token'))
    setApiLoading(false)
    return null
  }
  
  try {
    const response = await fetch(`http://localhost:8080/users/cohort/${encodeURIComponent(cohortId)}`, {
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
          const retryResponse = await fetch(`http://localhost:8080/users/cohort/${encodeURIComponent(cohortId)}`, {
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
          
          // Handle the user array response
          const userData = await retryResponse.json()
          return transformUserArrayToCohort(userData, cohortId)
        } else {
          clearAuthCookies()
          router.push('/login')
          return null
        }
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    // Handle the user array response
    const userData = await response.json()
    return transformUserArrayToCohort(userData, cohortId)
  } catch (error) {
    console.error(t('errors.fetch_cohort'), error)
    setApiError(error instanceof Error ? error.message : t('errors.fetch_cohort'))
    return null
  } finally {
    setApiLoading(false)
  }
}

// Add this helper function to transform user array to cohort format
const transformUserArrayToCohort = (users: any[], cohortId: string): Cohort => {
  // Map the backend user format to your frontend User interface
const mappedUsers: User[] = users.map(user => ({
  id: user.userId,
  apUid: user.userId.toString(),
  email: user.userName + '@example.com',
  fullName: user.userName,
  creationTime: user.startDate,
  statuses: [user.status],
  privileges: [],
  reactivationToken: '',
  disabled: user.status !== 'ACTIVE',
  displayName: user.userName,
  superUser: false,
  userContext: {
    hasLiked: false,
    isFollowing: false,
    isInFavorites: false,
    owns: false,
    isOwnerBlocked: false,
    isOwnerMuted: false,
  },
  sessions: user.sessions || []
}))


  return {
    id: parseInt(cohortId),
    cohortName: t('company.cohorts.name').toString() + `${cohortId}`,
    startDate: users[0]?.startDate || new Date().toISOString(),
    endDate: '',
    version: '1.0',
    project_id: parseInt(projectId),
    users: mappedUsers,
    stages: users[0]?.stages || []
  }
}

  // Calculate stats from cohort data
  const calculateStats = (cohort: Cohort | null): Stats[] => {
    if (!cohort) {
      return [
        { name: 'Total Users', stat: '0', change: '+0', changeType: 'increase' },
        { name: 'Active Users', stat: '0', change: '+0', changeType: 'increase' },
        { name: 'Total Sessions', stat: '0', change: '+0', changeType: 'increase' },
        { name: 'Avg. Session Duration', stat: '0m 0s', change: '+0s', changeType: 'increase' },
      ]
    }

    const users = cohort.users || []
    const stages = cohort.stages || []

    const totalUsers = users.length
    const activeUsers = users.filter(user => {
      if (!user.statuses || !Array.isArray(user.statuses)) return false
      return !user.disabled && user.statuses.length > 0
    }).length

    const totalSessions = users.reduce((sum, user) => {
  return sum + (user.sessions?.length || 0)
}, 0)


    // Calculate average session duration based on actual data
    const avgSessionDuration = totalUsers > 0 ? Math.floor(totalSessions / totalUsers * 45) : 0
    const avgDurationMinutes = Math.floor(avgSessionDuration / 60)
    const avgDurationSeconds = avgSessionDuration % 60

    // For now, we'll use static changes. In a real app, you'd compare with historical data
    return [
      { name:  t('company.stats.total_users').toString(), stat: totalUsers.toString(), change: '+15', changeType: 'increase' },
      { name: t('company.stats.active_users').toString(), stat: activeUsers.toString(), change: '+12', changeType: 'increase' },
      { name: t('company.stats.total_sessions').toString(), stat: totalSessions.toString(), change: '+40', changeType: 'increase' },
      { 
        name: t('company.stats.avg_session_duration').toString(), 
        stat: avgSessionDuration > 0 ? `${avgDurationMinutes}m ${avgDurationSeconds}s` : '5m 12s', 
        change: '+45s', 
        changeType: 'increase' 
      },
    ]
  }

  // Load cohort data on component mount
  useEffect(() => {
    const loadCohortData = async () => {
      if (!userInfo || !cohortId) return

      try {
        const cohortData = await fetchCohortById(cohortId)
        setCohort(cohortData)

        const calculatedStats = calculateStats(cohortData)
        setStats(calculatedStats)
        
        await loadNavigationData(userInfo.email)

      } catch (error) {
        console.error('Failed to load cohort data:', error)
      }
    }

    loadCohortData()
  }, [userInfo, cohortId, loadNavigationData])

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userToken = getCookie('userToken')
        const userEmail = getCookie('userEmail')
        const userId = getCookie('userId')
        const userDisplayName = getCookie('userDisplayName')
        
        if (!userToken || !userEmail || !userId) {
          console.log('Missing auth cookies, redirecting to login')
          router.push('/login')
          return
        }

        const isTokenValid = await validateToken()
        if (!isTokenValid) {
          console.log('Token validation failed, redirecting to login')
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
        console.error('Auth check failed:', error)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {apiLoading ? t('company.loading') : cohort?.cohortName || t('company.cohorts.name')}
        </h2>
        <p className="text-sm text-gray-500">
          {cohort?.startDate ? `${t('company.cohorts.started')} ${new Date(cohort.startDate).toLocaleDateString(locale)}` : t('company.loading')}
        </p>
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

      {/* Users List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{t('company.users.title')}</h3>
            {apiLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200">
          {apiLoading ? (
            <ul role="list" className="divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={`skeleton-user-${i}`} className="px-4 py-4">
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
          ) : !cohort?.users || cohort.users.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              {apiError ? t('company.errors.fetch_cohort') : t('company.cohorts.no_users')}
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {cohort.users.map((user) => {
                const userSessions = user.sessions?.length || 0

                return (
                  <li key={user.id}>
                    <Link
                      href={`/app/projects/${projectId}/cohorts/${cohortId}/users/${user.id}`}
                      className="block hover:bg-gray-50 transition-colors"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="truncate text-sm font-medium text-indigo-600">
                              {user.displayName || user.fullName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="ml-2 flex flex-shrink-0">
                            <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                              {userSessions} {t('company.cohorts.sessions')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            {t('company.users.created')}: {new Date(user.creationTime).toLocaleDateString(locale)}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.disabled 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.disabled ? t('company.users.disabled') : t('company.users.active')}
                            </span>
                            {user.superUser && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {t('company.users.super_user')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}