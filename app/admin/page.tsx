'use client'

import { useState } from 'react'

type Role = 'ed' | 'launch_director'
type RecStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'
type DomainStatus = 'open' | 'filled'

interface Director {
  id: number
  name: string
  email: string
  role: Role
  regiune?: string
  grup?: string
}

interface Recommendation {
  id: number
  from: string
  to: string
  domain: string
  details: string
  date: string
  status: RecStatus
  grup: string
}

interface PriorityDomain {
  id: number
  name: string
  description: string
  status: DomainStatus
  filledBy?: string
  grup: string
}

interface Group {
  name: string
  regiune: string
  director: string
  status: string
}

const initialDirectors: Director[] = [
  { id: 1, name: 'Adina Arjoca', email: 'adina@bni.ro', role: 'launch_director', grup: 'BNI GOLD' },
  { id: 2, name: 'Calin Hirza', email: 'calin@bni.ro', role: 'launch_director', grup: 'BNI MAGNUM OPUS' },
  { id: 3, name: 'Adrian Covasa', email: 'adrian@bni.ro', role: 'launch_director', grup: 'BNI HEALTH' },
]

const initialGroups: Group[] = [
  { name: 'BNI GOLD', regiune: 'Timis', director: 'Adina Arjoca', status: 'in formare' },
  { name: 'BNI MAGNUM OPUS', regiune: 'Salaj', director: 'Calin Hirza', status: 'in formare' },
  { name: 'BNI HEALTH', regiune: 'Cluj', director: 'Adrian Covasa', status: 'in formare' },
]

const initialRecommendations: Recommendation[] = [
  { id: 1, from: 'Ion Popescu', to: 'Maria Ionescu', domain: 'Contabilitate', details: 'Firma de contabilitate pentru IMM', date: '2026-05-20', status: 'pending', grup: 'BNI GOLD' },
  { id: 2, from: 'Ana Marinescu', to: 'Vlad Popa', domain: 'IT Services', details: 'Dezvoltare web si hosting', date: '2026-05-19', status: 'completed', grup: 'BNI GOLD' },
  { id: 3, from: 'Mihai Stan', to: 'Elena Radu', domain: 'Asigurari', details: 'Asigurari auto si CASCO', date: '2026-05-18', status: 'pending', grup: 'BNI MAGNUM OPUS' },
  { id: 4, from: 'Cristina Vas', to: 'Dan Moldovan', domain: 'Marketing Digital', details: 'Campanii social media', date: '2026-05-17', status: 'in_progress', grup: 'BNI HEALTH' },
]

const initialPriorityDomains: PriorityDomain[] = [
  { id: 1, name: 'Contabilitate', description: 'Servicii contabile si financiare', status: 'open', grup: 'BNI GOLD' },
  { id: 2, name: 'IT Services', description: 'Dezvoltare software, hosting, suport IT', status: 'filled', filledBy: 'Vlad Popa', grup: 'BNI GOLD' },
  { id: 3, name: 'Asigurari', description: 'Asigurari generale si de viata', status: 'open', grup: 'BNI GOLD' },
  { id: 4, name: 'Avocatura', description: 'Consultanta juridica si drept comercial', status: 'open', grup: 'BNI GOLD' },
  { id: 5, name: 'Marketing Digital', description: 'Social media, SEO, campanii online', status: 'open', grup: 'BNI GOLD' },
  { id: 6, name: 'Constructii', description: 'Constructii civile si renovari', status: 'open', grup: 'BNI MAGNUM OPUS' },
  { id: 7, name: 'Imobiliare', description: 'Vanzari si inchirieri proprietati', status: 'open', grup: 'BNI MAGNUM OPUS' },
  { id: 8, name: 'Transport', description: 'Logistica si transport marfa', status: 'open', grup: 'BNI MAGNUM OPUS' },
  { id: 9, name: 'Resurse Umane', description: 'Recrutare si HR outsourcing', status: 'open', grup: 'BNI HEALTH' },
  { id: 10, name: 'Medicina Muncii', description: 'Servicii SSM si medicina muncii', status: 'open', grup: 'BNI HEALTH' },
]

