// useNavigation.ts
import { create } from 'zustand'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo, useEffect, useRef } from 'react'

// Navigation node type
export interface NavigationNode {
  id: string
  name: string
  type: 'company' | 'project' | 'cohort' | 'user' | 'session'
  href: string
  isExpanded?: boolean
  isActive?: boolean
  isLoading?: boolean
  children?: NavigationNode[]
  metadata?: {
    count?: number
    cohortCount?: number
    [key: string]: any
  }
}

// Project data type from API
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

// Cohort data type from API
interface CohortDTO {
  cohortId: string
  cohortName: string
  projectId: string
  userCount: number
  sessionCount: number
}

// Navigation state
interface NavigationState {
  tree: NavigationNode[]
  activeNodeId: string | null
  expandedNodes: Set<string>
  isLoading: boolean
  projectsListExpanded: boolean
  cohortsListExpanded: Map<string, boolean> // Map projectId to expansion state
  
  // Actions
  setTree: (tree: NavigationNode[]) => void
  setActiveNode: (id: string) => void
  toggleExpansion: (id: string) => void
  setNodeLoading: (id: string, loading: boolean) => void
  setLoading: (loading: boolean) => void
  setProjectsListExpanded: (expanded: boolean) => void
  setCohortsListExpanded: (projectId: string, expanded: boolean) => void
  loadNavigationData: (userEmail: string) => Promise<void>
  loadCohortData: (projectId: string, userEmail: string) => Promise<void>
}

