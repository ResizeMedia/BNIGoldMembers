'use client'

import { useState } from 'react'

interface Recommendation {
  id: number
  from: string
  to: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const recommendations: Recommendation[] = [
    { id: 1, from: 'John Doe', to: 'Ana Popescu', date: '2024-05-20', status: 'pending' },
    { id: 2, from: 'Mihai Ionescu', to: 'Elena Sharma', date: '2024-05-19', status: 'approved' },
    { id: 3, from: 'Elena Sharma', to: 'John Doe', date: '2024-05-18', status: 'pending' },
  ]

  const stats = {
    totalMembers: 12,
    totalRecommendations: 23,
    pendingRecommendations: 7,
    groups: 3,
    freeDomains: 5,
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check (in production, use proper auth)
    if (password === 'admin2024') {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid password')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
            Executive Director Access
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Executive Director Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-5 gap-4 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">Total Members</p>
          <p className="text-3xl font-bold text-blue-900">{stats.totalMembers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">Recommendations</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalRecommendations}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingRecommendations}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">Active Groups</p>
          <p className="text-3xl font-bold text-purple-600">{stats.groups}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">Free Domains</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.freeDomains}</p>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">Recent Recommendations</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">From</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">To</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec) => (
                <tr key={rec.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{rec.from}</td>
                  <td className="py-3 px-4">{rec.to}</td>
                  <td className="py-3 px-4">{rec.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      rec.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      rec.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-x-2">
                    {rec.status === 'pending' && (
                      <>
                        <button className="text-green-600 hover:text-green-800 font-semibold text-sm">
                          Approve
                        </button>
                        <button className="text-red-600 hover:text-red-800 font-semibold text-sm">
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={() => setIsAuthenticated(false)}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 font-semibold"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
