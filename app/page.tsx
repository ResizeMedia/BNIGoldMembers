import Link from 'next/link'

const grupuriInFormare = [
  {
    regiune: 'Cluj',
    grupuri: [
      { name: 'BNI HEALTH', director: 'Adrian Covasa', rol: 'Launch Director', status: 'in formare' },
    ]
  },
  {
    regiune: 'Salaj',
    grupuri: [
      { name: 'BNI MAGNUM OPUS', director: 'Calin Hirza', rol: 'Launch Director', status: 'in formare' },
    ]
  },
  {
    regiune: 'Timis',
    grupuri: [
      { name: 'BNI GOLD', director: 'Adina Arjoca', rol: 'Launch Director', status: 'in formare' },
    ]
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-black mb-4 tracking-tight">
              BNI Gold Members Romania
            </h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Conectam membrii, impartasim recomandari, construim relatii de afaceri
            </p>
          </div>
        </div>
      </div>

      {/* Grupuri in Formare - SECTIUNEA PRINCIPALA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <h2 className="text-3xl font-bold text-gray-900">Grupuri in Formare</h2>
          </div>
          <p className="text-gray-600 ml-6">
            Grupuri BNI noi, organizate pe regiuni. Fiecare grup este coordonat de un Director de Lansare.
          </p>
        </div>

        <div className="space-y-6">
          {grupuriInFormare.map((regiune) => (
            <div key={regiune.regiune} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 text-white px-6 py-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-bold uppercase tracking-wider">Regiunea {regiune.regiune}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {regiune.grupuri.map((grup) => (
                  <div key={grup.name} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">BNI</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{grup.name}</h4>
                        <p className="text-sm text-gray-500">
                          <span className="text-red-600 font-medium">{grup.rol}</span> &mdash; {grup.director}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        In Formare
                      </span>
                      <Link
                        href={`/recommendations?group=${encodeURIComponent(grup.name)}`}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Detalii &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info box for directors */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Esti Director de Lansare sau Director Executiv?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Adauga si gestioneaza grupul tau BNI direct din panoul de administrare.
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold transition"
              >
                Acceseaza Admin Panel
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/members" className="group p-6 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-md transition">
              <h3 className="font-bold text-gray-900 group-hover:text-red-600 mb-2">Membri</h3>
              <p className="text-sm text-gray-500">Directorul membrilor BNI Gold activi</p>
            </Link>
            <Link href="/recommendations" className="group p-6 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-md transition">
              <h3 className="font-bold text-gray-900 group-hover:text-red-600 mb-2">Recomandari</h3>
              <p className="text-sm text-gray-500">Ofera recomandari membrilor din retea</p>
            </Link>
            <Link href="/domains" className="group p-6 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-md transition">
              <h3 className="font-bold text-gray-900 group-hover:text-red-600 mb-2">Domenii Gratuite</h3>
              <p className="text-sm text-gray-500">Domenii web disponibile pentru grupuri noi</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-400 text-sm">
            BNI Gold Members Romania &mdash; Platforma de management pentru grupurile BNI
          </p>
        </div>
      </div>
    </div>
  )
}