const useNavigationStore = create<NavigationState>((set, get) => ({
  tree: [],
  activeNodeId: null,
  expandedNodes: new Set(),
  isLoading: true,
  projectsListExpanded: false,
  cohortsListExpanded: new Map(),
  
  setTree: (tree) => set({ tree }),
  
  setActiveNode: (id) => {
    set({ activeNodeId: id })
    const updateActiveState = (nodes: NavigationNode[]): NavigationNode[] => {
      return nodes.map(node => ({
        ...node,
        isActive: node.id === id,
        children: node.children ? updateActiveState(node.children) : undefined
      }))
    }
    set(state => ({ tree: updateActiveState(state.tree) }))
  },
  
  toggleExpansion: (id) => {
    const { expandedNodes } = get()
    const newExpanded = new Set(expandedNodes)
    
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    
    set({ expandedNodes: newExpanded })
    
    const updateExpansionState = (nodes: NavigationNode[]): NavigationNode[] => {
      return nodes.map(node => ({
        ...node,
        isExpanded: newExpanded.has(node.id),
        children: node.children ? updateExpansionState(node.children) : undefined
      }))
    }
    set(state => ({ tree: updateExpansionState(state.tree) }))
  },
  
  setNodeLoading: (id, loading) => {
    const updateLoadingState = (nodes: NavigationNode[]): NavigationNode[] => {
      return nodes.map(node => ({
        ...node,
        isLoading: node.id === id ? loading : node.isLoading,
        children: node.children ? updateLoadingState(node.children) : undefined
      }))
    }
    set(state => ({ tree: updateLoadingState(state.tree) }))
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setProjectsListExpanded: (expanded) => set({ projectsListExpanded: expanded }),
  
  setCohortsListExpanded: (projectId, expanded) => {
    set(state => ({
      cohortsListExpanded: new Map(state.cohortsListExpanded).set(projectId, expanded)
    }))
  },
  
  loadNavigationData: async (userEmail: string) => {
    set({ isLoading: true })
    
    try {
      const authToken = `testtoken:${userEmail}`
      
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

      const projects: ProjectDTO[] = await response.json()
      
      const companyNode: NavigationNode = {
        id: 'company',
        name: projects[0]?.companyName || 'Example Company',
        type: 'company',
        href: '/app/index',
        isExpanded: false,
        isActive: false,
        metadata: {
          count: projects.length
        },
        children: projects.map(project => ({
          id: `${project.projectId}`,
          name: project.projectName,
          type: 'project' as const,
          href: `/app/projects/${project.projectId}`,
          isExpanded: false,
          isActive: false,
          metadata: {
            count: project.cohortCount,
            cohortCount: project.cohortCount,
            userCount: project.userCount,
            sessionCount: project.sessionCount,
            status: project.overallStatus,
            website: project.projectWebsite
          },
          children: [] // Cohorts will be loaded on demand
        }))
      }
      
      set({ tree: [companyNode], isLoading: false })
    } catch (error) {
      console.error('Failed to load navigation data:', error)
      set({ isLoading: false })
    }
  },

  loadCohortData: async (projectId: string, userEmail: string) => {
    try {
      const authToken = `testtoken:${userEmail}`
      
      const response = await fetch(`http://localhost:8080/project/${projectId}/cohorts`, {
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

      const cohorts: CohortDTO[] = await response.json()
      
      set(state => {
        const updateTree = (nodes: NavigationNode[]): NavigationNode[] => {
          return nodes.map(node => {
            if (node.type === 'project' && node.id === projectId) {
              return {
                ...node,
                children: cohorts.map(cohort => ({
                  id: `${projectId}-${cohort.cohortId}`,
                  name: cohort.cohortName,
                  type: 'cohort' as const,
                  href: `/app/projects/${projectId}/cohorts/${cohort.cohortId}`,
                  isExpanded: false,
                  isActive: false,
                  metadata: {
                    count: cohort.userCount,
                    sessionCount: cohort.sessionCount
                  },
                  children: []
                }))
              }
            }
            return {
              ...node,
              children: node.children ? updateTree(node.children) : undefined
            }
          })
        }
        
        return {
          tree: updateTree(state.tree)
        }
      })
    } catch (error) {
      console.error('Failed to load cohort data:', error)
    }
  }
}))

interface NavigationContext {
  projectId?: string
  cohortId?: string
  userId?: string
  sessionId?: string
}

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const didExpandRef = useRef(false)
  
  const {
    tree,
    activeNodeId,
    expandedNodes,
    isLoading,
    projectsListExpanded,
    cohortsListExpanded,
    setTree,
    setActiveNode,
    toggleExpansion,
    setNodeLoading,
    setLoading,
    setProjectsListExpanded,
    setCohortsListExpanded,
    loadNavigationData,
    loadCohortData
  } = useNavigationStore()

  const currentContext = useMemo((): NavigationContext => {
    const segments = pathname.split('/').filter(Boolean)
    const context: NavigationContext = {}
    
    const projectIndex = segments.indexOf('projects')
    if (projectIndex !== -1 && segments[projectIndex + 1]) {
      context.projectId = segments[projectIndex + 1]
    }
    
    const cohortIndex = segments.indexOf('cohorts')
    if (cohortIndex !== -1 && segments[cohortIndex + 1]) {
      context.cohortId = segments[cohortIndex + 1]
    }
    
    const userIndex = segments.indexOf('users')
    if (userIndex !== -1 && segments[userIndex + 1]) {
      context.userId = segments[userIndex + 1]
    }
    
    const sessionIndex = segments.indexOf('sessions')
    if (sessionIndex !== -1 && segments[sessionIndex + 1]) {
      context.sessionId = segments[sessionIndex + 1]
    }
    
    return context
  }, [pathname])

  const currentLevel = useMemo(() => {
    if (currentContext.sessionId) return 'session'
    if (currentContext.userId) return 'user'
    if (currentContext.cohortId) return 'cohort'
    if (currentContext.projectId) return 'project'
    return 'company'
  }, [currentContext])

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ name: 'Company', href: '/app/index' }]
    
    if (currentContext.projectId) {
      crumbs.push({
        name: 'Project',
        href: `/app/projects/${currentContext.projectId}`
      })
    }
    
    if (currentContext.cohortId) {
      crumbs.push({
        name: 'Cohort',
        href: `/app/projects/${currentContext.projectId}/cohorts/${currentContext.cohortId}`
      })
    }
    
    if (currentContext.userId) {
      crumbs.push({
        name: 'User',
        href: `/app/projects/${currentContext.projectId}/cohorts/${currentContext.cohortId}/users/${currentContext.userId}`
      })
    }
    
    if (currentContext.sessionId) {
      crumbs.push({
        name: 'Session',
        href: `/app/projects/${currentContext.projectId}/cohorts/${currentContext.cohortId}/users/${currentContext.userId}/sessions/${currentContext.sessionId}`
      })
    }
    
    return crumbs
  }, [currentContext])

  const navigateTo = useCallback((level: string, ids: Record<string, string>) => {
    let path = '/app'
    
    if (level === 'company') {
      path = '/app/index'
    } else if (level === 'project' && ids.projectId) {
      path = `/app/projects/${ids.projectId}`
    } else if (level === 'cohort' && ids.projectId && ids.cohortId) {
      path = `/app/projects/${ids.projectId}/cohorts/${ids.cohortId}`
    } else if (level === 'user' && ids.projectId && ids.cohortId && ids.userId) {
      path = `/app/projects/${ids.projectId}/cohorts/${ids.cohortId}/users/${ids.userId}`
    } else if (level === 'session' && ids.projectId && ids.cohortId && ids.userId && ids.sessionId) {
      path = `/app/projects/${ids.projectId}/cohorts/${ids.cohortId}/users/${ids.userId}/sessions/${ids.sessionId}`
    }
    
    router.push(path)
  }, [router])

  const handleNodeClick = useCallback(async (nodeId: string, href: string) => {
    setNodeLoading(nodeId, true)
    setActiveNode(nodeId)
    
    try {
      await router.push(href)
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setNodeLoading(nodeId, false)
    }
  }, [router, setActiveNode, setNodeLoading])

  useEffect(() => {
    if (currentContext.projectId && !projectsListExpanded) {
      setProjectsListExpanded(true)
    }
    if (currentContext.projectId && currentContext.cohortId && !cohortsListExpanded.get(currentContext.projectId)) {
      setCohortsListExpanded(currentContext.projectId, true)
    }
  }, [currentContext, projectsListExpanded, cohortsListExpanded, setProjectsListExpanded, setCohortsListExpanded])

  useEffect(() => {
    if (didExpandRef.current) return

    const pathToExpand = []
    if (currentContext.projectId) {
      pathToExpand.push(`${currentContext.projectId}`)
    }
    if (currentContext.cohortId) {
      pathToExpand.push(`${currentContext.projectId}-${currentContext.cohortId}`)
    }
    if (currentContext.userId) {
      pathToExpand.push(`${currentContext.projectId}-${currentContext.cohortId}-${currentContext.userId}`)
    }

    let didToggle = false
    pathToExpand.forEach(nodeId => {
      if (!expandedNodes.has(nodeId)) {
        toggleExpansion(nodeId)
        didToggle = true
      }
    })

    if (didToggle) {
      didExpandRef.current = true
    }
  }, [currentContext, expandedNodes, toggleExpansion])

  useEffect(() => {
    if (currentContext.sessionId) {
      setActiveNode(`${currentContext.projectId}-${currentContext.cohortId}-${currentContext.userId}-${currentContext.sessionId}`)
    } else if (currentContext.userId) {
      setActiveNode(`${currentContext.projectId}-${currentContext.cohortId}-${currentContext.userId}`)
    } else if (currentContext.cohortId) {
      setActiveNode(`${currentContext.projectId}-${currentContext.cohortId}`)
    } else if (currentContext.projectId) {
      setActiveNode(`${currentContext.projectId}`)
    } else {
      setActiveNode('company')
    }
  }, [currentContext, setActiveNode])

  return {
    tree,
    activeNodeId,
    expandedNodes,
    projectsListExpanded,
    cohortsListExpanded,
    currentContext,
    currentLevel,
    breadcrumbs,
    isLoading,
    setTree,
    setActiveNode,
    toggleExpansion,
    setNodeLoading,
    setProjectsListExpanded,
    setCohortsListExpanded,
    handleNodeClick,
    navigateTo,
    loadNavigationData,
    loadCohortData
  }
}