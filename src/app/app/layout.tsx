'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useUserState } from '../stores/navigationStore'
import Navigation from '@/components/Navigation'
import { useTranslation } from '../app/context/LanguageContext'

interface Props {
  children: React.ReactNode
}

export default function AutoAppLayout({ children }: Props) {
  const { locale } = useTranslation()
  const { setUserInfo, setAuthIsReady } = useUserState()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserInfo({
          email: user.email || '',
          userId: user.uid,
          token: '', // or your actual token if you have it
          displayName: user.displayName || '',
          emailVerified: user.emailVerified,
        })
      } else {
        setUserInfo(null)
      }
      setAuthIsReady(true)
    })

    return () => unsubscribe()
  }, [setUserInfo, setAuthIsReady])

  return (
    <div className="min-h-screen">
      <Navigation>
        <div>{children}</div>
      </Navigation>
    </div>
  )
}
