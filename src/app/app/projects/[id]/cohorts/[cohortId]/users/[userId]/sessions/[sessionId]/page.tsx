import Navigation from '@/components/Navigation'
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const stats = [
  { name: 'Duration', stat: '6m 15s', change: '+45s', changeType: 'increase' },
  { name: 'Page Views', stat: '7', change: '+1', changeType: 'increase' },
  { name: 'Avg. Time on Page', stat: '53s', change: '+5s', changeType: 'increase' },
  { name: 'Bounce', stat: 'No', change: null, changeType: null },
]

const pages = [
  { path: '/home', timeSpent: '1m 30s', timestamp: '2024-03-15 10:30:00' },
  { path: '/features', timeSpent: '2m 15s', timestamp: '2024-03-15 10:31:30' },
  { path: '/pricing', timeSpent: '1m 45s', timestamp: '2024-03-15 10:33:45' },
  { path: '/contact', timeSpent: '45s', timestamp: '2024-03-15 10:35:30' },
]

export default function SessionSummary({ params }: { params: { id: string; cohortId: string; userId: string; sessionId: string } }) {
  const { id: projectId, cohortId, userId, sessionId } = params
  const session = { startTime: '2024-03-15 10:30:00', device: 'Desktop' } // This would come from your API

  const breadcrumbs = [
    { name: 'Company Summary', href: '/app/index' },
    { name: 'Project Summary', href: `/app/projects/${projectId}` },
    { name: 'Cohort Summary', href: `/app/projects/${projectId}/cohorts/${cohortId}` },
    { name: 'User Summary', href: `/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}` },
    { name: 'Session Summary', href: `/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}/sessions/${sessionId}` }
  ]

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Session {sessionId}</h2>
            <p className="text-sm text-gray-500">
              Started: {session.startTime} | Device: {session.device}
            </p>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-indigo-500 p-3">
                  <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                {item.change && (
                  <p
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.changeType === 'increase' ? (
                      <ArrowUpIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                    </span>
                    {item.change}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </div>

        {/* Page Views List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Page Views</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul role="list" className="divide-y divide-gray-200">
              {pages.map((page, index) => (
                <li key={index} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="truncate text-sm font-medium text-indigo-600">
                        {page.path}
                      </p>
                      <p className="text-sm text-gray-500">
                        Viewed at: {page.timestamp}
                      </p>
                    </div>
                    <div className="ml-2 flex flex-shrink-0">
                      <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                        {page.timeSpent}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  )
} 