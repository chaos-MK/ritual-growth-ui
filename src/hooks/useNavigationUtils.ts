// hooks/useNavigationUtils.ts
'use client'

import { useMemo } from 'react'
import { useNavigationStore } from '@/app/stores/navigationStore'
import { useNavigationContext } from './useNavigationContext'

// Hook for getting navigation level information
export function useNavigationLevel() {
  const { currentContext } = useNavigationContext()
  
  const level = useMemo(() => {
    if (currentContext.sessionId) return 'session'
    if (currentContext.userId) return 'user'
    if (currentContext.cohortId) return 'cohort'
    if (currentContext.projectId) return 'project'
    return 'company'
  }, [currentContext])

  const depth = useMemo(() => {
    let depth = 0
    if (currentContext.projectId) depth++
    if (currentContext.cohortId) depth++
    if (currentContext.userId) depth++
    if (currentContext.sessionId) depth++
    return depth
  }, [currentContext])

  return { level, depth }
}

// Hook for getting current navigation paths
export function useNavigationPaths() {
  const { currentContext } = useNavigationContext()
  
  const paths = useMemo(() => {
    const { projectId, cohortId, userId, sessionId } = currentContext
    
    return {
      company: '/app/index',
      project: projectId ? `/app/projects/${projectId}` : '',
      cohort: projectId && cohortId ? `/app/projects/${projectId}/cohorts/${cohortId}` : '',
      user: projectId && cohortId && userId 
        ? `/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}` : '',
      session: projectId && cohortId && userId && sessionId 
        ? `/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}/sessions/${sessionId}` : ''
    }
  }, [currentContext])

  return paths
}

// Hook for navigation tree manipulation
export function useTreeManipulation() {
  const {
    toggleNodeExpansion,
    expandNode,
    collapseNode,
    setActiveNode,
    setNodeLoading,
    updateNodeChildren
  } = useNavigationStore()

  const expandToLevel = (targetLevel: 'project' | 'cohort' | 'user' | 'session') => {
    const { currentContext } = useNavigationContext()
    const nodesToExpand: string[] = []

    // Always expand company
    nodesToExpand.push('company')

    if (targetLevel === 'project' || targetLevel === 'cohort' || targetLevel === 'user' || targetLevel === 'session') {
      if (currentContext.projectId) {
        nodesToExpand.push(`project-${currentContext.projectId}`)
      }
    }

    if (targetLevel === 'cohort' || targetLevel === 'user' || targetLevel === 'session') {
      if (currentContext.projectId && currentContext.cohortId) {
        nodesToExpand.push(`cohort-${currentContext.projectId}-${currentContext.cohortId}`)
      }
    }

    if (targetLevel === 'user' || targetLevel === 'session') {
      if (currentContext.projectId && currentContext.cohortId && currentContext.userId) {
        nodesToExpand.push(`user-${currentContext.projectId}-${currentContext.cohortId}-${currentContext.userId}`)
      }
    }

    nodesToExpand.forEach(nodeId => expandNode(nodeId))
  }

  const collapseAll = () => {
    const { navigationTree } = useNavigationStore.getState()
    const collapseRecursive = (nodes: any[]) => {
      nodes.forEach(node => {
        collapseNode(node.id)
        if (node.children) {
          collapseRecursive(node.children)
        }
      })
    }
    collapseRecursive(navigationTree)
  }

  return {
    toggleNodeExpansion,
    expandNode,
    collapseNode,
    setActiveNode,
    setNodeLoading,
    updateNodeChildren,
    expandToLevel,
    collapseAll
  }
}

// Hook for getting navigation metadata
export function useNavigationMetadata() {
  const { navigationTree } = useNavigationStore()
  const { currentContext } = useNavigationContext()

  const metadata = useMemo(() => {
    const findNode = (nodes: any[], targetId: string): any => {
      for (const node of nodes) {
        if (node.id === targetId) return node
        if (node.children) {
          const found = findNode(node.children, targetId)
          if (found) return found
        }
      }
      return null
    }

    const getCurrentNodeId = () => {
      const { projectId, cohortId, userId, sessionId } = currentContext
      
      if (sessionId && userId && cohortId && projectId) {
        return `session-${projectId}-${cohortId}-${userId}-${sessionId}`
      }
      if (userId && cohortId && projectId) {
        return `user-${projectId}-${cohortId}-${userId}`
      }
      if (cohortId && projectId) {
        return `cohort-${projectId}-${cohortId}`
      }
      if (projectId) {
        return `project-${projectId}`
      }
      return 'company'
    }

    const currentNodeId = getCurrentNodeId()
    const currentNode = findNode(navigationTree, currentNodeId)

    return {
      currentNode,
      currentNodeId,
      hasChildren: currentNode?.children && currentNode.children.length > 0,
      isExpanded: currentNode?.isExpanded || false,
      metadata: currentNode?.metadata
    }
  }, [navigationTree, currentContext])

  return metadata
}

// Hook for handling navigation events
export function useNavigationEvents() {
  const { setActiveNode } = useNavigationStore()
  const { updateContext } = useNavigationContext()

  const handleNodeClick = (nodeId: string, href: string) => {
    setActiveNode(nodeId)
    
    // Parse the href to update context
    const segments = href.split('/').filter(Boolean)
    const newContext: any = {}
    
    const projectIndex = segments.indexOf('projects')
    if (projectIndex !== -1 && segments[projectIndex + 1]) {
      newContext.projectId = segments[projectIndex + 1]
    }
    
    const cohortIndex = segments.indexOf('cohorts')
    if (cohortIndex !== -1 && segments[cohortIndex + 1]) {
      newContext.cohortId = segments[cohortIndex + 1]
    }
    
    const userIndex = segments.indexOf('users')
    if (userIndex !== -1 && segments[userIndex + 1]) {
      newContext.userId = segments[userIndex + 1]
    }
    
    const sessionIndex = segments.indexOf('sessions')
    if (sessionIndex !== -1 && segments[sessionIndex + 1]) {
      newContext.sessionId = segments[sessionIndex + 1]
    }
    
    updateContext(newContext)
  }

  return { handleNodeClick }
}

// Convenience hook that combines commonly used navigation functionality
export function useNavigation() {
  const navigationContext = useNavigationContext()
  const navigationLevel = useNavigationLevel()
  const navigationPaths = useNavigationPaths()
  const treeManipulation = useTreeManipulation()
  const navigationMetadata = useNavigationMetadata()
  const navigationEvents = useNavigationEvents()

  return {
    ...navigationContext,
    ...navigationLevel,
    paths: navigationPaths,
    tree: treeManipulation,
    metadata: navigationMetadata,
    events: navigationEvents
  }
}