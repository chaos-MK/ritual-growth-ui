// stores/navigationStore.ts
import { create } from 'zustand/react'
import { devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

export interface Breadcrumb {
  name: string
  href: string
  isActive?: boolean
}

export interface UserInfo {
  token: string
  email: string
  userId: string
  displayName: string
  emailVerified?: boolean
}

export interface NavigationTreeNode {
  id: string
  name: string
  href: string
  icon?: string
  isExpanded: boolean
  isActive: boolean
  isLoading?: boolean
  level: number
  children?: NavigationTreeNode[]
  parent?: string
  type: 'company' | 'project' | 'cohort' | 'user' | 'session'
  metadata?: {
    count?: number
    status?: string
    lastUpdated?: string
    projectsData?: any[] // For company level - array of all projects
    projectData?: any    // For project level - single project data
    cohortData?: any     // For cohort level - single cohort data
    userData?: any
  }
}

export interface NavigationState {
  // Breadcrumbs
  breadcrumbs: Breadcrumb[]
  
  // Navigation Tree
  navigationTree: NavigationTreeNode[]
  expandedNodes: Set<string>
  
  // User state
  userInfo: UserInfo | null
  isLoading: boolean
  isLoggingOut: boolean
  
  // UI state
  isDropdownOpen: boolean
  isLanguageDropdownOpen: boolean
  isDarkMode: boolean
  
  // Current navigation context
  currentProjectId: string | null
  currentCohortId: string | null
  currentUserId: string | null
  currentSessionId: string | null
  
  // Tree actions
  setNavigationTree: (tree: NavigationTreeNode[]) => void
  toggleNodeExpansion: (nodeId: string) => void
  expandNode: (nodeId: string) => void
  collapseNode: (nodeId: string) => void
  expandPath: (nodeIds: string[]) => void
  setNodeLoading: (nodeId: string, isLoading: boolean) => void
  updateNodeChildren: (nodeId: string, children: NavigationTreeNode[]) => void
  setActiveNode: (nodeId: string) => void
  
  // Breadcrumb actions
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void
  updateBreadcrumb: (index: number, breadcrumb: Partial<Breadcrumb>) => void
  setNavigationContext: (context: {
    projectId?: string | null
    cohortId?: string | null
    userId?: string | null
    sessionId?: string | null
  }) => void
  
  // User actions
  setUserInfo: (userInfo: UserInfo | null) => void
  setIsLoading: (isLoading: boolean) => void
  setIsLoggingOut: (isLoggingOut: boolean) => void
  
  // UI actions
  setIsDropdownOpen: (isOpen: boolean) => void
  setIsLanguageDropdownOpen: (isOpen: boolean) => void
  setIsDarkMode: (isDarkMode: boolean) => void
  
  // Helper actions
  clearUserState: () => void
  generateBreadcrumbs: () => Breadcrumb[]
  toggleDropdown: () => void
  toggleLanguageDropdown: () => void
  toggleTheme: () => void
  closeAllDropdowns: () => void
  buildNavigationTree: () => NavigationTreeNode[]
  getActiveNodePath: () => string[]
}

// Helper function to create a navigation node
function createNavigationNode(
  id: string,
  name: string,
  href: string,
  type: NavigationTreeNode['type'],
  level: number,
  parent?: string,
  metadata?: NavigationTreeNode['metadata']
): NavigationTreeNode {
  return {
    id,
    name,
    href,
    type,
    level,
    parent,
    metadata,
    isExpanded: false,
    isActive: false,
    children: [],
  }
}

// Helper function to generate breadcrumbs from context
function generateBreadcrumbsFromContext(context: {
  currentProjectId: string | null
  currentCohortId: string | null
  currentUserId: string | null
  currentSessionId: string | null
}): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = []
  
  breadcrumbs.push({
    name: 'Company Summary',
    href: '/app/index'
  })
  
  if (context.currentProjectId) {
    breadcrumbs.push({
      name: 'Project Summary',
      href: `/app/projects/${context.currentProjectId}`
    })
  }
  
  if (context.currentProjectId && context.currentCohortId) {
    breadcrumbs.push({
      name: 'Cohort Summary',
      href: `/app/projects/${context.currentProjectId}/cohorts/${context.currentCohortId}`
    })
  }
  
  if (context.currentProjectId && context.currentCohortId && context.currentUserId) {
    breadcrumbs.push({
      name: 'User Summary',
      href: `/app/projects/${context.currentProjectId}/cohorts/${context.currentCohortId}/users/${context.currentUserId}`
    })
  }
  
  if (context.currentProjectId && context.currentCohortId && context.currentUserId && context.currentSessionId) {
    breadcrumbs.push({
      name: 'Session Summary',
      href: `/app/projects/${context.currentProjectId}/cohorts/${context.currentCohortId}/users/${context.currentUserId}/sessions/${context.currentSessionId}`
    })
  }
  
  return breadcrumbs
}