const allRegiuni = ['Timis', 'Salaj', 'Cluj', 'Bucuresti', 'Brasov', 'Sibiu', 'Constanta', 'Iasi', 'Mures', 'Bihor']

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<{ role: Role; name: string; regiune?: string; grup?: string } | null>(null)
  const [loginRole, setLoginRole] = useState<Role>('ed')
  const [loginGrup, setLoginGrup] = useState('')

  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'domains' | 'directors' | 'groups'>('overview')
  const [directors, setDirectors] = useState(initialDirectors)
  const [recommendations, setRecommendations] = useState(initialRecommendations)
  const [priorityDomains, setPriorityDomains] = useState(initialPriorityDomains)
  const [groups, setGroups] = useState(initialGroups)

  const [showAddDirector, setShowAddDirector] = useState(false)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newDirector, setNewDirector] = useState({ name: '', email: '', role: 'launch_director' as Role, regiune: '', grup: '' })
  const [newDomain, setNewDomain] = useState({ name: '', description: '', grup: '' })
  const [newGroup, setNewGroup] = useState({ name: '', regiune: '', director: '' })

  const filteredRecommendations = currentUser?.role === 'launch_director'
    ? recommendations.filter(r => r.grup === currentUser.grup)
    : recommendations

  const filteredDomains = currentUser?.role === 'launch_director'
    ? priorityDomains.filter(d => d.grup === currentUser.grup)
    : priorityDomains

  const filteredGroups = currentUser?.role === 'launch_director'
    ? groups.filter(g => g.name === currentUser.grup)
    : groups

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin2024') {
      if (loginRole === 'ed') {
        setCurrentUser({ role: 'ed', name: 'Executive Director' })
      } else {
        if (!loginGrup) { setError('Selecteaza grupul'); return }
        const dir = directors.find(d => d.grup === loginGrup)
        setCurrentUser({ role: 'launch_director', name: dir?.name || 'Launch Director', grup: loginGrup })
      }
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Parola incorecta')
    }
  }

  const updateRecStatus = (id: number, status: RecStatus) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    if (status === 'completed') {
      const rec = recommendations.find(r => r.id === id)
      if (rec) {
        setPriorityDomains(prev => prev.map(d =>
          d.grup === rec.grup && d.name === rec.domain && d.status === 'open'
            ? { ...d, status: 'filled' as DomainStatus, filledBy: rec.to }
            : d
        ))
      }
    }
  }

  const addDirector = () => {
    if (!newDirector.name || !newDirector.email) return
    setDirectors(prev => [...prev, { ...newDirector, id: prev.length + 1 }])
    setNewDirector({ name: '', email: '', role: 'launch_director', regiune: '', grup: '' })
    setShowAddDirector(false)
  }

  const addDomain = () => {
    if (!newDomain.name || !newDomain.grup) return
    const grupDomains = priorityDomains.filter(d => d.grup === newDomain.grup)
    if (grupDomains.length >= 5) { setError('Maxim 5 domenii per grup'); return }
    setPriorityDomains(prev => [...prev, { ...newDomain, id: prev.length + 1, status: 'open' as DomainStatus }])
    setNewDomain({ name: '', description: '', grup: '' })
    setShowAddDomain(false)
    setError('')
  }

  const addGroup = () => {
    if (!newGroup.name || !newGroup.regiune) return
    setGroups(prev => [...prev, { ...newGroup, status: 'in formare' }])
    setNewGroup({ name: '', regiune: '', director: '' })
    setShowAddGroup(false)
  }

  const removeDomain = (id: number) => {
    setPriorityDomains(prev => prev.filter(d => d.id !== id))
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-t-4 border-red-600">
          <div className="text-center mb-6">
            <span className="text-red-600 font-black text-3xl">BNI</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Admin Panel</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase">Tip acces</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setLoginRole('ed')}
                  className={`p-3 rounded border-2 text-sm font-semibold transition ${loginRole === 'ed' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  Director Executiv
                  <span className="block text-xs font-normal mt-1">Acces pe regiune</span>
                </button>
                <button type="button" onClick={() => setLoginRole('launch_director')}
                  className={`p-3 rounded border-2 text-sm font-semibold transition ${loginRole === 'launch_director' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  Director Lansare
                  <span className="block text-xs font-normal mt-1">Acces pe grup</span>
                </button>
              </div>
            </div>

            {loginRole === 'launch_director' && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase">Grupul tau</label>
                <select value={loginGrup} onChange={e => setLoginGrup(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600">
                  <option value="">-- Selecteaza grup --</option>
                  {groups.map(g => <option key={g.name} value={g.name}>{g.name} ({g.regiune})</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase">Parola</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600"
                placeholder="Introdu parola" />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

            <button type="submit" className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold">
              Autentificare
            </button>
          </form>
        </div>
      </div>
    )
  }

  const statusColors: Record<RecStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }

  const statusLabels: Record<RecStatus, string> = {
    pending: 'In asteptare',
    in_progress: 'In lucru',
    completed: 'Finalizata',
    rejected: 'Respinsa',
  }

  const stats = {
    totalGroups: filteredGroups.length,
    totalRecs: filteredRecommendations.length,
    pendingRecs: filteredRecommendations.filter(r => r.status === 'pending').length,
    completedRecs: filteredRecommendations.filter(r => r.status === 'completed').length,
    openDomains: filteredDomains.filter(d => d.status === 'open').length,
    filledDomains: filteredDomains.filter(d => d.status === 'filled').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-red-500 font-black text-xl">BNI</span>
            <div>
              <h1 className="font-bold">Admin Panel</h1>
              <p className="text-xs text-gray-400">
                {currentUser?.role === 'ed' ? 'Director Executiv — Toate regiunile' : `Director Lansare — ${currentUser?.grup}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{currentUser?.name}</span>
            <button onClick={() => { setIsAuthenticated(false); setCurrentUser(null); setPassword('') }}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'overview', label: 'Sumar' },
              { key: 'recommendations', label: 'Recomandari' },
              { key: 'domains', label: 'Domenii Prioritare' },
              ...(currentUser?.role === 'ed' ? [
                { key: 'directors', label: 'Directori' },
                { key: 'groups', label: 'Grupuri' },
              ] : []),
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${activeTab === tab.key ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Grupuri', value: stats.totalGroups, color: 'text-gray-900' },
                { label: 'Recomandari', value: stats.totalRecs, color: 'text-gray-900' },
                { label: 'In asteptare', value: stats.pendingRecs, color: 'text-amber-600' },
                { label: 'Finalizate', value: stats.completedRecs, color: 'text-green-600' },
                { label: 'Domenii deschise', value: stats.openDomains, color: 'text-red-600' },
                { label: 'Domenii ocupate', value: stats.filledDomains, color: 'text-green-600' },
              ].map(s => (
                <div key={s.label} className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Ultimele recomandari</h2>
              <div className="space-y-3">
                {filteredRecommendations.slice(0, 5).map(rec => (
                  <div key={rec.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{rec.from} &rarr; {rec.to}</p>
                      <p className="text-sm text-gray-500">{rec.domain} &middot; {rec.grup}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[rec.status]}`}>
                      {statusLabels[rec.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestionare Recomandari</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">De la</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Catre</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Domeniu</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Grup</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecommendations.map(rec => (
                      <tr key={rec.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{rec.from}</td>
                        <td className="py-3 px-4">{rec.to}</td>
                        <td className="py-3 px-4 text-sm">{rec.domain}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{rec.grup}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{rec.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[rec.status]}`}>
                            {statusLabels[rec.status]}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select value={rec.status} onChange={e => updateRecStatus(rec.id, e.target.value as RecStatus)}
                            className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-red-400">
                            <option value="pending">In asteptare</option>
                            <option value="in_progress">In lucru</option>
                            <option value="completed">Finalizata</option>
                            <option value="rejected">Respinsa</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PRIORITY DOMAINS */}
        {activeTab === 'domains' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Domenii Prioritare</h2>
                <p className="text-sm text-gray-500">Top 5 domenii de interes per grup. Domeniile ocupate apar cu verde.</p>
              </div>
              <button onClick={() => setShowAddDomain(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold">
                + Adauga domeniu
              </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">{error}</div>}

            {/* Add domain modal */}
            {showAddDomain && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-4">Adauga domeniu prioritar</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <input placeholder="Nume domeniu (ex: Contabilitate)" value={newDomain.name}
                    onChange={e => setNewDomain({ ...newDomain, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400" />
                  <input placeholder="Descriere scurta" value={newDomain.description}
                    onChange={e => setNewDomain({ ...newDomain, description: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400" />
                  <select value={newDomain.grup} onChange={e => setNewDomain({ ...newDomain, grup: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400">
                    <option value="">-- Grup --</option>
                    {(currentUser?.role === 'launch_director' ? groups.filter(g => g.name === currentUser.grup) : groups)
                      .map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addDomain} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold">Salveaza</button>
                  <button onClick={() => { setShowAddDomain(false); setError('') }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm">Anuleaza</button>
                </div>
              </div>
            )}

            {/* Domains grouped by group */}
            {(currentUser?.role === 'launch_director' ? [currentUser.grup!] : Array.from(new Set(groups.map(g => g.name)))).map(grupName => {
              const grupDomains = priorityDomains.filter(d => d.grup === grupName)
              const grup = groups.find(g => g.name === grupName)
              return (
                <div key={grupName} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-gray-900">{grupName}</h3>
                    <span className="text-xs text-gray-400">({grup?.regiune})</span>
                    <span className="text-xs text-gray-400">{grupDomains.length}/5 domenii</span>
                  </div>
                  <div className="grid md:grid-cols-5 gap-3">
                    {grupDomains.map(domain => (
                      <div key={domain.id}
                        className={`p-4 rounded-lg border-2 transition ${domain.status === 'filled'
                          ? 'bg-green-50 border-green-300'
                          : 'bg-white border-gray-200 hover:border-red-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-3 h-3 rounded-full mt-1 ${domain.status === 'filled' ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}></div>
                          {currentUser?.role === 'ed' && domain.status === 'open' && (
                            <button onClick={() => removeDomain(domain.id)} className="text-gray-400 hover:text-red-600 text-xs">&times;</button>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-gray-900">{domain.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{domain.description}</p>
                        {domain.status === 'filled' && (
                          <p className="text-xs text-green-700 font-semibold mt-2">Ocupat: {domain.filledBy}</p>
                        )}
                        {domain.status === 'open' && (
                          <span className="inline-block text-xs text-red-600 font-semibold mt-2">Cautat</span>
                        )}
                      </div>
                    ))}
                    {grupDomains.length < 5 && Array.from({ length: 5 - grupDomains.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-4 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-400">Slot disponibil</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* DIRECTORS (ED only) */}
        {activeTab === 'directors' && currentUser?.role === 'ed' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Directori</h2>
              <button onClick={() => setShowAddDirector(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold">
                + Adauga director
              </button>
            </div>

            {showAddDirector && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-4">Director nou</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input placeholder="Nume complet" value={newDirector.name}
                    onChange={e => setNewDirector({ ...newDirector, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400" />
                  <input placeholder="Email" value={newDirector.email}
                    onChange={e => setNewDirector({ ...newDirector, email: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400" />
                  <select value={newDirector.role} onChange={e => setNewDirector({ ...newDirector, role: e.target.value as Role })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400">
                    <option value="ed">Director Executiv</option>
                    <option value="launch_director">Director Lansare</option>
                  </select>
                  {newDirector.role === 'ed' ? (
                    <select value={newDirector.regiune} onChange={e => setNewDirector({ ...newDirector, regiune: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400">
                      <option value="">-- Regiune --</option>
                      {allRegiuni.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <select value={newDirector.grup} onChange={e => setNewDirector({ ...newDirector, grup: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400">
                      <option value="">-- Grup --</option>
                      {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addDirector} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold">Salveaza</button>
                  <button onClick={() => setShowAddDirector(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm">Anuleaza</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nume</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Asignare</th>
                  </tr>
                </thead>
                <tbody>
                  {directors.map(dir => (
                    <tr key={dir.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{dir.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{dir.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${dir.role === 'ed' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                          {dir.role === 'ed' ? 'Director Executiv' : 'Director Lansare'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {dir.role === 'ed' ? `Regiunea ${dir.regiune}` : dir.grup}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GROUPS (ED only) */}
        {activeTab === 'groups' && currentUser?.role === 'ed' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Grupuri BNI</h2>
              <button onClick={() => setShowAddGroup(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold">
                + Adauga grup
              </button>
            </div>

            {showAddGroup && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-4">Grup nou</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <input placeholder="Nume grup (ex: BNI ELITE)" value={newGroup.name}
                    onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400" />
                  <select value={newGroup.regiune} onChange={e => setNewGroup({ ...newGroup, regiune: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400">
                    <option value="">-- Regiune --</option>
                    {allRegiuni.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input placeholder="Director responsabil" value={newGroup.director}
                    onChange={e => setNewGroup({ ...newGroup, director: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-400" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addGroup} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold">Salveaza</button>
                  <button onClick={() => setShowAddGroup(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm">Anuleaza</button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(g => (
                <div key={g.name} className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">BNI</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{g.name}</h3>
                      <p className="text-xs text-gray-500">Regiunea {g.regiune}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Director:</span> <span className="font-medium">{g.director || 'Neasignat'}</span></p>
                    <p><span className="text-gray-500">Status:</span>
                      <span className="ml-1 inline-flex items-center gap-1 text-amber-700 font-medium">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>{g.status}
                      </span>
                    </p>
                    <p><span className="text-gray-500">Domenii:</span> <span className="font-medium">{priorityDomains.filter(d => d.grup === g.name).length}/5</span></p>
                    <p><span className="text-gray-500">Recomandari:</span> <span className="font-medium">{recommendations.filter(r => r.grup === g.name).length}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
