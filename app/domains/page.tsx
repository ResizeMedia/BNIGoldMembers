export default function Domains() {
  const domains = [
    {
      id: 1,
      domain: 'bni-transylvania.com',
      group: 'BNI Transylvania',
      status: 'Available',
      description: 'Free domain for the new Transylvania regional group'
    },
    {
      id: 2,
      domain: 'bni-moldavia.com',
      group: 'BNI Moldavia',
      status: 'Available',
      description: 'Free domain for the Moldavia expansion initiative'
    },
    {
      id: 3,
      domain: 'bni-banat.com',
      group: 'BNI Banat',
      status: 'Available',
      description: 'Free domain for the Banat region group'
    },
    {
      id: 4,
      domain: 'bni-bucharest-south.com',
      group: 'BNI Bucharest South',
      status: 'Available',
      description: 'Free domain for the South Bucharest chapter'
    },
    {
      id: 5,
      domain: 'bni-growth-leaders.com',
      group: 'BNI Growth Leaders',
      status: 'Available',
      description: 'Free domain for executive development group'
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Available Free Domains</h1>

      <div className="grid gap-6 mb-12">
        {domains.map((domain) => (
          <div key={domain.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-blue-600">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-mono">{domain.domain}</h3>
                <p className="text-lg text-blue-600 font-semibold mt-1">{domain.group}</p>
              </div>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {domain.status}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{domain.description}</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Request Domain
            </button>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Domain Support</h2>
        <p className="text-gray-700 mb-4">
          We provide free domains to support new BNI group launches and regional expansions.
          If you're starting a new group or need a domain for your chapter, contact the Executive Director.
        </p>
        <div className="mt-4 p-4 bg-white rounded border border-blue-200">
          <p className="text-sm text-gray-600">
            <strong>Email:</strong> ed@bnigoldmembers.com
          </p>
        </div>
      </div>
    </div>
  )
}
