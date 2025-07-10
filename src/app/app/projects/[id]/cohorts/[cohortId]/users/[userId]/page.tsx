import Navigation from '@/components/Navigation'
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const stats = [
  { name: 'Total Sessions', stat: '12', change: '+2', changeType: 'increase' },
  { name: 'Avg. Session Duration', stat: '6m 15s', change: '+45s', changeType: 'increase' },
  { name: 'Page Views', stat: '85', change: '+8', changeType: 'increase' },
  { name: 'Bounce Rate', stat: '25%', change: '-5%', changeType: 'decrease' },
]

const sessions = [
  { id: 1, startTime: '2024-03-15 10:30', duration: '6m 15s', pageViews: 7, bounce: false },
  { id: 2, startTime: '2024-03-14 15:45', duration: '8m 30s', pageViews: 9, bounce: false },
  { id: 3, startTime: '2024-03-13 09:15', duration: '4m 20s', pageViews: 5, bounce: true },
]

export default function UserSummary({ params }: { params: { id: string; cohortId: string; userId: string } }) {
  const { id: projectId, cohortId, userId } = params
  const user = { name: 'John Doe', email: 'john@example.com' } // This would come from your API

  const breadcrumbs = [
    { name: 'Company Summary', href: '/app/index' },
    { name: 'Project Summary', href: `/app/projects/${projectId}` },
    { name: 'Cohort Summary', href: `/app/projects/${projectId}/cohorts/${cohortId}` },
    { name: 'User Summary', href: `/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}` }
  ]

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
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
              </dd>
            </div>
          ))}
        </div>

        {/* Sessions List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Sessions</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul role="list" className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/app/projects/${projectId}/cohorts/${cohortId}/users/${userId}/sessions/${session.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="truncate text-sm font-medium text-indigo-600">
                            Session {session.id}
                          </p>
                          <p className="text-sm text-gray-500">
                            Started: {session.startTime}
                          </p>
                        </div>
                        <div className="ml-2 flex flex-shrink-0">
                          <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {session.duration}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {session.pageViews} page views
                          </p>
                          {session.bounce && (
                            <p className="mt-2 flex items-center text-sm text-red-500 sm:mt-0 sm:ml-6">
                              Bounced
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  )
} 