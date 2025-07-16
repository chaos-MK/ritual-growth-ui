'use client'

import { useCallback, useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useNavigation } from '@/hooks/useNavigation'

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
interface CohortStatistics {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  totalStages: number
  inactiveUsers: number
  activeUserPercentage: number
  sessionSummaries: any[]
  stageSummaries: any[]
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
  statistics?: CohortStatistics
}

interface Project {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
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

interface ProjectSummaryProps {
  params: Promise<{ id: string }>
}

export default function ProjectSummary({ params }: ProjectSummaryProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  const [expectedCohortCount, setExpectedCohortCount] = useState<number | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [projectLoading, setProjectLoading] = useState(false)
  const { loadNavigationData } = useNavigation()

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

  // Fetch project details
  const fetchProject = async (projectId: string): Promise<Project | null> => {
    setProjectLoading(true)
    
    const userToken = getCookie('userToken')
    if (!userToken) {
      console.error('No auth token available')
      return null
    }

    try {
      const response = await fetch(`http://localhost:8080/cohort/searchByProject?projectId=${encodeURIComponent(projectId)}`, {
        method: 'GET',
        headers: {
          'hippo-api-version': '1.0.0',
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data: Project = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch project:', error)
      return null
    } finally {
      setProjectLoading(false)
    }
  }

  // Fetch cohorts for specific project from API
  const fetchCohortsByProject = async (projectId: string): Promise<Cohort[]> => {
    setApiLoading(true)
    setApiError(null)

    const userToken = getCookie('userToken')
    if (!userToken) {
      setApiError('No authentication token available')
      setApiLoading(false)
      return []
    }
    
    try {
      const response = await fetch(`http://localhost:8080/cohort/searchByProject?projectId=${encodeURIComponent(projectId)}`, {
        method: 'GET',
        headers: {
          'hippo-api-version': '1.0.0',
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, try to refresh
          const tokenRefreshed = await validateToken()
          if (tokenRefreshed) {
            // Retry the request with new token
            const newToken = getCookie('userToken')
            const retryResponse = await fetch(`http://localhost:8080/cohort/searchByProject?projectId=${encodeURIComponent(projectId)}`, {
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
            
            const retryData: Cohort[] = await retryResponse.json()
            return retryData
          } else {
            // Token refresh failed, redirect to login
            clearAuthCookies()
            router.push('/login')
            return []
          }
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data: Cohort[] = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch cohorts:', error)
      setApiError(error instanceof Error ? error.message : 'Failed to fetch cohorts')
      return []
    } finally {
      setApiLoading(false)
    }
  }

  // Calculate stats from cohort data
 const calculateStats = (cohorts: Cohort[], previousCohorts?: Cohort[]): Stats[] => {
  // Add null check for cohorts
  if (!cohorts || !Array.isArray(cohorts)) {
    return [
      { name: 'Total Cohorts', stat: '0', change: '+0', changeType: 'increase' },
      { name: 'Active Users', stat: '0', change: '+0', changeType: 'increase' },
      { name: 'Total Sessions', stat: '0', change: '+0', changeType: 'increase' },
      { name: 'Avg. Session Duration', stat: '0m 0s', change: '+0s', changeType: 'increase' },
    ];
  }

  const totalCohorts = cohorts.length;
  const totalUsers = cohorts.reduce((sum, cohort) => {
    // Add null check for cohort.users
    if (!cohort.users || !Array.isArray(cohort.users)) {
      return sum;
    }
    return sum + cohort.users.length;
  }, 0);

  const totalSessions = cohorts.reduce((sum, cohort) => {
  if (cohort.statistics?.totalSessions !== undefined) {
    return sum + cohort.statistics.totalSessions;
  }

  // Fallback to legacy calculation if no statistics present
  if (!cohort.stages || !Array.isArray(cohort.stages)) {
    return sum;
  }
  return sum + cohort.stages.reduce((stageSum, stage) => {
    if (!stage.stageStats) return stageSum;
    return stageSum + (stage.stageStats.overall || 0);
  }, 0);
}, 0);


  // Calculate active users (users with recent activity)
  const activeUsers = cohorts.reduce((sum, cohort) => {
    // Add null check for cohort.users
    if (!cohort.users || !Array.isArray(cohort.users)) {
      return sum;
    }
    const activeCohortUsers = cohort.users.filter(user => {
      // Add null check for user.statuses
      if (!user.statuses || !Array.isArray(user.statuses)) {
        return false;
      }
      return !user.disabled && user.statuses.length > 0;
    }).length;
    return sum + activeCohortUsers;
  }, 0);

  // Calculate average session duration based on actual data
  const avgSessionDuration = totalUsers > 0 ? Math.floor(totalSessions / totalUsers * 45) : 0;
  const avgDurationMinutes = Math.floor(avgSessionDuration / 60);
  const avgDurationSeconds = avgSessionDuration % 60;

  // Calculate changes (you can implement logic to compare with previous data)
  const cohortChange = previousCohorts ? totalCohorts - previousCohorts.length : 0;
  const userChange = previousCohorts ? totalUsers - previousCohorts.reduce((sum, c) => {
    if (!c.users || !Array.isArray(c.users)) return sum;
    return sum + c.users.length;
  }, 0) : 0;
  const sessionChange = previousCohorts ? totalSessions - previousCohorts.reduce((sum, c) => {
    if (!c.stages || !Array.isArray(c.stages)) return sum;
    return sum + c.stages.reduce((s, stage) => {
      if (!stage.stageStats) return s;
      return s + (stage.stageStats.overall || 0);
    }, 0);
  }, 0) : 0;

  return [
    { 
      name: 'Total Cohorts', 
      stat: totalCohorts.toString(), 
      change: cohortChange >= 0 ? `+${cohortChange}` : cohortChange.toString(), 
      changeType: cohortChange >= 0 ? 'increase' : 'decrease' 
    },
    { 
      name: 'Active Users', 
      stat: activeUsers.toLocaleString(), 
      change: userChange >= 0 ? `+${userChange}` : userChange.toString(), 
      changeType: userChange >= 0 ? 'increase' : 'decrease' 
    },
    { 
      name: 'Total Sessions', 
      stat: totalSessions.toLocaleString(), 
      change: sessionChange >= 0 ? `+${sessionChange}` : sessionChange.toString(), 
      changeType: sessionChange >= 0 ? 'increase' : 'decrease' 
    },
    { 
      name: 'Avg. Session Duration', 
      stat: avgSessionDuration > 0 ? `${avgDurationMinutes}m ${avgDurationSeconds}s` : '0m 0s', 
      change: '+30s', 
      changeType: 'increase' 
    },
  ];
};
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('currentProject')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed?.cohortCount !== undefined) {
            setExpectedCohortCount(parsed.cohortCount)
          }
        } catch (e) {
          console.warn('Failed to parse sessionStorage project data')
        }
      }
    }
  }, [])

  // Load project and cohorts data on component mount
  useEffect(() => {
    const loadProjectData = async () => {
      if (!userInfo || !projectId) return

      try {
        const projectData = await fetchProject(projectId)
        setProject(projectData)

        const cohortData = await fetchCohortsByProject(projectId)
        setCohorts(cohortData)

        const calculatedStats = calculateStats(cohortData)
        setStats(calculatedStats)
        
        await loadNavigationData(userInfo.email)

      } catch (error) {
        console.error('Failed to load project data:', error)
      }
    }

    loadProjectData()
  }, [userInfo, projectId, loadNavigationData])

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {projectLoading ? 'Loading...' : project?.name || 'Project'}
        </h1>
        {project?.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">{project.description}</p>
        )}
        {(apiLoading || projectLoading) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading project data...</p>
        )}
        {apiError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">Error: {apiError}</p>
        )}
      </div>
      
