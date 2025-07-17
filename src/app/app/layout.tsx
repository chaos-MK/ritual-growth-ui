'use client'

import Navigation from '@/components/Navigation'
import { useTranslation } from '../app/context/LanguageContext'

interface Props {
  children: React.ReactNode
}

export default function AutoAppLayout({ children }: Props) {
  const { locale } = useTranslation()
  return (
    <div className="min-h-screen">
      <Navigation>
        <div>
          {children}
        </div>
      </Navigation>
    </div>
  )
}