// Helper function to build navigation tree
function buildNavigationTreeFromContext(context: {
  currentProjectId: string | null
  currentCohortId: string | null
  currentUserId: string | null
  currentSessionId: string | null
}): NavigationTreeNode[] {
  const tree: NavigationTreeNode[] = []
  
  // Root level - Company Summary
  const companyNode = createNavigationNode(
    'company',
    'Company Summary',
    '/app/index',
    'company',
    0
  )
  
  tree.push(companyNode)
  return tree
}

// Helper function to get all expanded node IDs from tree
function getExpandedNodeIds(tree: NavigationTreeNode[]): string[] {
  const expandedIds: string[] = []
  
  function traverse(nodes: NavigationTreeNode[]) {
    nodes.forEach(node => {
      if (node.isExpanded) {
        expandedIds.push(node.id)
      }
      if (node.children) {
        traverse(node.children)
      }
    })
  }
  
  traverse(tree)
  return expandedIds
}

// Helper function to update tree node expansion state
function updateTreeNodeExpansion(
  tree: NavigationTreeNode[],
  nodeId: string,
  isExpanded: boolean
): NavigationTreeNode[] {
  function updateNode(nodes: NavigationTreeNode[]): NavigationTreeNode[] {
    return nodes.map(node => ({
      ...node,
      isExpanded: node.id === nodeId ? isExpanded : node.isExpanded,
      children: node.children ? updateNode(node.children) : undefined
    }))
  }
  
  return updateNode(tree)
}

