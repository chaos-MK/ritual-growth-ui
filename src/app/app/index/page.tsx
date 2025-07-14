//company summary - cleaned for navigation tree compatibility

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Navigation from '@/components/Navigation'
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon, ArrowRightOnRectangleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useNavigation } from '@/hooks/useNavigation'
import { useNavigationActions } from '@/app/stores/navigationStore'

// API Types based on the Swagger schema
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

interface Project {
  id: string
  projectName: string
  projectWebsite: string
  cohort: Cohort[]
}

interface UserInfo {
  token: string
  email: string
  userId: string
  displayName: string
}

interface ProjectDTO {
  projectId: string
  projectName: string
  projectWebsite: string
  startDate: string
  endDate: string
  duration: string
  overallStatus: string
  hasGraphs: boolean
  hasDashboard: boolean
  companyId: number
  companyName: string
  userCount: number
  sessionCount: number
  cohortCount: number
}

interface Stats {
  name: string
  stat: string
  change: string
  changeType: 'increase' | 'decrease'
}

export default function CompanySummary() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [projects, setProjects] = useState<ProjectDTO[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const { loadNavigationData } = useNavigation()
  const { setNavigationContext } = useNavigationActions()

  const handleProjectClick = (project: ProjectDTO) => {
    const projectData = {
      id: project.projectId,
      name: project.projectName,
      website: project.projectWebsite,
      userCount: project.userCount,
      sessionCount: project.sessionCount,
      status: project.overallStatus,
      cohortCount: project.cohortCount
    }
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('currentProject', JSON.stringify(projectData))
    }

    setNavigationContext({ projectId: project.projectId }) // Sync navigation state

    router.push(`/app/projects/${project.projectId}`)
  }


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
        // Refresh the token to ensure it's valid
        const freshToken = await currentUser.getIdToken(true)
        
        // Update the token in cookies
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

  // Fetch projects from API
  const fetchProjects = async (): Promise<ProjectDTO[]> => {
  setApiLoading(true)
  setApiError(null)

  const authToken = `testtoken:${userInfo?.email}`
  
  try {
    const response = await fetch('http://localhost:8080/project', {
      method: 'GET',
      headers: {
        'hippo-api-version': '1.0.0',
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data: ProjectDTO[] = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    setApiError(error instanceof Error ? error.message : 'Failed to fetch projects')
    return []
  } finally {
    setApiLoading(false)
  }
}

  // Calculate stats from project data
  const calculateStats = (projects: ProjectDTO[]): Stats[] => {
  const totalProjects = projects.length
  const totalUsers = projects.reduce((sum, project) => sum + (project.userCount || 0), 0)
  const totalSessions = projects.reduce((sum, project) => sum + (project.sessionCount || 0), 0)
  const totalCohorts = projects.reduce((sum, project) => sum + (project.cohortCount || 0), 0)

  return [
    { name: 'Total Projects', stat: totalProjects.toString(), change: '+2', changeType: 'increase' },
    { name: 'Total Cohorts', stat: totalCohorts.toString(), change: '+4', changeType: 'increase' },
    { name: 'Total Users', stat: totalUsers.toLocaleString(), change: '+123', changeType: 'increase' },
    { name: 'Total Sessions', stat: totalSessions.toLocaleString(), change: '+567', changeType: 'increase' },
  ]
}



  // Empty edit function - implement later
  const handleEditProject = (project: ProjectDTO, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent project click
    console.log('Edit project:', project.projectId)
    // TODO: Implement edit functionality
    // This could open a modal, navigate to edit page, etc.
  }

  // Empty delete function - implement later
  const handleDeleteProject = async (project: ProjectDTO, event: React.MouseEvent) => {
  event.stopPropagation()
  
  const confirmed = window.confirm(
    `Are you sure you want to delete the project "${project.projectName}"? This action cannot be undone.`
  )
  
  if (!confirmed) return

  if (!userInfo?.email) {
    console.error('User email not available')
    alert('Error: User authentication required')
    return
  }

  const authToken = `testtoken:${userInfo.email}`

  try {
    setApiLoading(true)
    setApiError(null)

    const response = await fetch(
      `http://localhost:8080/project/projectdelete/${project.projectId}`,
      {
        method: 'DELETE',
        headers: {
          'hippo-api-version': '1.0.0',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Failed to delete project: ${response.status} ${errorData}`)
    }

    const updatedProjects = projects.filter(p => p.projectId !== project.projectId)
    setProjects(updatedProjects)
    
    const updatedStats = calculateStats(updatedProjects)
    setStats(updatedStats)
    
    console.log(`Project "${project.projectName}" deleted successfully`)
    
    // Trigger a page refresh to update the navigation tree
    router.refresh()
    
  } catch (error) {
    console.error('Error deleting project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete project'
    setApiError(errorMessage)
    alert(`Error deleting project: ${errorMessage}`)
  } finally {
    setApiLoading(false)
  }
}

  // Load data on component mount
  useEffect(() => {
  const loadData = async () => {
    if (!userInfo) return

    try {
      const projectData = await fetchProjects()
      setProjects(projectData)

      const calculatedStats = calculateStats(projectData)
      setStats(calculatedStats)

      // Sync navigation tree
      await loadNavigationData(userInfo.email)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  loadData()
}, [userInfo, loadNavigationData])


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userToken = getCookie('userToken')
        const userEmail = getCookie('userEmail')
        const userId = getCookie('userId')
        const userDisplayName = getCookie('userDisplayName')
        const emailVerified = getCookie('emailVerified')
        
        if (!userToken || !userEmail || !userId) {
          console.log('Missing auth cookies, redirecting to login')
          router.push('/login')
          return
        }

        // Validate the token is still valid
        const isTokenValid = await validateToken()
        if (!isTokenValid) {
          console.log('Token validation failed, redirecting to login')
          clearAuthCookies()
          router.push('/login')
          return
        }

        // Set user info from individual cookies
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

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && !isLoading) {
        // User is signed out
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
      {/* Header with user info and logout */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Overview</h1>
        {apiLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading project data...</p>
        )}
        {apiError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">Error: {apiError}</p>
        )}
      </div>
      
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
                  {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                </span>
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Projects List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Projects</h3>
            {apiLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200">
          {apiLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="animate-pulse space-y-4">
                {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((id) => (
                  <div key={id} className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              {apiError ? 'Failed to load projects' : 'No projects found'}
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {projects.map((project) => (
                <li key={project.projectId}>
                  <div className="hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                      <button
                        onClick={() => handleProjectClick(project)}
                        className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset rounded-md"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <p className="truncate text-sm font-medium text-indigo-600">
                                {project.projectName}
                              </p>
                              {project.projectWebsite && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {project.projectWebsite}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <div className="ml-2 flex flex-shrink-0">
                                <p className="inline-flex rounded-full bg-green-100 px-2 text-sm font-semibold leading-5 text-green-800">
                                  {(project.cohortCount || 0).toLocaleString()} cohorts
                                </p>
                              </div>
                              <p className="flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                {(project.userCount || 0).toLocaleString()} users
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                {(project.sessionCount || 0).toLocaleString()} sessions
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>

                        {/* Action buttons - always visible on hover */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => handleEditProject(project, e)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="Edit project"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProject(project, e)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Delete project"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}