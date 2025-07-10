import Navigation from '@/components/Navigation'
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const stats = [
  { name: 'Total Users', stat: '150', change: '+15', changeType: 'increase' },
  { name: 'Active Users', stat: '120', change: '+12', changeType: 'increase' },
  { name: 'Total Sessions', stat: '400', change: '+40', changeType: 'increase' },
  { name: 'Avg. Session Duration', stat: '5m 12s', change: '+45s', changeType: 'increase' },
]

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', sessions: 12, lastActive: '2024-03-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', sessions: 8, lastActive: '2024-03-14' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', sessions: 15, lastActive: '2024-03-15' },
]

export default function CohortSummary({ params }: { params: { id: string; cohortId: string } }) {
  const { id: projectId, cohortId } = params
  const cohort = { name: 'Cohort A', startDate: '2024-01-01' } // This would come from your API

  const breadcrumbs = [
    { name: 'Company Summary', href: '/app/index' },
    { name: 'Project Summary', href: `/app/projects/${projectId}` },
    { name: 'Cohort Summary', href: `/app/projects/${projectId}/cohorts/${cohortId}` }
  ]

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{cohort.name}</h2>
          <p className="text-sm text-gray-500">Started {cohort.startDate}</p>
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

        {/* Users List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Users</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul role="list" className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/app/projects/${projectId}/cohorts/${cohortId}/users/${user.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="truncate text-sm font-medium text-indigo-600">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="ml-2 flex flex-shrink-0">
                          <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {user.sessions} sessions
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Last active: {user.lastActive}
                        </p>
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