// Helper function to set active node in tree
function updateTreeActiveNode(
  tree: NavigationTreeNode[],
  activeNodeId: string
): NavigationTreeNode[] {
  function updateNode(nodes: NavigationTreeNode[]): NavigationTreeNode[] {
    return nodes.map(node => ({
      ...node,
      isActive: node.id === activeNodeId,
      children: node.children ? updateNode(node.children) : undefined
    }))
  }
  
  return updateNode(tree)
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        breadcrumbs: [],
        navigationTree: [],
        expandedNodes: new Set(),
        userInfo: null,
        isLoading: false,
        isLoggingOut: false,
        isDropdownOpen: false,
        isLanguageDropdownOpen: false,
        isDarkMode: false,
        currentProjectId: null,
        currentCohortId: null,
        currentUserId: null,
        currentSessionId: null,

        // Tree actions
        setNavigationTree: (tree) =>
          set({ 
            navigationTree: tree,
            expandedNodes: new Set(getExpandedNodeIds(tree))
          }, false, 'setNavigationTree'),

        toggleNodeExpansion: (nodeId) => {
          const state = get()
          const newExpandedNodes = new Set(state.expandedNodes)
          
          if (newExpandedNodes.has(nodeId)) {
            newExpandedNodes.delete(nodeId)
          } else {
            newExpandedNodes.add(nodeId)
          }
          
          const updatedTree = updateTreeNodeExpansion(
            state.navigationTree,
            nodeId,
            newExpandedNodes.has(nodeId)
          )
          
          set({
            navigationTree: updatedTree,
            expandedNodes: newExpandedNodes
          }, false, 'toggleNodeExpansion')
        },

        expandNode: (nodeId) => {
          const state = get()
          const newExpandedNodes = new Set(state.expandedNodes)
          newExpandedNodes.add(nodeId)
          
          const updatedTree = updateTreeNodeExpansion(state.navigationTree, nodeId, true)
          
          set({
            navigationTree: updatedTree,
            expandedNodes: newExpandedNodes
          }, false, 'expandNode')
        },

        collapseNode: (nodeId) => {
          const state = get()
          const newExpandedNodes = new Set(state.expandedNodes)
          newExpandedNodes.delete(nodeId)
          
          const updatedTree = updateTreeNodeExpansion(state.navigationTree, nodeId, false)
          
          set({
            navigationTree: updatedTree,
            expandedNodes: newExpandedNodes
          }, false, 'collapseNode')
        },

        expandPath: (nodeIds) => {
          const state = get()
          const newExpandedNodes = new Set(state.expandedNodes)
          nodeIds.forEach(id => newExpandedNodes.add(id))
          
          let updatedTree = state.navigationTree
          nodeIds.forEach(nodeId => {
            updatedTree = updateTreeNodeExpansion(updatedTree, nodeId, true)
          })
          
          set({
            navigationTree: updatedTree,
            expandedNodes: newExpandedNodes
          }, false, 'expandPath')
        },

        setNodeLoading: (nodeId, isLoading) => {
          const state = get()
          function updateNode(nodes: NavigationTreeNode[]): NavigationTreeNode[] {
            return nodes.map(node => ({
              ...node,
              isLoading: node.id === nodeId ? isLoading : node.isLoading,
              children: node.children ? updateNode(node.children) : undefined
            }))
          }
          
          set({
            navigationTree: updateNode(state.navigationTree)
          }, false, 'setNodeLoading')
        },

        updateNodeChildren: (nodeId, children) => {
          const state = get()
          function updateNode(nodes: NavigationTreeNode[]): NavigationTreeNode[] {
            return nodes.map(node => ({
              ...node,
              children: node.id === nodeId ? children : (node.children ? updateNode(node.children) : undefined)
            }))
          }
          
          set({
            navigationTree: updateNode(state.navigationTree)
          }, false, 'updateNodeChildren')
        },

        setActiveNode: (nodeId) => {
          const state = get()
          const updatedTree = updateTreeActiveNode(state.navigationTree, nodeId)
          
          set({
            navigationTree: updatedTree
          }, false, 'setActiveNode')
        },

        // Breadcrumb actions
        setBreadcrumbs: (breadcrumbs) =>
          set({ breadcrumbs }, false, 'setBreadcrumbs'),

        updateBreadcrumb: (index, breadcrumb) =>
          set((state) => ({
            breadcrumbs: state.breadcrumbs.map((crumb, i) =>
              i === index ? { ...crumb, ...breadcrumb } : crumb
            )
          }), false, 'updateBreadcrumb'),

        setNavigationContext: (context) => {
          const currentState = get()
          
          const newProjectId = context.projectId !== undefined ? context.projectId : currentState.currentProjectId
          const newCohortId = context.cohortId !== undefined ? context.cohortId : currentState.currentCohortId
          const newUserId = context.userId !== undefined ? context.userId : currentState.currentUserId
          const newSessionId = context.sessionId !== undefined ? context.sessionId : currentState.currentSessionId
          
          const hasChanged = 
            newProjectId !== currentState.currentProjectId ||
            newCohortId !== currentState.currentCohortId ||
            newUserId !== currentState.currentUserId ||
            newSessionId !== currentState.currentSessionId
          
          if (hasChanged) {
            const newContext = {
              currentProjectId: newProjectId,
              currentCohortId: newCohortId,
              currentUserId: newUserId,
              currentSessionId: newSessionId,
            }
            
            const newTree = buildNavigationTreeFromContext(newContext)
            
            set({
              ...newContext,
              breadcrumbs: generateBreadcrumbsFromContext(newContext),
              navigationTree: newTree,
              expandedNodes: new Set(getExpandedNodeIds(newTree))
            }, false, 'setNavigationContext')
          }
        },

        // User actions
        setUserInfo: (userInfo) =>
          set({ userInfo }, false, 'setUserInfo'),

        setIsLoading: (isLoading) =>
          set({ isLoading }, false, 'setIsLoading'),

        setIsLoggingOut: (isLoggingOut) =>
          set({ isLoggingOut }, false, 'setIsLoggingOut'),

        // UI actions
        setIsDropdownOpen: (isDropdownOpen) =>
          set({ isDropdownOpen }, false, 'setIsDropdownOpen'),

        setIsLanguageDropdownOpen: (isLanguageDropdownOpen) =>
          set({ isLanguageDropdownOpen }, false, 'setIsLanguageDropdownOpen'),

        setIsDarkMode: (isDarkMode) => {
          if (typeof document !== 'undefined') {
            if (isDarkMode) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
            
            const expires = new Date()
            expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000))
            document.cookie = `theme=${isDarkMode ? 'dark' : 'light'}; expires=${expires.toUTCString()}; path=/`
          }
          
          set({ isDarkMode }, false, 'setIsDarkMode')
        },

        // Helper actions
        clearUserState: () =>
          set({
            userInfo: null,
            isLoading: false,
            isLoggingOut: false,
            isDropdownOpen: false,
            isDarkMode: false,
          }, false, 'clearUserState'),

        generateBreadcrumbs: () => {
          const state = get()
          return generateBreadcrumbsFromContext({
            currentProjectId: state.currentProjectId,
            currentCohortId: state.currentCohortId,
            currentUserId: state.currentUserId,
            currentSessionId: state.currentSessionId,
          })
        },

        buildNavigationTree: () => {
          const state = get()
          return buildNavigationTreeFromContext({
            currentProjectId: state.currentProjectId,
            currentCohortId: state.currentCohortId,
            currentUserId: state.currentUserId,
            currentSessionId: state.currentSessionId,
          })
        },

        getActiveNodePath: () => {
          const state = get()
          const path: string[] = []
          
          function findActivePath(nodes: NavigationTreeNode[], currentPath: string[]): boolean {
            for (const node of nodes) {
              const newPath = [...currentPath, node.id]
              
              if (node.isActive) {
                path.push(...newPath)
                return true
              }
              
              if (node.children && findActivePath(node.children, newPath)) {
                return true
              }
            }
            return false
          }
          
          findActivePath(state.navigationTree, [])
          return path
        },

        toggleDropdown: () =>
          set((state) => ({ 
            isDropdownOpen: !state.isDropdownOpen,
            isLanguageDropdownOpen: false
          }), false, 'toggleDropdown'),

        toggleLanguageDropdown: () =>
          set((state) => ({ 
            isLanguageDropdownOpen: !state.isLanguageDropdownOpen,
            isDropdownOpen: false
          }), false, 'toggleLanguageDropdown'),

        toggleTheme: () => {
          const currentMode = get().isDarkMode
          get().setIsDarkMode(!currentMode)
        },

        closeAllDropdowns: () =>
          set({
            isDropdownOpen: false,
            isLanguageDropdownOpen: false
          }, false, 'closeAllDropdowns'),
      }),
      {
        name: 'navigation-store',
        partialize: (state) => ({
          isDarkMode: state.isDarkMode,
          currentProjectId: state.currentProjectId,
          currentCohortId: state.currentCohortId,
          currentUserId: state.currentUserId,
          currentSessionId: state.currentSessionId,
          expandedNodes: Array.from(state.expandedNodes), // Convert Set to Array for persistence
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.expandedNodes)) {
            // Convert Array back to Set on rehydration
            state.expandedNodes = new Set(state.expandedNodes)
          }
        },
      }
    ),
    {
      name: 'navigation-store',
    }
  )
)

