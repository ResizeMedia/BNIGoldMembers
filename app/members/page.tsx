export default function Members() {
  const members = [
    { id: 1, name: 'John Doe', business: 'Digital Marketing Agency' },
    { id: 2, name: 'Ana Popescu', business: 'IT Consulting' },
    { id: 3, name: 'Mihai Ionescu', business: 'Real Estate' },
    { id: 4, name: 'Elena Sharma', business: 'Business Development' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">BNI Gold Members</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {members.map((member) => (
          <div key={member.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
            <p className="text-gray-600 mt-2">{member.business}</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Give Recommendation
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">About Our Network</h2>
        <p className="text-gray-700">
          Our BNI Gold Members network comprises successful business professionals
          committed to building mutually beneficial relationships and generating
          qualified referrals.
        </p>
      </div>
    </div>
  )
}
