// hooks/useNavigationContext.ts
'use client'

import { useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useNavigationStore } from '@/app/stores/navigationStore'

interface NavigationContextParams {
  projectId?: string | null
  cohortId?: string | null
  userId?: string | null
  sessionId?: string | null
}

interface UseNavigationContextOptions {
  autoUpdateFromUrl?: boolean
  generateBreadcrumbs?: boolean
  expandPath?: boolean
}

export function useNavigationContext(
  params?: NavigationContextParams,
  options: UseNavigationContextOptions = {}
) {
  const {
    autoUpdateFromUrl = false,
    generateBreadcrumbs = true,
    expandPath = true
  } = options

  const pathname = usePathname()
  const router = useRouter()
  
  const {
    setNavigationContext,
    setBreadcrumbs,
    expandPath: expandNodePath,
    buildNavigationTree,
    setNavigationTree,
    currentProjectId,
    currentCohortId,
    currentUserId,
    currentSessionId,
    breadcrumbs
  } = useNavigationStore()

  // Parse URL to extract navigation parameters
  const parseUrlParams = useCallback((): NavigationContextParams => {
    const segments = pathname.split('/').filter(Boolean)
    
    // Expected URL structure: /app/projects/[id]/cohorts/[cohortId]/users/[userId]/sessions/[sessionId]
    const urlParams: NavigationContextParams = {}
    
    const projectIndex = segments.indexOf('projects')
    if (projectIndex !== -1 && segments[projectIndex + 1]) {
      urlParams.projectId = segments[projectIndex + 1]
    }
    
    const cohortIndex = segments.indexOf('cohorts')
    if (cohortIndex !== -1 && segments[cohortIndex + 1]) {
      urlParams.cohortId = segments[cohortIndex + 1]
    }
    
    const userIndex = segments.indexOf('users')
    if (userIndex !== -1 && segments[userIndex + 1]) {
      urlParams.userId = segments[userIndex + 1]
    }
    
    const sessionIndex = segments.indexOf('sessions')
    if (sessionIndex !== -1 && segments[sessionIndex + 1]) {
      urlParams.sessionId = segments[sessionIndex + 1]
    }
    
    return urlParams
  }, [pathname])

  // Update navigation context
  const updateContext = useCallback((contextParams: NavigationContextParams) => {
    // Set the navigation context
    setNavigationContext(contextParams)
    
    // Build and set the navigation tree
    const newTree = buildNavigationTree()
    setNavigationTree(newTree)
    
    // Generate breadcrumbs if enabled
    if (generateBreadcrumbs) {
      const newBreadcrumbs = useNavigationStore.getState().generateBreadcrumbs()
      setBreadcrumbs(newBreadcrumbs)
    }
    
    // Expand path if enabled
    if (expandPath) {
      const pathToExpand: string[] = []
      
      if (contextParams.projectId) {
        pathToExpand.push(`project-${contextParams.projectId}`)
      }
      if (contextParams.projectId && contextParams.cohortId) {
        pathToExpand.push(`cohort-${contextParams.projectId}-${contextParams.cohortId}`)
      }
      if (contextParams.projectId && contextParams.cohortId && contextParams.userId) {
        pathToExpand.push(`user-${contextParams.projectId}-${contextParams.cohortId}-${contextParams.userId}`)
      }
      
      if (pathToExpand.length > 0) {
        expandNodePath(pathToExpand)
      }
    }
  }, [setNavigationContext, buildNavigationTree, setNavigationTree, generateBreadcrumbs, setBreadcrumbs, expandPath, expandNodePath])

  // Initialize context from props or URL
  useEffect(() => {
    let contextParams: NavigationContextParams
    
    if (params) {
      // Use provided parameters
      contextParams = params
    } else if (autoUpdateFromUrl) {
      // Parse from URL
      contextParams = parseUrlParams()
    } else {
      // No update needed
      return
    }
    
    // Check if context actually changed to avoid unnecessary updates
    const hasChanged = 
      contextParams.projectId !== currentProjectId ||
      contextParams.cohortId !== currentCohortId ||
      contextParams.userId !== currentUserId ||
      contextParams.sessionId !== currentSessionId
    
    if (hasChanged) {
      updateContext(contextParams)
    }
  }, [
    params,
    autoUpdateFromUrl,
    parseUrlParams,
    updateContext,
    currentProjectId,
    currentCohortId,
    currentUserId,
    currentSessionId
  ])

  // Navigation helpers
  const navigateToProject = useCallback((projectId: string) => {
    router.push(`/app/projects/${projectId}`)
  }, [router])

  const navigateToCohort = useCallback((projectId: string, cohortId: string) => {
    router.push(`/app/projects/${projectId}/cohorts/${cohortId}`)
  }, [router])

  const navigateToUser = useCallback((projectId: string, cohortId: string, userId: string) => {
    router.push(`/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}`)
  }, [router])

  const navigateToSession = useCallback((projectId: string, cohortId: string, userId: string, sessionId: string) => {
    router.push(`/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}/sessions/${sessionId}`)
  }, [router])

  const navigateUp = useCallback(() => {
    if (currentSessionId && currentUserId && currentCohortId && currentProjectId) {
      navigateToUser(currentProjectId, currentCohortId, currentUserId)
    } else if (currentUserId && currentCohortId && currentProjectId) {
      navigateToCohort(currentProjectId, currentCohortId)
    } else if (currentCohortId && currentProjectId) {
      navigateToProject(currentProjectId)
    } else if (currentProjectId) {
      router.push('/app/index')
    }
  }, [currentProjectId, currentCohortId, currentUserId, currentSessionId, navigateToProject, navigateToCohort, navigateToUser, router])

  return {
    // Current context
    currentContext: {
      projectId: currentProjectId,
      cohortId: currentCohortId,
      userId: currentUserId,
      sessionId: currentSessionId
    },
    
    // Breadcrumbs
    breadcrumbs,
    
    // Navigation helpers
    navigateToProject,
    navigateToCohort,
    navigateToUser,
    navigateToSession,
    navigateUp,
    
    // Manual context update
    updateContext,
    
    // URL parsing helper
    parseUrlParams
  }
}