// Optimized selectors
export const useNavigationTree = () => 
  useNavigationStore(useShallow((state) => state.navigationTree))

export const useExpandedNodes = () => 
  useNavigationStore(useShallow((state) => state.expandedNodes))

export const useNavigationTreeActions = () =>
  useNavigationStore(
    useShallow((state) => ({
      toggleNodeExpansion: state.toggleNodeExpansion,
      expandNode: state.expandNode,
      collapseNode: state.collapseNode,
      expandPath: state.expandPath,
      setActiveNode: state.setActiveNode,
      setNodeLoading: state.setNodeLoading,
      updateNodeChildren: state.updateNodeChildren,
    }))
  )

// Keep existing selectors for compatibility
export const useUserInfo = () => 
  useNavigationStore(useShallow((state) => state.userInfo))

export const useBreadcrumbs = () => 
  useNavigationStore(useShallow((state) => state.breadcrumbs))

export const useNavigationContext = () => 
  useNavigationStore(
    useShallow((state) => ({
      projectId: state.currentProjectId,
      cohortId: state.currentCohortId,
      userId: state.currentUserId,
      sessionId: state.currentSessionId,
    }))
  )

export const useTheme = () =>
  useNavigationStore(
    useShallow((state) => ({
      isDarkMode: state.isDarkMode,
      toggleTheme: state.toggleTheme,
      setIsDarkMode: state.setIsDarkMode,
    }))
  )

export const useDropdowns = () =>
  useNavigationStore(
    useShallow((state) => ({
      isDropdownOpen: state.isDropdownOpen,
      isLanguageDropdownOpen: state.isLanguageDropdownOpen,
      toggleDropdown: state.toggleDropdown,
      toggleLanguageDropdown: state.toggleLanguageDropdown,
      closeAllDropdowns: state.closeAllDropdowns,
    }))
  )

export const useUserState = () =>
  useNavigationStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      isLoading: state.isLoading,
      isLoggingOut: state.isLoggingOut,
      setUserInfo: state.setUserInfo,
      setIsLoading: state.setIsLoading,
      setIsLoggingOut: state.setIsLoggingOut,
      clearUserState: state.clearUserState,
    }))
  )

export const useBreadcrumbActions = () =>
  useNavigationStore(
    useShallow((state) => ({
      setBreadcrumbs: state.setBreadcrumbs,
      updateBreadcrumb: state.updateBreadcrumb,
      generateBreadcrumbs: state.generateBreadcrumbs,
    }))
  )

export const useNavigationActions = () =>
  useNavigationStore(
    useShallow((state) => ({
      setNavigationContext: state.setNavigationContext,
    }))
  )

export const useNavigationIds = () =>
  useNavigationStore(
    useShallow((state) => [
      state.currentProjectId,
      state.currentCohortId,
      state.currentUserId,
      state.currentSessionId,
    ])
  )