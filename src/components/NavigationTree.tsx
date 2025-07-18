'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  PlusIcon,
  BuildingOfficeIcon,
  FolderIcon,
  UserGroupIcon,
  UserIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { NavigationNode, useNavigation } from '@/hooks/useNavigation'

const typeIcons = {
  company: BuildingOfficeIcon,
  project: FolderIcon,
  cohort: UserGroupIcon,
  user: UserIcon,
  session: DocumentIcon,
}

interface CreateFormProps {
  isOpen: boolean
  onClose: () => void
  position: { x: number; y: number }
  parentType: string
  onCreateProject: (name: string, website: string, state: string, startDate: Date, endDate: Date, duration: string) => Promise<void>
}

function CreateForm({ isOpen, onClose, position, parentType, onCreateProject }: CreateFormProps) {
  const [projectName, setProjectName] = useState('')
  const [projectWebsite, setProjectWebsite] = useState('')
  const [projectState, setProjectState] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLDivElement>(null)

  // Close form when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setProjectName('')
      setProjectWebsite('')
      setProjectState('')
      setEndDate('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen || parentType !== 'company') return null

  const formatDuration = (days: number) => {
    if (days <= 30) {
      return `${days} day${days !== 1 ? 's' : ''}`
    }
    
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    
    if (months <= 12) {
      let result = `${months} month${months !== 1 ? 's' : ''}`
      if (remainingDays > 0) {
        result += ` and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`
      }
      return result
    } else {
      const years = Math.floor(months / 12)
      const remainingMonths = months % 12
      
      let result = `${years} year${years !== 1 ? 's' : ''}`
      if (remainingMonths > 0) {
        result += ` and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
      }
      if (remainingDays > 0) {
        result += ` and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`
      }
      return result
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || !projectWebsite.trim() || !projectState || !endDate) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const startDate = new Date()
      const endDateObj = new Date(endDate)
      const durationInDays = Math.ceil((endDateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const formattedDuration = formatDuration(durationInDays)
      
      await onCreateProject(projectName.trim(), projectWebsite.trim(), projectState, startDate, endDateObj, formattedDuration)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div 
      ref={formRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[280px] max-w-[320px]"
      style={{ 
        left: `${Math.max(8, position.x)}px`, 
        top: `${Math.max(8, position.y)}px`,
      }}
    >
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Create Project
        </h3>
        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="project-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name *
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Enter project name"
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="project-website" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Website *
            </label>
            <input
              id="project-website"
              type="url"
              value={projectWebsite}
              onChange={(e) => setProjectWebsite(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="https://example.com"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="project-state" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project State *
            </label>
            <select
              id="project-state"
              value={projectState}
              onChange={(e) => setProjectState(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              required
              disabled={isSubmitting}
            >
              <option value="">Select project state</option>
              <option value="safe">Safe</option>
              <option value="warning">Warning</option>
              <option value="risk">Risk</option>
            </select>
          </div>
          <div>
            <label htmlFor="end-date" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date *
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              required
              disabled={isSubmitting}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectName.trim() || !projectWebsite.trim() || !projectState || !endDate || isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center space-x-1"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
              )}
              <span>{isSubmitting ? 'Creating...' : 'Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface NavigationTreeItemProps {
  node: NavigationNode
  level?: number
  userEmail?: string
}

function NavigationTreeItem({ node, level = 0, userEmail }: NavigationTreeItemProps) {
  const router = useRouter()
  const { handleNodeClick, toggleExpansion, projectsListExpanded, setProjectsListExpanded, loadNavigationData } = useNavigation()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 })
  
  const IconComponent = typeIcons[node.type]
  const hasChildren = node.children && node.children.length > 0
  const paddingLeft = `${level * 1.5 + 0.5}rem`

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasChildren) {
      toggleExpansion(node.id)
    }
  }, [hasChildren, toggleExpansion, node.id])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    // For projects, store the project ID in session storage and navigate
    if (node.type === 'project') {
      const projectData = {
        id: String(Number(node.id)),
        name: node.name,
        ...node.metadata // This might include additional project info
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('currentProject', JSON.stringify(projectData))
      }
      
      router.push(`/app/projects/${node.id}`)
    } else {
      // For other node types, use the default navigation
      handleNodeClick(node.id, node.href)
    }
  }, [node, router, handleNodeClick])

  const handleCreateClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let x = rect.right + 8
    let y = rect.top
    
    if (x + 320 > viewportWidth) {
      x = rect.left - 328
    }
    
    if (y + 200 > viewportHeight) {
      y = viewportHeight - 208
    }
    
    setFormPosition({ x, y })
    setShowCreateForm(true)
  }, [])

  const handleCreateProject = useCallback(async (name: string, website: string, state: string, startDate: Date, endDate: Date, duration: string) => {
    if (!userEmail) {
      throw new Error('User email not available')
    }

    const authToken = `testtoken:${userEmail}`

    const projectName = name
    const projectWebsite = website
    const overallStatus = state
    const hasGraphs = false
    const hasDashboard = false
    const companyId = 1 // static for now

    try {
      const requestBody = {
        projectName,
        projectWebsite,
        state,
        overallStatus,
        hasGraphs,
        hasDashboard,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration,
        "company": {
          companyId
        },
      }

      const response = await fetch(`http://localhost:8080/project/addProject`, {
        method: 'POST',
        headers: {
          'hippo-api-version': '1.0.0',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to create project: ${response.status} ${errorData}`)
      }

      console.log('Project created successfully')
      setShowCreateForm(false)
      
      // Reload navigation data to reflect the new project
      await loadNavigationData(userEmail)
      
      // Navigate to the company summary page to see the updated list
      router.push('/app/index')

    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }, [userEmail, router, loadNavigationData])

  const handleProjectsListToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setProjectsListExpanded(!projectsListExpanded)
  }, [projectsListExpanded, setProjectsListExpanded])

  return (
    <div>
      <div
        className={`group flex items-center py-2 px-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
          node.isActive
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-4 h-4 mr-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {node.isExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Icon */}
        <IconComponent className="mr-3 h-4 w-4 flex-shrink-0" />

        {/* Node Name */}
        <span className="truncate font-medium flex-1">{node.name}</span>

        {/* Count Badge */}
        {node.metadata?.count !== undefined && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {node.metadata.count}
          </span>
        )}

        {/* Loading Indicator */}
        {node.isLoading && (
          <div className="w-4 h-4 ml-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600" />
          </div>
        )}
      </div>

      {/* Projects Toggle Button - only for company nodes */}
      {node.type === 'company' && (
        <div style={{ paddingLeft: `${(level + 1) * 1.5 + 0.5}rem` }} className="mt-1 flex items-center justify-between pr-2">
          <button
            onClick={handleProjectsListToggle}
            className="group flex items-center py-2 px-2 text-sm font-medium rounded-md transition-all duration-150 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex-grow text-left"
          >
            {projectsListExpanded ? (
              <ChevronDownIcon className="w-4 h-4 mr-2 transition-transform" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 mr-2 transition-transform" />
            )}
            <FolderIcon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
            <span className="font-medium">List of Projects</span>
          </button>

          <button
            onClick={handleCreateClick}
            className="ml-2 w-6 h-6 rounded flex items-center justify-center transition-all hover:scale-110 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            aria-label="Create new project"
            title="Create new project"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <CreateForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          position={formPosition}
          parentType={node.type}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* Children */}
      {node.type === 'company' ? (
        // For company nodes, show projects only when projectsListExpanded is true
        projectsListExpanded && node.children && node.children.length > 0 && (
          <div className="mt-1 space-y-1">
            {node.children
              .filter(child => child.type === 'project')
              .map((child) => (
                <NavigationTreeItem
                  key={child.id}
                  node={child}
                  level={level + 2}
                  userEmail={userEmail}
                />
              ))}
          </div>
        )
      ) : (
        // For non-company nodes, show children as normal when expanded
        hasChildren && node.isExpanded && node.children && (
          <div className="mt-1 space-y-1">
            {node.children.map((child) => (
              <NavigationTreeItem
                key={child.id}
                node={child}
                level={level + 1}
                userEmail={userEmail}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

interface NavigationTreeProps {
  className?: string
  onNodeClick?: (nodeId: string, href: string) => void
  userEmail?: string
}

export default function NavigationTree({ className = '', onNodeClick, userEmail }: NavigationTreeProps) {
  const { tree, isLoading, handleNodeClick } = useNavigation()
  const [showSkeleton, setShowSkeleton] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const combinedNodeClick = useCallback((nodeId: string, href: string) => {
    handleNodeClick(nodeId, href)
    onNodeClick?.(nodeId, href)
  }, [handleNodeClick, onNodeClick])

  useEffect(() => {
    if (isLoading) {
      // Check network speed
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      const isSlowNetwork = connection && ['slow-2g', '2g'].includes(connection.effectiveType)

      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      // Set a debounce timeout to show skeleton only if loading persists
      loadingTimeoutRef.current = setTimeout(() => {
        if (isLoading) {
          // For slow networks, add additional delay
          const delay = isSlowNetwork ? 2000 : 500
          loadingTimeoutRef.current = setTimeout(() => {
            setShowSkeleton(true)
          }, delay)
        }
      }, 100) // Initial debounce to catch quick load completions
    } else {
      // Clear skeleton and timeout when not loading
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      setShowSkeleton(false)
    }

    // Cleanup on unmount or isLoading change
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [isLoading])

  if (showSkeleton && isLoading) {
    return (
      <div className={`px-4 py-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3" style={{ marginLeft: `${i * 24}px` }}>
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
                i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : 'w-2/3'
              }`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!tree || tree.length === 0) {
    return (
      <div className={`px-4 py-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No navigation data available</p>
        </div>
      </div>
    )
  }

  return (
    <nav className={`flex-1 px-2 py-4 overflow-y-auto ${className}`}>
      <div className="space-y-1">
        {tree.map((node) => (
          <NavigationTreeItem 
            key={node.id} 
            node={node} 
            userEmail={userEmail}
          />
        ))}
      </div>
    </nav>
  )
}