'use client'
import Link from 'next/link'

export default function ContinuePage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
            <Link 
              href="/login" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-6 py-20">
        <div className="w-full max-w-md">
          {/* Register Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Join Zeus Growth
              </h1>
              <p className="text-sm text-gray-600">
                Create your account to get started
              </p>
            </div>

            {/* Social Registration */}
            <div className="mt-6">
              <button className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                <img
                  src="/google.webp" 
                  alt="Google logo" 
                  className="w-5 h-5 mr-2" 
                />
                Google
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or sign up with</span>
              </div>
            </div>

              {/* Submit Button */}
              <Link 
              href="/continue/register" >
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                Create account
              </button> 
              </Link>   
          </div>

          {/* Login Link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-100 rounded-full opacity-20 animate-pulse delay-700"></div>
      </div>
    </div>
  )
}