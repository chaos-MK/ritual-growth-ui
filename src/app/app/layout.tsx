'use client'

import { useNavigationContext } from '@/hooks/useNavigationContext'
import Navigation from '@/components/Navigation'

interface Props {
  children: React.ReactNode
}

export default function AutoAppLayout({ children }: Props) {
  // Automatically parse navigation context from URL
  useNavigationContext(undefined, {
    autoUpdateFromUrl: true,
    generateBreadcrumbs: true,
    expandPath: true
  })

  return (
    <div className="min-h-screen">
      <Navigation>
        {children}
      </Navigation>
    </div>
  )
}