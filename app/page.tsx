import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            BNI Gold Members Romania
          </h1>
          <p className="text-xl text-gray-600">
            Connecting members, sharing recommendations, building relationships
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">Members</h2>
            <p className="text-gray-600 mb-4">
              Browse our network of active BNI Gold Members
            </p>
            <Link href="/members" className="text-blue-600 hover:text-blue-900 font-semibold">
              View Members →
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">Give Recommendations</h2>
            <p className="text-gray-600 mb-4">
              Share your valuable recommendations with fellow members
            </p>
            <Link href="/recommendations" className="text-blue-600 hover:text-blue-900 font-semibold">
              Give a Recommendation →
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">Available Domains</h2>
            <p className="text-gray-600 mb-4">
              Free domains for BNI groups launching new initiatives
            </p>
            <Link href="/domains" className="text-blue-600 hover:text-blue-900 font-semibold">
              View Domains →
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">Admin Dashboard</h2>
            <p className="text-gray-600 mb-4">
              Executive director portal for managing groups and recommendations
            </p>
            <Link href="/admin" className="text-blue-600 hover:text-blue-900 font-semibold">
              Admin Access →
            </Link>
          </div>
        </div>

        <div className="bg-blue-900 text-white p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to the BNI Community</h2>
          <p className="text-blue-100">
            Building strong business relationships through structured networking
          </p>
        </div>
      </div>
    </div>
  )
}
