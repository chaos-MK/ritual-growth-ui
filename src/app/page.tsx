import Link from 'next/link'
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Zeus Growth
              </h1>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/login" passHref>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-full transition-all duration-200">
                  Login
                </button>
              </Link>
              <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 shadow-sm hover:shadow-md">
                <Link href="/continue" passHref>
                  Register
                </Link>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-screen py-20">
            {/* Content Section */}
            <div className="space-y-8">
              <div className="space-y-6">
                {/* Heading Section */}
                  <h2 className="text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight tracking-tight">
                    Accelerate Your
                    <span className="text-blue-600"> Digital Growth</span>
                  </h2>
                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                  Zeus Growth empowers you !
                </p>
                
                <p className="text-lg text-gray-500 leading-relaxed max-w-xl">
                  Enterprise growth refers to the process of expanding a company's operations, revenue, market share, or other key metrics over time. It involves strategic initiatives, operational improvements, and market opportunities to increase profitability and achieve sustainable success. 
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" passHref>
                <button className="px-8 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Get Started
                </button>
                </Link>
              </div>
            </div>
            
            {/* Image Section */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src="index.webp" 
                  alt="Digital Growth and Analytics Dashboard" 
                  className="w-full h-75 lg:h-[370px] object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent"></div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100 rounded-full opacity-40 animate-pulse delay-700"></div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Growth Analytics</h3>
                <p className="text-gray-600">Advanced analytics to track and optimize your growth metrics</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Proven Results</h3>
                <p className="text-gray-600">Measurable outcomes with our data-driven approach</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Team</h3>
                <p className="text-gray-600">Dedicated specialists focused on your success</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}