      {/* Stats Grid - FIXED: Added key prop */}
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
                  {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                </span>
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>
      <div className="bg-white shadow rounded-lg">
  <div className="px-4 py-5 sm:px-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Cohorts</h3>
      {(apiLoading || projectLoading) && (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
      )}
    </div>
  </div>
  <div className="border-t border-gray-200">
    {(apiLoading || projectLoading) ? (
      <ul role="list" className="divide-y divide-gray-200">
        {Array.from({ length: expectedCohortCount ?? 5 }).map((_, i) => (
          <li key={`skeleton-cohort-${i}`} className="px-4 py-4">
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
    ) : cohorts.length === 0 ? (
      <div className="px-4 py-8 text-center text-gray-500">
        {apiError ? 'Failed to load cohorts' : 'No cohorts found for this project'}
      </div>
    ) : (
      <ul role="list" className="divide-y divide-gray-200">
        {cohorts.map((cohort) => {
  // Add null checks for cohort.stages and cohort.users
  const stages = cohort.stages || [];
  const users = cohort.users || [];
  
  const totalSessions =
  cohort.statistics?.totalSessions ??
  stages.reduce((sum, stage) => {
    if (!stage.stageStats) return sum;
    return sum + (stage.stageStats.overall || 0);
  }, 0);

  
  const activeUsers = users.filter(user => {
    if (!user.statuses || !Array.isArray(user.statuses)) return false;
    return !user.disabled && user.statuses.length > 0;
  }).length;

  return (
    <li key={`cohort-${cohort.id}`}>
      <Link
        href={`/app/projects/${projectId}/cohorts/${cohort.id}`}
        className="block hover:bg-gray-50 transition-colors"
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="truncate text-sm font-medium text-indigo-600">
                {cohort.cohortName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Version: {cohort.version}
              </p>
            </div>
            <div className="ml-2 flex flex-shrink-0">
              <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                Started {new Date(cohort.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                {users.length} total users
              </p>
              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                {activeUsers} active users
              </p>
              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                {totalSessions} sessions
              </p>
              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                {stages.length} stages
              </p>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
})}
      </ul>
    )}
  </div>
</div>
    </div>
  )
}