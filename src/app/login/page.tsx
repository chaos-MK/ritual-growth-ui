'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      const firebaseToken = await firebaseUser.getIdToken()
      
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        token: firebaseToken
      }

      const expires = new Date()
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000))
      
      document.cookie = `userToken=${firebaseToken}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
      document.cookie = `userEmail=${firebaseUser.email}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
      document.cookie = `userId=${firebaseUser.uid}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
      document.cookie = `userDisplayName=${firebaseUser.displayName || ''}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`

      console.log('User authenticated successfully:', userData)
      
      router.push('/app/index')
    } catch (err: any) {
      console.error('Authentication error:', err)
      
      let errorMessage = 'Authentication failed. Please try again.'
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email address.'
          break
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.'
          break
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.'
          break
        default:
          errorMessage = err.message || 'Authentication failed.'
      }
      
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-semibold text-gray-900 tracking-tight hover:text-gray-700 transition-colors">
              Zeus Growth
            </Link>
            <Link href="/continue" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Need an account?
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm">
          <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome back
              </h1>
              <p className="text-sm text-gray-600">
                Sign in to your Zeus Growth account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center -mt-2">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                Sign In
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/continue" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-100 rounded-full opacity-20 animate-pulse delay-700"></div>
      </div>
    </div>
  )
}