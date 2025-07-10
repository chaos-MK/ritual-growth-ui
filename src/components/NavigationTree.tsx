// components/NavigationTree.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRightIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import { 
  BuildingOfficeIcon,
  FolderIcon,
  UserGroupIcon,
  UserIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { ComponentType, useCallback, useState, useEffect, useRef, JSX } from 'react'
import { 
  useNavigationTree, 
  useNavigationTreeActions,
  NavigationTreeNode 
} from '@/app/stores/navigationStore'
import { useNavigationEvents } from '@/hooks/useNavigationUtils'
import { useNavigationContext } from '@/hooks/useNavigationContext'

// Icon mapping for different node types
const typeIcons: Record<NavigationTreeNode['type'], ComponentType<React.SVGProps<SVGSVGElement>>> = {
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

  // Reset forms when form closes
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

  if (!isOpen) return null

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || !projectWebsite.trim() || !projectState || !endDate) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const startDate = new Date().toISOString().split('T')[0] // Current date as start date
      const endDateObj = new Date(endDate)
      const startDateObj = new Date(startDate)
      const durationInDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) // Duration in days

       function formatDuration(days: number) {
          if (days <= 30) {
            return `${days} day${days !== 1 ? 's' : ''}`
          }
          
          // Calculate months and years
          const months = Math.floor(days / 30)
          const remainingDays = days % 30
          
          if (months <= 12) {
            // Format as months and days
            let result = `${months} month${months !== 1 ? 's' : ''}`
            if (remainingDays > 0) {
              result += ` and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`
            }
            return result
          } else {
            // Format as years, months, and days
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

  const formattedDuration = formatDuration(durationInDays)
      
      await onCreateProject(projectName.trim(), projectWebsite.trim(), projectState, startDateObj, endDateObj, formattedDuration)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  // In NavigationTree component, add this useEffect:
useEffect(() => {
  const initializeTreeFromStorage = () => {
    // Only initialize if tree is empty and we have stored data
    if (useNavigationTree.length === 0) {
      const storedData = sessionStorage.getItem('navigationTreeData')
      if (storedData) {
        try {
          const projectData = JSON.parse(storedData)
          // Import and use the shared utility function
          buildNavigationFromProjects(projectData, NavigationTree, useNavigationContext)
        } catch (error) {
          console.error('Failed to restore navigation tree from storage:', error)
        }
      }
    }
  }

  initializeTreeFromStorage()
}, [useNavigationTree, useNavigationTree, useNavigationContext])

  // Only show project creation form for company nodes
  if (parentType !== 'company') return null

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
        <form onSubmit={handleProjectSubmit} className="space-y-3">
          <div>
            <label 
              htmlFor="project-name" 
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
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
            <label 
              htmlFor="project-website" 
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
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
            <label 
              htmlFor="project-state" 
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
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
            <label 
              htmlFor="end-date" 
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
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
  node: NavigationTreeNode
  level?: number
  onNodeClick?: (nodeId: string, href: string) => void
  userEmail?: string
}

function NavigationTreeItem({ node, level = 0, onNodeClick, userEmail }: NavigationTreeItemProps) {
  const router = useRouter()
  const { toggleNodeExpansion, setActiveNode, setNodeLoading } = useNavigationTreeActions()
  const [isNavigating, setIsNavigating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showProjectsList, setShowProjectsList] = useState(false)
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 })
  
  const IconComponent = typeIcons[node.type]
  const hasChildren = node.children && node.children.length > 0
  const paddingLeft = `${level * 1.5 + 0.5}rem`
  const canCreateChildren = node.type === 'company'

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (hasChildren) {
      toggleNodeExpansion(node.id)
    }
  }, [hasChildren, toggleNodeExpansion, node.id])

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isNavigating) return // Prevent multiple clicks
    
    setIsNavigating(true)
    setNodeLoading(node.id, true)
    
    try {
      setActiveNode(node.id)
      
      if (onNodeClick) {
        onNodeClick(node.id, node.href)
      }
      
      await router.push(node.href)
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setIsNavigating(false)
      setNodeLoading(node.id, false)
    }
  }, [node.id, node.href, router, setActiveNode, setNodeLoading, onNodeClick, isNavigating])

  const handleCreateClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Position form to the right of the button, but adjust if it would go off-screen
    let x = rect.right + 8
    let y = rect.top
    
    // Adjust horizontal position if form would go off-screen
    if (x + 320 > viewportWidth) {
      x = rect.left - 328 // Position to the left of the button
    }
    
    // Adjust vertical position if form would go off-screen
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

    try {
      const requestBody = {
        name,
        website,
        state,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration
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

      // TODO: Refresh the navigation tree or add the new project to the tree
      console.log('Project created successfully:', { 
        name, 
        website, 
        parentId: node.id,
        parentType: node.type 
      })
      
      // Close form after creation
      setShowCreateForm(false)
      router.push('/app/index')
      router.refresh()

    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }, [node.id, node.type, userEmail])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleClick(e as any)
        break
      case 'ArrowRight':
        if (hasChildren && !node.isExpanded) {
          e.preventDefault()
          toggleNodeExpansion(node.id)
        }
        break
      case 'ArrowLeft':
        if (hasChildren && node.isExpanded) {
          e.preventDefault()
          toggleNodeExpansion(node.id)
        }
        break
    }
  }, [handleClick, hasChildren, node.isExpanded, node.id, toggleNodeExpansion])

  return (
    <div>
      <div
        role="treeitem"
        aria-expanded={hasChildren ? node.isExpanded : undefined}
        aria-level={level + 1}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`group flex items-center py-2 px-2 text-sm font-medium rounded-md transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
          node.isActive
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 shadow-sm'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
        } ${isNavigating ? 'opacity-75 pointer-events-none' : ''}`}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        {/* Expand/Collapse Button */}
        <div className="flex items-center">
          {hasChildren && node.type !== 'company' ?(
            <button
              onClick={handleToggle}
              className="flex items-center justify-center w-4 h-4 mr-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
              tabIndex={-1}
            >
              {node.isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* Icon */}
        <IconComponent 
          className={`mr-3 h-4 w-4 flex-shrink-0 transition-colors ${
            node.isActive 
              ? 'text-indigo-500 dark:text-indigo-400' 
              : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
          }`} 
        />

        {/* Node Name and Actions */}
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="truncate font-medium">
            {node.name}
          </span>
          
          <div className="flex items-center space-x-2 ml-2">
            {/* Count Badge */}
            {node.metadata?.count !== undefined && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                node.isActive
                  ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
              }`}>
                {node.metadata.count}
              </span>
            )}
            
          
            
            {/* Loading Indicator */}
            {(node.isLoading || isNavigating) && (
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 dark:border-indigo-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects Toggle Button - only for company nodes */}
        {node.type === 'company' && (
          <div style={{ paddingLeft: `${(level + 1) * 1.5 + 0.5}rem` }} className="mt-1 flex items-center justify-between pr-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowProjectsList(!showProjectsList)
              }}
              className="group flex items-center py-2 px-2 text-sm font-medium rounded-md transition-all duration-150 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex-grow text-left"
            >
              {showProjectsList ? (
                <ChevronDownIcon className="w-4 h-4 mr-2 transition-transform" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 mr-2 transition-transform" />
              )}
              <FolderIcon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
              <span className="font-medium">List of Projects</span>
            </button>

            {/* Move create button here */}
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


      {/* Create Form Portal */}
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
          // For company nodes, show projects only when showProjectsList is true
          showProjectsList && node.children && node.children.length > 0 && (
            <div className="mt-1 space-y-1">
              {node.children
                .filter(child => child.type === 'project')
                .map((child) => (
                  <NavigationTreeItem
                    key={child.id}
                    node={child}
                    level={level + 1}
                    onNodeClick={onNodeClick}
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
                  onNodeClick={onNodeClick}
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
  const navigationTree = useNavigationTree()
  const { handleNodeClick } = useNavigationEvents()
  
  const combinedNodeClick = useCallback((nodeId: string, href: string) => {
    handleNodeClick(nodeId, href)
    onNodeClick?.(nodeId, href)
  }, [handleNodeClick, onNodeClick])

  if (!navigationTree || navigationTree.length === 0) {
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

  return (
    <nav 
      className={`flex-1 px-2 py-4 overflow-y-auto ${className}`}
      role="tree"
      aria-label="Navigation tree"
    >
      <div className="space-y-1">
        {navigationTree.map((node) => (
          <NavigationTreeItem 
            key={node.id} 
            node={node} 
            onNodeClick={combinedNodeClick}
            userEmail={userEmail}
          />
        ))}
      </div>
    </nav>
  )
}

function buildNavigationFromProjects(projectData: any, NavigationTree: ({ className, onNodeClick, userEmail }: NavigationTreeProps) => JSX.Element, useNavigationContext: any) {
  throw new Error('Function not implemented.')
}
