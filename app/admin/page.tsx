'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { predefinedDomains } from '@/lib/domain-options'
import { domainEnToRo } from '@/lib/domain-en-ro'
import LaunchSeats from '@/components/LaunchSeats'
import {
  Director,
  DirectorRole,
  DomainStatus,
  DIRECTORS_STORAGE_KEY,
  EmailLog,
  EmailTemplate,
  Group,
  GROUPS_STORAGE_KEY,
  PriorityDomain,
  Recommendation,
  RecommendationStatus,
  RegulationContent,
  SmtpSettings,
  getActiveSlotDomains,
  getDirectorGroups,
  getDirectorRegions,
  getGroupsForDirector,
  isGroupLaunched,
  getLaunchCompletionPercent,
  getLaunchProgressLabel,
  getLaunchSeats,
  getMemberLeaderboard,
  getRecommendedMemberCount,
  GoldPerformer,
  goldThreshold,
  initialDirectors,
  initialGoldPerformers,
  initialEmailTemplates,
  initialGroups,
  initialPriorityDomains,
  initialRecommendations,
  initialRegulationContent,
  initialSmtpSettings,
  isDomainRecommended,
  renderEmailTemplate,
  regions,
} from '@/lib/bni-data'

const statusColors: Record<RecommendationStatus, string> = {
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  recommendation_confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  invited_bni: 'bg-violet-50 text-violet-700 border-violet-200',
  member_bni: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const statusLabels: Record<RecommendationStatus, string> = {
  new: 'Recomandare noua',
  recommendation_confirmed: 'Recomandare confirmata',
  invited_bni: 'Invitat BNI',
  member_bni: 'Membru BNI',
  rejected: 'Respinsa',
}

function roleLabel(role: DirectorRole) {
  if (role === 'admin') {
    return 'Administrator'
  }

  if (role === 'executive_director') return 'Director Executiv'
  if (role === 'growth_consultant') return 'Director Consultant Crestere'
  return 'Director Consultant Lansare'
}

function accessLabel(director: Director) {
  if (director.role === 'admin') {
    return 'Acces complet'
  }

  const parts: string[] = []
  const regions = getDirectorRegions(director)
  const groups = getDirectorGroups(director)
  if (regions.length > 0) parts.push(`Regiuni: ${regions.join(', ')}`)
  if (groups.length > 0) parts.push(`Grupuri: ${groups.join(', ')}`)

  return parts.length > 0 ? parts.join(' · ') : 'Neconfigurat'
}

function getReadableEmailError(message: string) {
  if (message.includes('ECONNREFUSED')) {
    const endpointMatch = message.match(/ECONNREFUSED\s+([^\s]+)/)
    const endpoint = endpointMatch ? ` (${endpointMatch[1]})` : ''

    return `Conexiunea SMTP a fost refuzata${endpoint}. Pentru Hosterion foloseste lyssa.hosterion.net, port 465, SSL/TLS activ. Daca vezi o adresa Google, setarile salvate in admin inca folosesc Gmail.`
  }

  if (message.includes('ENETUNREACH') || message.includes('EHOSTUNREACH')) {
    return 'Serverul nu poate ajunge la adresa SMTP selectata. Pentru Hosterion foloseste lyssa.hosterion.net, port 465, SSL/TLS activ. Daca vezi o adresa IPv6 Google, setarile salvate in admin inca folosesc Gmail.'
  }

  if (message.includes('Hostname/IP does not match certificate')) {
    return 'Certificatul SMTP nu se potriveste cu hostul introdus. Pentru Hosterion foloseste lyssa.hosterion.net ca SMTP host, nu aliasul webmail.resize-media.com.'
  }

  if (message.includes('ETIMEDOUT')) {
    return 'Conexiunea SMTP expira. Hostingul poate bloca portul sau serverul SMTP nu raspunde.'
  }

  if (message.includes('EAUTH') || message.toLowerCase().includes('auth')) {
    return 'Autentificarea SMTP a esuat. Verifica utilizatorul complet, parola contului SMTP si daca emailul expeditor este permis pentru acel cont.'
  }

  return message
}

type AdminTab = 'overview' | 'recommendations' | 'domains' | 'directors' | 'performers' | 'groups' | 'regulation' | 'email_templates' | 'smtp'

const ADMIN_SESSION_KEY = 'bni-admin-session'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<Director | null>(null)


  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [directors, setDirectors] = useState<Director[]>(initialDirectors)
  const [directorsLoadedFromServer, setDirectorsLoadedFromServer] = useState(false)
  const [groupsLoadedFromServer, setGroupsLoadedFromServer] = useState(false)
  const [smtpLoadedFromServer, setSmtpLoadedFromServer] = useState(false)
  const [domainsLoadedFromServer, setDomainsLoadedFromServer] = useState(false)
  const [recommendationsLoadedFromServer, setRecommendationsLoadedFromServer] = useState(false)
  const [regulationLoadedFromServer, setRegulationLoadedFromServer] = useState(false)
  const [emailTemplatesLoadedFromServer, setEmailTemplatesLoadedFromServer] = useState(false)
  const [emailLogLoadedFromServer, setEmailLogLoadedFromServer] = useState(false)
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [performers, setPerformers] = useState<GoldPerformer[]>(initialGoldPerformers)
  const [performersLoadedFromServer, setPerformersLoadedFromServer] = useState(false)
  const [scrapingId, setScrapingId] = useState<number | null>(null)
  const [editingPerformerId, setEditingPerformerId] = useState<number | null>(null)
  const [performerSearch, setPerformerSearch] = useState('')
  const [performerRegionFilter, setPerformerRegionFilter] = useState('')
  const [performerGroupFilter, setPerformerGroupFilter] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations)
  const [priorityDomains, setPriorityDomains] = useState<PriorityDomain[]>(initialPriorityDomains)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(initialEmailTemplates)
  const [emailLog, setEmailLog] = useState<EmailLog[]>([])
  const [regulationContent, setRegulationContent] = useState<RegulationContent>(initialRegulationContent)
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(initialSmtpSettings)

  const [showAddDirector, setShowAddDirector] = useState(false)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [groupSearch, setGroupSearch] = useState('')
  const [newDirector, setNewDirector] = useState({ name: '', email: '', role: 'launch_consultant' as DirectorRole, temporaryPassword: '', regions: [] as string[], groups: [] as string[] })
  const [newDomain, setNewDomain] = useState({ name: '', description: '', group: '' })
  const [newGroup, setNewGroup] = useState({ name: '', region: '', director: '', currentMembers: 0, launchTargetMembers: 25, active: true, launched: false })
  const [editingGroupName, setEditingGroupName] = useState('')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editingDirectorId, setEditingDirectorId] = useState<number | null>(null)
  const [manageExtraGroups, setManageExtraGroups] = useState(false)
  const [editingDirector, setEditingDirector] = useState<Director | null>(null)
  const [temporaryPasswordInput, setTemporaryPasswordInput] = useState('')
  const [openRecommendationIds, setOpenRecommendationIds] = useState<number[]>([])
  const [smtpTestStatus, setSmtpTestStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({ type: 'idle', message: '' })
  const [directorSort, setDirectorSort] = useState<{ column: 'name' | 'email' | 'role'; dir: 'asc' | 'desc' }>({ column: 'name', dir: 'asc' })
  const [directorRoleFilter, setDirectorRoleFilter] = useState<'all' | DirectorRole>('all')
  const [directorSearch, setDirectorSearch] = useState('')

  const visibleGroups = useMemo(() => currentUser ? getGroupsForDirector(currentUser, groups) : [], [currentUser, groups])
  const visibleGroupNames = useMemo(() => new Set(visibleGroups.map((group) => group.name)), [visibleGroups])
  const visibleRegionNames = useMemo(() => new Set(visibleGroups.map((group) => group.region)), [visibleGroups])

  const visibleRecommendations = useMemo(
    () => recommendations.filter((recommendation) => visibleGroupNames.has(recommendation.group)),
    [recommendations, visibleGroupNames]
  )

  const visibleDomains = useMemo(
    () => priorityDomains.filter((domain) => visibleGroupNames.has(domain.group)),
    [priorityDomains, visibleGroupNames]
  )

  const visibleDirectors = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'admin') return directors

    return directors.filter((director) => {
      if (director.role === 'admin') return false
      if (getDirectorGroups(director).some((group) => visibleGroupNames.has(group))) return true
      return getDirectorRegions(director).some((region) => visibleRegionNames.has(region))
    })
  }, [currentUser, directors, visibleGroupNames, visibleRegionNames])

  const displayedDirectors = useMemo(() => {
    let filtered = directorRoleFilter === 'all'
      ? visibleDirectors
      : visibleDirectors.filter((director) => director.role === directorRoleFilter)

    if (directorSearch) {
      const q = directorSearch.toLowerCase()
      filtered = filtered.filter((d) => d.name.toLowerCase().includes(q))
    }

    const value = (director: Director) => {
      if (directorSort.column === 'role') return roleLabel(director.role)
      return (director[directorSort.column] || '').toLowerCase()
    }

    return [...filtered].sort((a, b) => {
      const cmp = value(a).localeCompare(value(b), 'ro')
      return directorSort.dir === 'asc' ? cmp : -cmp
    })
  }, [visibleDirectors, directorRoleFilter, directorSearch, directorSort])

  const editablePerformers = useMemo(() => {
    if (!currentUser) return [] as GoldPerformer[]
    if (currentUser.role === 'admin') return performers
    const directorRegions = getDirectorRegions(currentUser)
    const groupNames = getGroupsForDirector(currentUser, groups).map((group) => group.name)
    return performers.filter((performer) => directorRegions.includes(performer.region) || groupNames.includes(performer.group))
  }, [performers, currentUser, groups])

  function addPerformer() {
    const nextId = performers.reduce((max, performer) => Math.max(max, performer.id), 0) + 1
    setPerformers((prev) => [...prev, { id: nextId, name: 'Membru nou', group: '', region: '', business: '', sponsoredMembers: 0, competitionRecommendations: 0, bniProfileUrl: '' }])
  }

  function updatePerformer(id: number, patch: Partial<GoldPerformer>) {
    setPerformers((prev) => prev.map((performer) => (performer.id === id ? { ...performer, ...patch } : performer)))
  }

  function deletePerformer(id: number) {
    if (!window.confirm('Stergi acest membru?')) return
    setPerformers((prev) => prev.filter((performer) => performer.id !== id))
  }

  async function scrapePerformerProfile(id: number) {
    const p = performers.find((item) => item.id === id)
    if (!p?.bniProfileUrl) { setError('Seteaza link-ul profil BNI inainte de Preia date'); return }
    setScrapingId(id)
    try {
      const res = await fetch('/api/scrape-bni-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: p.bniProfileUrl }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error || 'Scraping esuat'); return }
      const patch: Partial<GoldPerformer> = {}
      if (json.data.photoUrl) patch.photoUrl = json.data.photoUrl
      if (json.data.company) patch.company = json.data.company
      if (json.data.domain) {
        const enKey = Object.keys(domainEnToRo).find((k) => k.toLowerCase() === json.data.domain.toLowerCase())
        const translated = enKey ? domainEnToRo[enKey] : undefined
        if (translated && (predefinedDomains as readonly string[]).includes(translated)) {
          patch.business = translated
        } else {
          const raw = json.data.domain.toLowerCase()
          const fuzzy = predefinedDomains.find((d: string) => d.toLowerCase() === raw)
            || predefinedDomains.find((d: string) => raw.includes(d.toLowerCase()) || d.toLowerCase().includes(raw))
          if (fuzzy) {
            patch.business = fuzzy
          } else {
            setError(`Domeniu BNI: "${json.data.domain}" — nu s-a gasit corespondenta automata. Alege manual din dropdown.`)
          }
        }
      }
      updatePerformer(id, patch)
    } catch {
      setError('Eroare la conectarea cu serverul')
    } finally {
      setScrapingId(null)
    }
  }

  const toggleDirectorSort = (column: 'name' | 'email' | 'role') => {
    setDirectorSort((prev) => prev.column === column
      ? { column, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { column, dir: 'asc' })
  }

  const rankedGroups = useMemo(
    () => visibleGroups
      .map((group) => ({
        ...group,
        launchPercent: getLaunchCompletionPercent(group, priorityDomains),
        launchLabel: getLaunchProgressLabel(group, priorityDomains),
        recommendedMembers: getRecommendedMemberCount(group, priorityDomains),
        domains: priorityDomains.filter((domain) => domain.group === group.name),
        slotDomains: getActiveSlotDomains(group, priorityDomains),
        seats: getLaunchSeats(group, priorityDomains),
        recommendations: recommendations.filter((recommendation) => recommendation.group === group.name),
      }))
      .sort((a, b) => b.launchPercent - a.launchPercent || b.recommendedMembers - a.recommendedMembers || a.name.localeCompare(b.name)),
    [visibleGroups, recommendations, priorityDomains]
  )

  const domainsTabData = useMemo(
    () => visibleGroups.map((group) => {
      const groupDomains = priorityDomains.filter((domain) => domain.group === group.name)
      return {
        group,
        groupDomains,
        slotDomains: getActiveSlotDomains(group, priorityDomains),
        seats: getLaunchSeats(group, priorityDomains),
        replacedDomains: groupDomains.filter((domain) => domain.inSlots === false && domain.filledFromRecommendationId != null),
      }
    }),
    [visibleGroups, priorityDomains]
  )

  const memberLeaderboard = useMemo(() => getMemberLeaderboard(visibleRecommendations).slice(0, 8), [visibleRecommendations])
  const newNotifications = useMemo(
    () => visibleRecommendations.filter((recommendation) => recommendation.status === 'new'),
    [visibleRecommendations]
  )

  const stats = {
    groups: visibleGroups.length,
    recommendations: visibleRecommendations.length,
    pending: visibleRecommendations.filter((recommendation) => recommendation.status === 'new').length,
    completed: visibleRecommendations.filter((recommendation) => recommendation.status === 'member_bni').length,
    openDomains: visibleDomains.filter((domain) => domain.status === 'open').length,
    filledDomains: visibleDomains.filter((domain) => domain.status === 'filled').length,
  }

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'overview', label: 'Sumar' },
    { key: 'recommendations', label: 'Recomandari' },
    { key: 'domains', label: 'Domenii' },
    { key: 'directors', label: 'Directori' },
    ...(currentUser?.role !== 'launch_consultant' ? [
      { key: 'performers' as AdminTab, label: 'Membri Gold' },
    ] : []),
    { key: 'groups' as AdminTab, label: 'Grupuri' },
    ...(currentUser?.role === 'admin' ? [
      { key: 'regulation' as AdminTab, label: 'Regulament' },
    ] : []),
    ...(currentUser?.role === 'admin' ? [
      { key: 'email_templates' as AdminTab, label: 'Template email' },
    ] : []),
    ...(currentUser?.role === 'admin' ? [
      { key: 'smtp' as AdminTab, label: 'SMTP' },
    ] : []),
  ]

  const createEmailFromTemplate = async (type: EmailTemplate['type'], recommendation: Recommendation, nextStatus?: RecommendationStatus) => {
    if (!recommendation.recommenderEmail) {
      setError('Recomandarea nu are emailul celui care a recomandat, deci nu pot trimite notificarea.')
      return
    }

    const template = emailTemplates.find((item) => item.type === type) || initialEmailTemplates.find((item) => item.type === type)
    if (!template) return

    const renderedEmail = renderEmailTemplate(template, {
      recommenderName: recommendation.from,
      recommendedName: recommendation.to,
      domain: recommendation.domain,
      group: recommendation.group,
      status: nextStatus ? statusLabels[nextStatus] : statusLabels[recommendation.status],
    })

    const emailEntry = {
      id: Date.now(),
      type,
      to: recommendation.recommenderEmail || '',
      subject: renderedEmail.subject,
      body: renderedEmail.body,
      recommendationId: recommendation.id,
      createdAt: new Date().toISOString(),
    }

    setEmailLog((prev) => [
      ...prev,
      {
        ...emailEntry,
        status: 'generat',
      },
    ])

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpSettings,
          email: {
            to: recommendation.recommenderEmail,
            subject: renderedEmail.subject,
            body: renderedEmail.body,
          },
        }),
      })

      const result = await response.json() as { success?: boolean; error?: string }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Nu am putut trimite emailul')
      }

      setEmailLog((prev) => prev.map((email) => email.id === emailEntry.id ? { ...email, status: 'trimis' } : email))
      setError('')
    } catch (sendError) {
      const rawMessage = sendError instanceof Error ? sendError.message : 'Nu am putut trimite emailul'
      const message = getReadableEmailError(rawMessage)
      setEmailLog((prev) => prev.map((email) => email.id === emailEntry.id ? { ...email, status: 'eroare', error: message } : email))
      setError(`Emailul nu a putut fi trimis: ${message}`)
    }
  }

  const testSmtpConnection = async () => {
    setSmtpTestStatus({ type: 'idle', message: 'Testez conexiunea SMTP...' })

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpSettings,
          testOnly: true,
        }),
      })
      const result = await response.json() as { success?: boolean; message?: string; error?: string }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Conexiunea SMTP nu a putut fi validata')
      }

      setSmtpTestStatus({ type: 'success', message: result.message || 'Conexiunea SMTP este valida' })
    } catch (testError) {
      const rawMessage = testError instanceof Error ? testError.message : 'Conexiunea SMTP nu a putut fi validata'
      const message = getReadableEmailError(rawMessage)
      setSmtpTestStatus({ type: 'error', message })
    }
  }

  const applyLocalRelayPreset = () => {
    setSmtpSettings((prev) => ({
      ...prev,
      host: 'localhost',
      port: '25',
      secure: false,
      username: '',
      password: '',
    }))
    setSmtpTestStatus({
      type: 'idle',
      message: 'Relay local Hosterion aplicat (localhost:25). Nu necesita autentificare. Emailul expeditor trebuie sa fie un cont valid pe server.',
    })
  }

  const applyHosterionSmtpPreset = () => {
    setSmtpSettings((prev) => ({
      ...prev,
      host: 'lyssa.hosterion.net',
      port: '465',
      secure: true,
    }))
    setSmtpTestStatus({
      type: 'idle',
      message: 'Preset Hosterion aplicat. Pastreaza utilizatorul si parola contului SMTP, apoi testeaza conexiunea.',
    })
  }

  const applyGmailSmtpPreset = () => {
    setSmtpSettings((prev) => ({
      ...prev,
      host: 'smtp.gmail.com',
      port: '587',
      secure: false,
    }))
    setSmtpTestStatus({
      type: 'idle',
      message: 'Preset Gmail aplicat (port 587, STARTTLS). Parola = App Password de 16 caractere din Google Account → Security → 2-Step Verification → App passwords.',
    })
  }

  const applyOutlookSmtpPreset = () => {
    setSmtpSettings((prev) => ({
      ...prev,
      host: 'smtp.office365.com',
      port: '587',
      secure: false,
    }))
    setSmtpTestStatus({
      type: 'idle',
      message: 'Preset Outlook/Office 365 aplicat (port 587, STARTTLS). Parola = parola contului Microsoft sau App Password daca MFA e activ.',
    })
  }

  useEffect(() => {
    const storedDirectors = window.localStorage.getItem(DIRECTORS_STORAGE_KEY)
    if (storedDirectors) {
      try {
        const parsed = JSON.parse(storedDirectors) as Director[]
        if (Array.isArray(parsed)) {
          setDirectors(parsed)
        }
      } catch {
        setError('Nu am putut citi directorii salvati local')
      }
    }

    const storedGroups = window.localStorage.getItem(GROUPS_STORAGE_KEY)
    if (storedGroups) {
      try {
        const parsed = JSON.parse(storedGroups) as Group[]
        if (Array.isArray(parsed)) {
          setGroups(parsed)
        }
      } catch {
        setError('Nu am putut citi grupurile salvate local')
      }
    }

  }, [])

  // Directors: server persistence
  useEffect(() => {
    let active = true
    fetch('/api/directors')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
      .then((payload) => {
        if (active && payload?.success && Array.isArray(payload.data)) {
          setDirectors(payload.data as Director[])
          setDirectorsLoadedFromServer(true)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!directorsLoadedFromServer) return
    fetch('/api/directors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(directors),
    }).catch(() => {})
  }, [directors, directorsLoadedFromServer])

  // Groups: server persistence
  useEffect(() => {
    fetch('/api/groups')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad'))))
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) {
          setGroups(payload.data as Group[])
          setGroupsLoadedFromServer(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!groupsLoadedFromServer) return
    fetch('/api/groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groups),
    }).catch(() => {})
  }, [groups, groupsLoadedFromServer])

  // Restore an existing session on refresh and keep the logged-in user in sync with
  // the latest directors.
  useEffect(() => {
    const savedId = sessionStorage.getItem(ADMIN_SESSION_KEY)
    if (!savedId) return
    const director = directors.find((item) => String(item.id) === savedId)
    if (!director) return
    setCurrentUser(director)
    setIsAuthenticated(true)
  }, [directors])

  // Gold performers: server persistence
  useEffect(() => {
    fetch('/api/performers')
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) setPerformers(json.data)
      })
      .catch(() => {})
      .finally(() => setPerformersLoadedFromServer(true))
  }, [])

  useEffect(() => {
    if (!performersLoadedFromServer) return
    fetch('/api/performers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(performers),
    }).catch(() => {})
  }, [performers, performersLoadedFromServer])

  // SMTP settings: server persistence
  useEffect(() => {
    let active = true
    fetch('/api/smtp')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
      .then((payload) => {
        if (active && payload?.success && payload.data) {
          setSmtpSettings({ ...initialSmtpSettings, ...payload.data })
          setSmtpLoadedFromServer(true)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!smtpLoadedFromServer) return
    fetch('/api/smtp', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpSettings),
    }).catch(() => {})
  }, [smtpSettings, smtpLoadedFromServer])

  // Priority domains: server persistence
  useEffect(() => {
    fetch('/api/priority-domains')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad'))))
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) {
          setPriorityDomains(payload.data as PriorityDomain[])
          setDomainsLoadedFromServer(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!domainsLoadedFromServer) return
    fetch('/api/priority-domains', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(priorityDomains),
    }).catch(() => {})
  }, [priorityDomains, domainsLoadedFromServer])

  // Recommendations: server persistence
  useEffect(() => {
    fetch('/api/recommendations')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad'))))
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) {
          setRecommendations(payload.data as Recommendation[])
          setRecommendationsLoadedFromServer(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!recommendationsLoadedFromServer) return
    fetch('/api/recommendations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recommendations),
    }).catch(() => {})
  }, [recommendations, recommendationsLoadedFromServer])

  // Regulation content: server persistence
  useEffect(() => {
    fetch('/api/regulation')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad'))))
      .then((payload) => {
        if (payload?.success && payload.data && typeof payload.data === 'object') {
          setRegulationContent(payload.data as RegulationContent)
          setRegulationLoadedFromServer(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!regulationLoadedFromServer) return
    fetch('/api/regulation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regulationContent),
    }).catch(() => {})
  }, [regulationContent, regulationLoadedFromServer])

  // Email templates: server persistence
  useEffect(() => {
    fetch('/api/email-templates')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad'))))
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) {
          // Merge in any template types added after this data was last saved
          const merged = [...payload.data as EmailTemplate[]]
          for (const template of initialEmailTemplates) {
            if (!merged.some((item) => item.type === template.type)) merged.push(template)
          }
          setEmailTemplates(merged)
          setEmailTemplatesLoadedFromServer(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!emailTemplatesLoadedFromServer) return
    fetch('/api/email-templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailTemplates),
    }).catch(() => {})
  }, [emailTemplates, emailTemplatesLoadedFromServer])

  // Email log: server persistence
  useEffect(() => {
    fetch('/api/email-log')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad'))))
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) {
          setEmailLog(payload.data as EmailLog[])
          setEmailLogLoadedFromServer(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!emailLogLoadedFromServer) return
    fetch('/api/email-log', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailLog),
    }).catch(() => {})
  }, [emailLog, emailLogLoadedFromServer])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedLoginName = loginName.trim().toLowerCase()
    const director = directors.find((item) => item.name.toLowerCase() === normalizedLoginName)

    if (!director) {
      setError('Nu exista un utilizator configurat cu acest nume')
      return
    }

    if (password !== director.temporaryPassword) {
      setError('Parola incorecta')
      return
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, String(director.id))
    setCurrentUser(director)
    setIsAuthenticated(true)
    setError('')
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      setError('Parola noua trebuie sa aiba minimum 6 caractere')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Parolele nu coincid')
      return
    }

    if (!currentUser) return

    const updatedUser = { ...currentUser, temporaryPassword: newPassword, mustChangePassword: false }
    setDirectors((prev) => prev.map((director) => director.id === currentUser.id ? updatedUser : director))
    setCurrentUser(updatedUser)
    setNewPassword('')
    setConfirmPassword('')
    setError('')
  }

  const updateRecommendationStatus = async (id: number, status: RecommendationStatus) => {
    const recommendation = recommendations.find((item) => item.id === id)

    setRecommendations((prev) => prev.map((item) => item.id === id ? { ...item, status } : item))

    if (!recommendation) {
      return
    }

    await createEmailFromTemplate(status === 'member_bni' ? 'new_member_thanks' : 'status_update', recommendation, status)

    setPriorityDomains((prev) => prev.map((domain) => {
      const sameDomain = domain.group === recommendation.group && domain.name === recommendation.domain

      if (!sameDomain) {
        return domain
      }

      if (isDomainRecommended(status)) {
        return {
          ...domain,
          status: 'filled' as DomainStatus,
          filledBy: recommendation.from,
          filledFromRecommendationId: recommendation.id,
        }
      }

      if (domain.filledFromRecommendationId === recommendation.id) {
        return {
          ...domain,
          status: 'open' as DomainStatus,
          filledBy: undefined,
          filledFromRecommendationId: undefined,
          inSlots: true,
        }
      }

      return domain
    }))
  }

  const addDomain = () => {
    if (!newDomain.name || !newDomain.group) return

    if (!visibleGroupNames.has(newDomain.group)) {
      setError('Nu ai acces la acest grup')
      return
    }

    setPriorityDomains((prev) => {
      const nextId = prev.reduce((max, domain) => Math.max(max, domain.id), 0) + 1
      return [...prev, { ...newDomain, id: nextId, status: 'open' as DomainStatus }]
    })
    setNewDomain({ name: '', description: '', group: '' })
    setShowAddDomain(false)
    setError('')
  }

  const removeDomain = (id: number) => {
    setPriorityDomains((prev) => prev.filter((domain) => domain.id !== id))
  }

  const replaceFilledDomain = (id: number) => {
    const domain = priorityDomains.find((item) => item.id === id)
    if (domain && !window.confirm(`Scoti "${domain.name}" de pe board? Ramane numarat ca membru validat in checklist si poate fi readus oricand.`)) {
      return
    }
    setPriorityDomains((prev) => prev.map((item) => item.id === id ? { ...item, inSlots: false } : item))
  }

  const restoreReplacedDomain = (id: number) => {
    setPriorityDomains((prev) => prev.map((item) => item.id === id ? { ...item, inSlots: true } : item))
  }

  const addDirector = () => {
    if (!newDirector.name || !newDirector.email) return
    if (!newDirector.temporaryPassword) return
    if (newDirector.role !== 'admin' && newDirector.regions.length === 0 && newDirector.groups.length === 0) {
      setError('Aloca cel putin o regiune (executiv) sau un grup (lansare)')
      return
    }
    setDirectors((prev) => [...prev, { ...newDirector, id: prev.reduce((max, director) => Math.max(max, director.id), 0) + 1, mustChangePassword: true }])
    setNewDirector({ name: '', email: '', role: 'launch_consultant', temporaryPassword: '', regions: [], groups: [] })
    setShowAddDirector(false)
    setError('')
  }

  // Make the named director the sole launch consultant of a group: add the group to
  // their `groups`, remove it from everyone else, and normalize the legacy `group` field.
  const linkResponsibleToGroup = (groupName: string, responsibleName: string) => {
    const target = responsibleName.trim().toLowerCase()
    setDirectors((prev) => prev.map((director) => {
      const isTarget = Boolean(target) && director.name.trim().toLowerCase() === target
      const groups = getDirectorGroups(director).filter((name) => name !== groupName)
      if (isTarget) groups.push(groupName)
      return { ...director, group: undefined, groups }
    }))
  }

  const renameGroupInDirectors = (oldName: string, newName: string) => {
    if (oldName === newName) return
    setDirectors((prev) => prev.map((director) => {
      const groups = getDirectorGroups(director).map((name) => name === oldName ? newName : name)
      return { ...director, group: undefined, groups }
    }))
  }

  const addGroup = () => {
    if (!newGroup.name || !newGroup.region) return
    if (!newGroup.launchTargetMembers || newGroup.launchTargetMembers < 25) {
      setError('Tinta de lansare nu poate fi mai mica de 25 de membri')
      return
    }
    if (currentUser?.role === 'executive_director' && !getDirectorRegions(currentUser).includes(newGroup.region)) {
      setError('Poti adauga grupuri doar in regiunile tale')
      return
    }
    const { launched, ...base } = newGroup
    setGroups((prev) => [...prev, {
      ...base,
      status: launched ? 'activ' : 'in formare',
      launchedOn: launched ? new Date().toISOString().slice(0, 10) : undefined,
    }])
    if (newGroup.director) linkResponsibleToGroup(newGroup.name, newGroup.director)
    setNewGroup({ name: '', region: '', director: '', currentMembers: 0, launchTargetMembers: 25, active: true, launched: false })
    setShowAddGroup(false)
  }

  const startEditGroup = (group: Group) => {
    setEditingGroupName(group.name)
    setEditingGroup({ ...group, active: group.active !== false })
    setError('')
  }

  // Only the executive director of the group's region (or an admin) may delete a group.
  const canDeleteGroup = (group: Group) =>
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'executive_director' && getDirectorRegions(currentUser).includes(group.region))

  const deleteGroup = (name: string) => {
    const group = groups.find((g) => g.name === name)
    if (!group || !canDeleteGroup(group)) return
    if (!window.confirm(`Stergi definitiv grupul "${name}"? Actiunea nu poate fi anulata.`)) return
    setGroups((prev) => prev.filter((g) => g.name !== name))
  }

  // <option> list grouped by region (alpha) with groups alpha inside each region.
  const groupedGroupOptions = (list: Group[]) =>
    Array.from(new Set(list.map((g) => g.region)))
      .sort((a, b) => a.localeCompare(b, 'ro'))
      .map((region) => (
        <optgroup key={region} label={region}>
          {list
            .filter((g) => g.region === region)
            .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
            .map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
        </optgroup>
      ))

  const cancelEditGroup = () => {
    setEditingGroupName('')
    setEditingGroup(null)
    setError('')
  }

  const saveEditedGroup = () => {
    if (!editingGroup || !editingGroupName) return
    if (!editingGroup.name || !editingGroup.region) return
    if (!editingGroup.launchTargetMembers || editingGroup.launchTargetMembers < 25) {
      setError('Tinta de lansare nu poate fi mai mica de 25 de membri')
      return
    }
    if (currentUser?.role === 'executive_director' && !getDirectorRegions(currentUser).includes(editingGroup.region)) {
      setError('Poti muta grupuri doar in regiunile tale')
      return
    }

    setGroups((prev) => prev.map((group) => group.name === editingGroupName ? editingGroup : group))
    setPriorityDomains((prev) => prev.map((domain) => domain.group === editingGroupName ? { ...domain, group: editingGroup.name } : domain))
    setRecommendations((prev) => prev.map((recommendation) => recommendation.group === editingGroupName ? { ...recommendation, group: editingGroup.name } : recommendation))
    renameGroupInDirectors(editingGroupName, editingGroup.name)
    linkResponsibleToGroup(editingGroup.name, editingGroup.director)
    cancelEditGroup()
  }

  const toggleGroupActive = (groupName: string) => {
    setGroups((prev) => prev.map((group) => group.name === groupName ? { ...group, active: group.active === false } : group))
  }

  function deleteDirector(id: number) {
    if (currentUser?.role !== 'admin') return
    if (id === currentUser.id) { setError('Nu te poti sterge pe tine insuti'); return }
    const d = directors.find((item) => item.id === id)
    if (!d) return
    if (!window.confirm(`Stergi definitiv directorul "${d.name}"?`)) return
    setDirectors((prev) => prev.filter((item) => item.id !== id))
  }

  const startEditDirector = (director: Director) => {
    setEditingDirectorId(director.id)
    setEditingDirector({ ...director, regions: getDirectorRegions(director), groups: getDirectorGroups(director), group: undefined, mustChangePassword: director.mustChangePassword !== false })
    setManageExtraGroups(getDirectorGroups(director).length > 0)
    setTemporaryPasswordInput('')
    setError('')
    setTimeout(() => {
      document.querySelector(`[data-edit-director="${director.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  const cancelEditDirector = () => {
    setEditingDirectorId(null)
    setEditingDirector(null)
    setManageExtraGroups(false)
    setTemporaryPasswordInput('')
    setError('')
  }

  const saveEditedDirector = () => {
    if (!editingDirector) return
    if (!editingDirector.name || !editingDirector.email) return
    if (editingDirector.role !== 'admin' && getDirectorRegions(editingDirector).length === 0 && getDirectorGroups(editingDirector).length === 0) {
      setError('Aloca cel putin o regiune (executiv) sau un grup (lansare)')
      return
    }

    setDirectors((prev) => prev.map((director) => director.id === editingDirector.id ? editingDirector : director))
    cancelEditDirector()
  }

  const setTemporaryPasswordForDirector = () => {
    if (!editingDirector || !temporaryPasswordInput) return

    setEditingDirector({
      ...editingDirector,
      temporaryPassword: temporaryPasswordInput,
      mustChangePassword: true,
    })
    setTemporaryPasswordInput('')
  }

  const toggleRecommendationDetails = (id: number) => {
    setOpenRecommendationIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f6f3] px-4">
        <div className="w-full max-w-lg rounded-lg border border-[#ded8ce] bg-white p-8 shadow-lg">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c8102e]">BNI Gold Members</p>
            <h1 className="mt-2 text-3xl font-black text-[#1f2326]">Admin competitie</h1>
            <p className="mt-2 text-sm text-[#5f6469]">Autentificarea se face cu numele configurat si parola temporara primita.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Prenume Nume</label>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full rounded-md border border-[#c9c3b8] px-4 py-2 text-sm focus:border-[#c8102e] focus:outline-none focus:ring-2 focus:ring-[#fff1f2]"
                placeholder="Prenume Nume"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Parola</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-[#c9c3b8] px-4 py-2 text-sm focus:border-[#c8102e] focus:outline-none focus:ring-2 focus:ring-[#fff1f2]"
                placeholder="Introdu parola"
              />
            </div>

            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            <button type="submit" className="w-full rounded-md bg-[#c8102e] px-4 py-2 text-sm font-black text-white transition hover:bg-[#9f1239]">
              Autentificare
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  if (currentUser.mustChangePassword !== false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f6f3] px-4">
        <div className="w-full max-w-lg rounded-lg border border-[#ded8ce] bg-white p-8 shadow-lg">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c8102e]">BNI Gold Members</p>
            <h1 className="mt-2 text-3xl font-black text-[#1f2326]">Schimba parola temporara</h1>
            <p className="mt-2 text-sm text-[#5f6469]">La prima autentificare trebuie sa setezi o parola noua pentru contul tau.</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Parola noua</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-[#c9c3b8] px-4 py-2 text-sm focus:border-[#c8102e] focus:outline-none focus:ring-2 focus:ring-[#fff1f2]"
                placeholder="Minimum 6 caractere"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Confirma parola</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-[#c9c3b8] px-4 py-2 text-sm focus:border-[#c8102e] focus:outline-none focus:ring-2 focus:ring-[#fff1f2]"
                placeholder="Repeta parola noua"
              />
            </div>

            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            <button type="submit" className="w-full rounded-md bg-[#c8102e] px-4 py-2 text-sm font-black text-white transition hover:bg-[#9f1239]">
              Salveaza parola
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#1f2326]">
      <div className="border-b border-[#c8102e] bg-[#1f2326] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-[#ff4057]">BNI</span>
              <h1 className="font-black">Admin competitie</h1>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {currentUser.name}, {roleLabel(currentUser.role)}, {currentUser.role === 'admin' ? 'toate regiunile' : accessLabel(currentUser)}
            </p>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(ADMIN_SESSION_KEY); setIsAuthenticated(false); setCurrentUser(null); setLoginName(''); setPassword('') }}
            className="w-fit rounded-md bg-[#343a40] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#4b4f54]"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="border-b border-[#ded8ce] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-3 sm:px-6 lg:px-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setError('') }}
              className={`rounded-md px-3 py-2 text-left text-sm font-black transition ${
                activeTab === tab.key
                  ? 'bg-[#c8102e] text-white'
                  : 'bg-[#f7f6f3] text-[#5f6469] hover:bg-white hover:text-[#1f2326]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              {[
                { label: 'Grupuri', value: stats.groups },
                { label: 'Recomandari', value: stats.recommendations },
                { label: 'In asteptare', value: stats.pending },
                { label: 'Membri BNI', value: stats.completed },
                { label: 'Domenii libere', value: stats.openDomains },
                { label: 'Domenii recomandate', value: stats.filledDomains },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-3xl font-black text-slate-950">{item.value}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>

            {newNotifications.length > 0 && (
              <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-black text-[#1f2326]">Notificari recomandari noi</h2>
                    <p className="text-sm font-semibold text-amber-800">
                      Ai {newNotifications.length} recomandari care asteapta validare.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="w-fit rounded-md bg-[#c8102e] px-4 py-2 text-sm font-black text-white"
                  >
                    Valideaza
                  </button>
                </div>
              </section>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black">Ierarhie grupuri</h2>
                <div className="mt-4 space-y-3">
                  {rankedGroups.map((group, index) => (
                    <div key={group.name} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-950 text-xs font-black text-white">#{index + 1}</span>
                        <div>
                          <p className="font-black">{group.name}</p>
                          <p className="text-xs text-slate-500">{group.region}</p>
                          <div className="mt-2 w-32">
                            <div className="mb-1 flex justify-between text-[10px] font-black uppercase text-slate-500">
                              <span>{isGroupLaunched(group) ? 'Crestere' : 'Lansare'}</span>
                              <span>{group.recommendedMembers}/{group.launchTargetMembers}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#e5dfd5]" role="progressbar" aria-label={`Progres lansare ${group.name}`} aria-valuemin={0} aria-valuemax={group.launchTargetMembers} aria-valuenow={group.recommendedMembers}>
                              <div className="h-full rounded-full bg-[#c8102e]" style={{ width: `${group.launchPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {group.slotDomains.map((domain) => (
                            <div key={domain.id} title={`${domain.name} - ${domain.status === 'filled' ? domain.filledBy : 'Cautat'}`} className={`min-h-[58px] rounded-md border p-2 ${domain.status === 'filled' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                              <p className="line-clamp-2 text-[12px] font-black leading-4">{domain.name}</p>
                              <p className={`mt-1 line-clamp-2 text-[10px] font-bold leading-3 ${domain.status === 'filled' ? 'text-emerald-700' : 'text-red-600'}`}>
                                {domain.status === 'filled' ? domain.filledBy : 'Cautat'}
                              </p>
                            </div>
                          ))}
                        </div>
                        <LaunchSeats seats={group.seats} showLegend />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black">Top membri</h2>
                <div className="mt-4 space-y-3">
                  {memberLeaderboard.length === 0 && <p className="text-sm text-slate-500">Nu exista recomandari in aria ta.</p>}
                  {memberLeaderboard.map((member, index) => (
                    <div key={member.name} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-red-50 text-xs font-black text-red-700">{index + 1}</span>
                        <div>
                          <p className="text-sm font-black">{member.name}</p>
                          <p className="text-[11px] font-black uppercase tracking-wide text-[#c8102e]">{member.group}</p>
                          <p className="text-xs text-slate-500">{member.sent} trimise, {member.completed} membri BNI</p>
                        </div>
                      </div>
                      <p className="text-sm font-black">{member.points}p</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <section>
            <h2 className="mb-4 text-2xl font-black">Recomandari primite</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px]">
                  <thead className="bg-slate-50">
                    <tr>
                      {['De la', 'Catre', 'Domeniu', 'Grup', 'Data', 'Status', 'Actiuni'].map((head) => (
                        <th key={head} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecommendations.map((recommendation) => (
                      <Fragment key={recommendation.id}>
                        <tr className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleRecommendationDetails(recommendation.id)}
                              className="mr-2 rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-200"
                            >
                              {openRecommendationIds.includes(recommendation.id) ? '-' : '+'}
                            </button>
                            <span className="font-semibold">{recommendation.from}</span>
                          </td>
                          <td className="px-4 py-3">{recommendation.to}</td>
                          <td className="px-4 py-3 text-sm">{recommendation.domain}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{recommendation.group}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{recommendation.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={`rounded border px-2 py-1 text-xs font-black ${statusColors[recommendation.status]}`}>{statusLabels[recommendation.status]}</span>
                              {(() => {
                                const logs = emailLog.filter((e) => e.recommendationId === recommendation.id)
                                const last = logs[logs.length - 1]
                                if (!last) return null
                                if (last.status === 'trimis') return (
                                  <span title={`Email trimis: ${last.subject}`} className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    Notificat
                                  </span>
                                )
                                if (last.status === 'eroare') return (
                                  <span title={`Eroare email: ${last.error || ''}`} className="flex items-center gap-1 text-[10px] font-black text-red-500">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    Email eroare
                                  </span>
                                )
                                return (
                                  <span className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    In asteptare
                                  </span>
                                )
                              })()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={recommendation.status}
                              onChange={(e) => {
                                void updateRecommendationStatus(recommendation.id, e.target.value as RecommendationStatus)
                              }}
                              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-red-500 focus:outline-none"
                            >
                              <option value="new">Recomandare noua</option>
                              <option value="recommendation_confirmed">Recomandare confirmata</option>
                              <option value="invited_bni">Invitat BNI</option>
                              <option value="member_bni">Membru BNI</option>
                              <option value="rejected">Respinsa</option>
                            </select>
                          </td>
                        </tr>
                        {openRecommendationIds.includes(recommendation.id) && (
                        <tr className="border-t border-slate-100 bg-slate-50/70">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Membru care recomanda</p>
                                <p className="mt-1 font-black text-slate-950">{recommendation.from}</p>
                                <p className="mt-1 text-xs font-semibold text-[#c8102e]">{recommendation.recommendingGroup || 'Grup BNI necompletat'}</p>
                                <p className="mt-2 text-xs text-slate-500">Telefon: <span className="font-semibold text-slate-800">{recommendation.recommenderPhone || 'Necompletat'}</span></p>
                                <p className="text-xs text-slate-500">Email: <span className="font-semibold text-slate-800">{recommendation.recommenderEmail || 'Necompletat'}</span></p>
                              </div>
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Persoana recomandata</p>
                                <p className="mt-1 font-black text-slate-950">{recommendation.to}</p>
                                <p className="mt-2 text-xs text-slate-500">Telefon: <span className="font-semibold text-slate-800">{recommendation.recommendedPhone || 'Necompletat'}</span></p>
                              </div>
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Contact si acord</p>
                                <p className="mt-1 whitespace-pre-wrap leading-5 text-slate-700">{recommendation.contactNotes || 'Nu exista informatii suplimentare despre contact.'}</p>
                                <p className="mt-2 text-xs font-black text-slate-600">
                                  {recommendation.consentConfirmed ? 'Confirmat: poate fi sunata de BNI local' : 'Acord contact neconfirmat in formular'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Potrivire si detalii</p>
                                <p className="mt-1 whitespace-pre-wrap leading-5 text-slate-700">{recommendation.fitDetails || recommendation.details || 'Nu exista detalii suplimentare pentru aceasta recomandare.'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'domains' && (
          <section>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-black">Domenii de interes</h2>
                <p className="text-sm text-slate-500">Domeniile recomandate devin verzi si arata membrul care a trimis recomandarea.</p>
              </div>
            </div>

            {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            {showAddDomain && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddDomain(false); setError('') } }}>
                <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-950">Domeniu nou</h3>
                    <button onClick={() => { setShowAddDomain(false); setError('') }} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Domeniu</label>
                      <input value={newDomain.name} onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })} list="admin-domain-options" placeholder="Cauta sau selecteaza domeniul" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
                      <datalist id="admin-domain-options">
                        {predefinedDomains.map((domain) => <option key={domain} value={domain} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Specializare / nisare</label>
                      <input value={newDomain.description} onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })} placeholder="ex: Constructii rezidentiale, nu industriale" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Grup</label>
                      <select value={newDomain.group} onChange={(e) => setNewDomain({ ...newDomain, group: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none">
                        <option value="">Selecteaza grup</option>
                        {visibleGroups.map((group) => <option key={group.name} value={group.name}>{group.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={addDomain} className="flex-1 rounded-md bg-[#c8102e] px-4 py-2 text-sm font-black text-white hover:bg-[#9f1239]">Salveaza</button>
                    <button onClick={() => { setShowAddDomain(false); setError('') }} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">Anuleaza</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {domainsTabData.map(({ group, groupDomains, slotDomains, seats, replacedDomains }) => (
                  <div key={group.name}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black">{group.name}</h3>
                      <span className="text-sm font-semibold text-slate-500">({group.region})</span>
                      <span className="text-sm font-semibold text-slate-400">{groupDomains.length} domenii configurate</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {slotDomains.map((domain) => (
                        <div key={domain.id} className={`min-h-[154px] rounded-lg border-2 p-4 ${domain.status === 'filled' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                          <div className="mb-4 flex items-center justify-between">
                            <span className={`h-3 w-3 rounded-full ${domain.status === 'filled' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {domain.status === 'open' && (
                              <button onClick={() => removeDomain(domain.id)} className="rounded px-2 text-lg leading-none text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Sterge ${domain.name}`}>
                                x
                              </button>
                            )}
                          </div>
                          <h4 className="text-lg font-black text-slate-950">{domain.name}</h4>
                          <p className="mt-2 text-sm leading-5 text-slate-500">{domain.description}</p>
                          <p className={`mt-4 text-sm font-black ${domain.status === 'filled' ? 'text-emerald-700' : 'text-red-600'}`}>
                            {domain.status === 'filled' ? `Recomandat de: ${domain.filledBy}` : 'Cautat'}
                          </p>
                          {domain.status === 'filled' && (
                            <button
                              onClick={() => replaceFilledDomain(domain.id)}
                              className="mt-3 w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                            >
                              Inlocuieste domeniul
                            </button>
                          )}
                        </div>
                      ))}
                      {slotDomains.length < 6 && Array.from({ length: 6 - slotDomains.length }).map((_, index) => (
                        <button
                          key={`empty-${index}`}
                          onClick={() => {
                            setNewDomain({ name: '', description: '', group: group.name })
                            setShowAddDomain(true)
                          }}
                          className="flex min-h-[154px] w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-400 transition hover:border-[#c8102e] hover:bg-red-50 hover:text-[#c8102e]"
                        >
                          + Adauga domeniu
                        </button>
                      ))}
                    </div>
                    {replacedDomains.length > 0 && (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Domenii inlocuite (numarate ca membri validati)</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {replacedDomains.map((domain) => (
                            <div key={domain.id} className="flex items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-2">
                              <span className="text-sm font-black text-slate-950">{domain.name}</span>
                              <span className="text-xs font-semibold text-emerald-700">{domain.filledBy}</span>
                              <button
                                onClick={() => restoreReplacedDomain(domain.id)}
                                className="rounded border border-emerald-300 px-2 py-1 text-[11px] font-black text-emerald-700 hover:bg-emerald-100"
                              >
                                Readu pe board
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Progres lansare ({group.launchTargetMembers} locuri)</p>
                      <LaunchSeats seats={seats} showLegend />
                    </div>
                  </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'directors' && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black">Directori</h2>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  Rol:
                  <select
                    value={directorRoleFilter}
                    onChange={(e) => setDirectorRoleFilter(e.target.value as 'all' | DirectorRole)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="all">Toate ({visibleDirectors.length})</option>
                    <option value="admin">Administrator</option>
                    <option value="executive_director">Director Executiv</option>
                    <option value="launch_consultant">Director Consultant Lansare</option>
                    <option value="growth_consultant">Director Consultant Crestere</option>
                  </select>
                </label>
                <input
                  value={directorSearch}
                  onChange={(e) => setDirectorSearch(e.target.value)}
                  placeholder="Cauta director..."
                  className="w-44 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <span className="text-xs font-semibold text-slate-400">{displayedDirectors.length} afisati</span>
              </div>
              {currentUser.role === 'admin' && (
                <button onClick={() => setShowAddDirector(true)} className="rounded-md bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Adauga director</button>
              )}
            </div>

            {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            {showAddDirector && currentUser.role === 'admin' && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <input value={newDirector.name} onChange={(e) => setNewDirector({ ...newDirector, name: e.target.value })} placeholder="Nume complet" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <input value={newDirector.email} onChange={(e) => setNewDirector({ ...newDirector, email: e.target.value })} placeholder="Email" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <input value={newDirector.temporaryPassword} onChange={(e) => setNewDirector({ ...newDirector, temporaryPassword: e.target.value })} placeholder="Parola temporara" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <select value={newDirector.role} onChange={(e) => setNewDirector({ ...newDirector, role: e.target.value as DirectorRole })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option value="admin">Administrator</option>
                    <option value="executive_director">Director Executiv</option>
                    <option value="launch_consultant">Director Consultant Lansare</option>
                    <option value="growth_consultant">Director Consultant Crestere</option>
                  </select>
                  {newDirector.role === 'admin' ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">Acces complet</div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="mb-1 text-[11px] font-black uppercase text-slate-500">Regiuni (executiv)</p>
                        <select
                          multiple
                          value={newDirector.regions}
                          onChange={(e) => setNewDirector({ ...newDirector, regions: Array.from(e.target.selectedOptions, (option) => option.value) })}
                          className="min-h-[72px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        >
                          {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-black uppercase text-slate-500">Grupuri BNI</p>
                        <select
                          multiple
                          value={newDirector.groups}
                          onChange={(e) => setNewDirector({ ...newDirector, groups: Array.from(e.target.selectedOptions, (option) => option.value) })}
                          className="min-h-[72px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        >
                          {groupedGroupOptions(visibleGroups)}
                        </select>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500">Ctrl/Cmd + click pentru selectie multipla. Poti aloca si regiuni si grupuri (rol dublu).</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={addDirector} className="rounded-md bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Salveaza</button>
                    <button onClick={() => setShowAddDirector(false)} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">Anuleaza</button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {([['Nume', 'name'], ['Email', 'email'], ['Rol', 'role']] as const).map(([label, col]) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                        <button onClick={() => toggleDirectorSort(col)} className="flex items-center gap-1 uppercase hover:text-slate-900">
                          {label}
                          <span className="text-[10px]">{directorSort.column === col ? (directorSort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                        </button>
                      </th>
                    ))}
                    {['Parola temporara', 'Acces configurat', 'Actiuni'].map((head) => <th key={head} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{head}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {displayedDirectors
                    .map((director) => (
                      <Fragment key={director.id}>
                        <tr className="border-t border-slate-100">
                          <td className="px-4 py-3 font-semibold">{director.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{director.email}</td>
                          <td className="px-4 py-3 text-sm">{roleLabel(director.role)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                            {director.mustChangePassword !== false ? director.temporaryPassword : 'Parola setata'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{accessLabel(director)}</td>
                          <td className="px-4 py-3">
                            {currentUser.role === 'admin' ? (
                              <div className="flex gap-1">
                                <button onClick={() => startEditDirector(director)} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700">Editeaza</button>
                                {director.id !== currentUser.id && (
                                  <button onClick={() => deleteDirector(director.id)} className="rounded-md border border-red-300 px-2 py-2 text-xs font-black text-[#c8102e] hover:bg-red-50">×</button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-500">Doar vizualizare</span>
                            )}
                          </td>
                        </tr>
                        {editingDirectorId === director.id && editingDirector && (
                          <tr className="border-t border-slate-100 bg-slate-50" data-edit-director={director.id}>
                            <td colSpan={6} className="px-4 py-4">
                              <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <label className="text-[11px] font-black uppercase text-slate-500">
                                    Nume
                                    <input value={editingDirector.name} onChange={(e) => setEditingDirector({ ...editingDirector, name: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950" />
                                  </label>
                                  <label className="text-[11px] font-black uppercase text-slate-500">
                                    Email
                                    <input value={editingDirector.email} onChange={(e) => setEditingDirector({ ...editingDirector, email: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950" />
                                  </label>
                                  <label className="text-[11px] font-black uppercase text-slate-500">
                                    Rol
                                    <select value={editingDirector.role} onChange={(e) => setEditingDirector({ ...editingDirector, role: e.target.value as DirectorRole })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950">
                                      <option value="admin">Administrator</option>
                                      <option value="executive_director">Director Executiv</option>
                                      <option value="launch_consultant">Director Consultant Lansare</option>
                                      <option value="growth_consultant">Director Consultant Crestere</option>
                                    </select>
                                  </label>
                                </div>

                                <div className="grid items-start gap-3 lg:grid-cols-[2fr_1fr]">
                                  {editingDirector.role === 'admin' ? (
                                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500">Acces complet la toate regiunile si grupurile</div>
                                  ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div>
                                        <p className="mb-1 text-[11px] font-black uppercase text-slate-500">Regiuni (executiv)</p>
                                        <select
                                          multiple
                                          value={getDirectorRegions(editingDirector)}
                                          onChange={(e) => setEditingDirector({ ...editingDirector, regions: Array.from(e.target.selectedOptions, (option) => option.value), region: undefined })}
                                          className="min-h-[200px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                        >
                                          {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                          <p className="text-[11px] font-black uppercase text-slate-500">Grupuri BNI</p>
                                          {manageExtraGroups && (
                                            <button
                                              type="button"
                                              onClick={() => { setManageExtraGroups(false); setEditingDirector({ ...editingDirector, groups: [], group: undefined }) }}
                                              className="text-[11px] font-black text-slate-400 hover:text-red-600"
                                            >
                                              Renunta
                                            </button>
                                          )}
                                        </div>
                                        {manageExtraGroups ? (
                                          <select
                                            multiple
                                            value={getDirectorGroups(editingDirector)}
                                            onChange={(e) => setEditingDirector({ ...editingDirector, groups: Array.from(e.target.selectedOptions, (option) => option.value), group: undefined })}
                                            className="min-h-[200px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                          >
                                            {groupedGroupOptions(groups)}
                                          </select>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setManageExtraGroups(true)}
                                            className="h-[200px] w-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500 hover:border-[#c8102e] hover:text-[#c8102e]"
                                          >
                                            + Grupuri din alte regiuni (rol dublu)
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <p className="text-[11px] font-black uppercase text-slate-500">Parola temporara</p>
                                    <input value={temporaryPasswordInput} onChange={(e) => setTemporaryPasswordInput(e.target.value)} placeholder="Parola temporara noua" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                    <button onClick={setTemporaryPasswordForDirector} className="w-full rounded-md bg-[#c8102e] px-3 py-2 text-xs font-black text-white hover:bg-[#9f1239]">Seteaza temporara</button>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button onClick={saveEditedDirector} className="rounded-md bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Salveaza informatii</button>
                                <button onClick={cancelEditDirector} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">Anuleaza</button>
                                {editingDirector.mustChangePassword !== false && (
                                  <span className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Va schimba parola la urmatorul login</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'performers' && currentUser.role !== 'launch_consultant' && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Membri Gold</h2>
              <div className="flex flex-wrap items-center gap-2">
                <input value={performerSearch} onChange={(e) => setPerformerSearch(e.target.value)} placeholder="Cauta dupa nume..." className="w-44 rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <select value={performerRegionFilter} onChange={(e) => setPerformerRegionFilter(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Toate regiunile</option>
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={performerGroupFilter} onChange={(e) => setPerformerGroupFilter(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Toate grupurile</option>
                  {groupedGroupOptions(groups)}
                </select>
                <span className="text-xs font-semibold text-slate-400">
                  {editablePerformers.filter((p) =>
                    (!performerSearch || p.name.toLowerCase().includes(performerSearch.toLowerCase())) &&
                    (!performerRegionFilter || p.region === performerRegionFilter) &&
                    (!performerGroupFilter || p.group === performerGroupFilter)
                  ).length} afisati
                </span>
                <button onClick={addPerformer} className="rounded-md bg-[#c8102e] px-4 py-2 text-sm font-black text-white hover:bg-[#9f1239]">+ Adauga membru</button>
              </div>
            </div>
            <div className="space-y-1">
              {editablePerformers
                .filter((p) =>
                  (!performerSearch || p.name.toLowerCase().includes(performerSearch.toLowerCase())) &&
                  (!performerRegionFilter || p.region === performerRegionFilter) &&
                  (!performerGroupFilter || p.group === performerGroupFilter)
                )
                .map((p) => (
                <div key={p.id} className="rounded-md border border-[#ded8ce] bg-white">
                  {editingPerformerId === p.id ? (
                    <div className="space-y-2 p-3">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="text-[10px] font-black uppercase text-slate-500">Nume<input value={p.name} onChange={(e) => updatePerformer(p.id, { name: e.target.value })} className="mt-1 w-full rounded border border-[#ded8ce] px-2 py-1 text-sm font-normal text-slate-950" /></label>
                        <label className="text-[10px] font-black uppercase text-slate-500">Companie<input value={p.company || ''} onChange={(e) => updatePerformer(p.id, { company: e.target.value })} className="mt-1 w-full rounded border border-[#ded8ce] px-2 py-1 text-sm font-normal text-slate-950" /></label>
                        <label className="text-[10px] font-black uppercase text-slate-500">Grup BNI<select value={p.group} onChange={(e) => updatePerformer(p.id, { group: e.target.value })} className="mt-1 w-full rounded border border-[#ded8ce] px-2 py-1 text-sm font-normal text-slate-950"><option value="">Alege grup</option>{groupedGroupOptions(groups)}</select></label>
                        <label className="text-[10px] font-black uppercase text-slate-500">Regiune<select value={p.region} onChange={(e) => updatePerformer(p.id, { region: e.target.value })} className="mt-1 w-full rounded border border-[#ded8ce] px-2 py-1 text-sm font-normal text-slate-950"><option value="">Alege regiune</option>{regions.map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
                        <label className="text-[10px] font-black uppercase text-slate-500">Domeniu activitate<select value={p.business} onChange={(e) => updatePerformer(p.id, { business: e.target.value })} className="mt-1 w-full rounded border border-[#ded8ce] px-2 py-1 text-sm font-normal text-slate-950"><option value="">Alege domeniu</option>{predefinedDomains.map((d: string) => <option key={d} value={d}>{d}</option>)}</select></label>
                        <label className="text-[10px] font-black uppercase text-slate-500">Membri adusi<input type="number" min={0} value={p.sponsoredMembers === 0 ? '' : p.sponsoredMembers} onChange={(e) => updatePerformer(p.id, { sponsoredMembers: Number(e.target.value) || 0 })} placeholder="0" className="mt-1 w-full rounded border border-[#ded8ce] px-2 py-1 text-sm font-normal text-slate-950" /></label>
                        <label className="col-span-full text-[10px] font-black uppercase text-slate-500 lg:col-span-2">Link profil BNI<input value={p.bniProfileUrl || ''} onChange={(e) => updatePerformer(p.id, { bniProfileUrl: e.target.value })} placeholder="https://bni-romania.com/ro-RO/memberdetails?..." className="mt-1 w-full rounded border border-[#ded8ce] px-2 py-1 text-sm font-normal text-slate-950" /></label>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {p.photoUrl && <img src={p.photoUrl} alt={p.name} className="h-8 w-8 rounded-full object-cover" />}
                        <button onClick={() => scrapePerformerProfile(p.id)} disabled={scrapingId === p.id} className="rounded border border-[#c8102e] px-3 py-1 text-xs font-black text-[#c8102e] hover:bg-[#fff1f2] disabled:opacity-50">{scrapingId === p.id ? 'Se preia...' : 'Preia date'}</button>
                        <button onClick={() => setEditingPerformerId(null)} className="rounded border border-slate-300 px-3 py-1 text-xs font-black text-slate-500 hover:bg-slate-50">Inchide</button>
                        <button onClick={() => deletePerformer(p.id)} className="rounded border border-red-300 px-3 py-1 text-xs font-black text-[#c8102e] hover:bg-red-50">Sterge</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c8102e] text-[10px] font-black text-white">{p.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-sm font-black text-[#1f2326]">{p.name}</span>
                          {p.company && <span className="truncate text-xs text-slate-400">{p.company}</span>}
                        </div>
                        <p className="truncate text-[11px] text-slate-500">{p.group || '—'} · {p.region || '—'} · {p.business || '—'} · {p.sponsoredMembers}/{goldThreshold}</p>
                      </div>
                      <button onClick={() => setEditingPerformerId(p.id)} className="shrink-0 rounded border border-slate-300 px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-50">Editeaza</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'regulation' && currentUser.role === 'admin' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-black">Regulament</h2>
              <p className="mt-1 text-sm text-slate-500">Aceste campuri controleaza pagina publica de regulament.</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-xs font-black uppercase text-slate-500">
                  Eticheta
                  <input value={regulationContent.eyebrow} onChange={(e) => setRegulationContent({ ...regulationContent, eyebrow: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Titlu
                  <input value={regulationContent.title} onChange={(e) => setRegulationContent({ ...regulationContent, title: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500 lg:col-span-2">
                  Subtitlu
                  <textarea value={regulationContent.subtitle} onChange={(e) => setRegulationContent({ ...regulationContent, subtitle: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Titlu perioada campaniei
                  <input value={regulationContent.periodTitle} onChange={(e) => setRegulationContent({ ...regulationContent, periodTitle: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Durata campaniei
                  <textarea value={regulationContent.periodBody} onChange={(e) => setRegulationContent({ ...regulationContent, periodBody: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Titlu obiectiv
                  <input value={regulationContent.objectiveTitle} onChange={(e) => setRegulationContent({ ...regulationContent, objectiveTitle: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Titlu punctaj
                  <input value={regulationContent.scoringTitle} onChange={(e) => setRegulationContent({ ...regulationContent, scoringTitle: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500 lg:col-span-2">
                  Text obiectiv
                  <textarea value={regulationContent.objectiveBody} onChange={(e) => setRegulationContent({ ...regulationContent, objectiveBody: e.target.value })} rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500 lg:col-span-2">
                  Punctaj, cate o linie pentru fiecare status
                  <textarea value={regulationContent.scoringRows.join('\n')} onChange={(e) => setRegulationContent({ ...regulationContent, scoringRows: e.target.value.split('\n').filter(Boolean) })} rows={5} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Titlu premii
                  <input value={regulationContent.prizesTitle} onChange={(e) => setRegulationContent({ ...regulationContent, prizesTitle: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Titlu validare
                  <input value={regulationContent.transparencyTitle} onChange={(e) => setRegulationContent({ ...regulationContent, transparencyTitle: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500 lg:col-span-2">
                  Text premii
                  <textarea value={regulationContent.prizesBody} onChange={(e) => setRegulationContent({ ...regulationContent, prizesBody: e.target.value })} rows={5} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500 lg:col-span-2">
                  Text validare
                  <textarea value={regulationContent.transparencyBody} onChange={(e) => setRegulationContent({ ...regulationContent, transparencyBody: e.target.value })} rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950" />
                </label>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'email_templates' && (currentUser.role === 'admin' || currentUser.role === 'executive_director') && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-black">Template email</h2>
              <p className="mt-1 text-sm text-slate-500">
                Aceste texte sunt folosite cand se genereaza emailuri pentru recomandari si schimbari de status.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {emailTemplates.map((template) => (
                <div key={template.type} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="font-black text-slate-950">{template.title}</h3>
                  <label className="mt-4 block text-xs font-black uppercase text-slate-500">
                    Subiect
                    <input
                      value={template.subject}
                      onChange={(e) => setEmailTemplates((prev) => prev.map((item) => item.type === template.type ? { ...item, subject: e.target.value } : item))}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                    />
                  </label>
                  <label className="mt-3 block text-xs font-black uppercase text-slate-500">
                    Continut
                    <textarea
                      value={template.body}
                      onChange={(e) => setEmailTemplates((prev) => prev.map((item) => item.type === template.type ? { ...item, body: e.target.value } : item))}
                      rows={9}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                    />
                  </label>
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Token-uri: {'{{recommenderName}}'}, {'{{recommendedName}}'}, {'{{domain}}'}, {'{{group}}'}, {'{{status}}'}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">Emailuri generate</h3>
                  <p className="text-sm text-slate-500">Lista mesajelor pregatite de sistem pentru trimitere.</p>
                </div>
                <button onClick={() => setEmailLog([])} className="rounded-md bg-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-300">
                  Goleste lista
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {emailLog.length === 0 && <p className="text-sm text-slate-500">Nu exista emailuri generate inca.</p>}
                {emailLog.slice().reverse().map((email) => (
                  <div key={email.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-slate-500">{email.type}</p>
                        <p className="mt-1 font-black text-slate-950">{email.subject}</p>
                        <p className="text-sm text-slate-500">Catre: {email.to}</p>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs font-black ${
                        email.status === 'trimis'
                          ? 'bg-emerald-50 text-emerald-700'
                          : email.status === 'eroare'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>{email.status}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{email.body}</p>
                    {email.error && <p className="mt-2 text-sm font-semibold text-red-700">Eroare: {email.error}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'smtp' && currentUser.role === 'admin' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-black">Configurare SMTP</h2>
              <p className="mt-1 text-sm text-slate-500">
                Aceste setari sunt vizibile doar pentru Administrator si vor fi folosite pentru trimiterea emailurilor automate.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={applyLocalRelayPreset}
                  className="rounded-md border border-emerald-500 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-50"
                >
                  Relay local Hosterion
                </button>
                <button
                  onClick={applyHosterionSmtpPreset}
                  className="rounded-md border border-[#c8102e] px-4 py-2 text-sm font-black text-[#c8102e] hover:bg-red-50"
                >
                  Foloseste SMTP Hosterion
                </button>
                <button
                  onClick={applyGmailSmtpPreset}
                  className="rounded-md border border-slate-400 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Foloseste SMTP Gmail
                </button>
                <button
                  onClick={applyOutlookSmtpPreset}
                  className="rounded-md border border-blue-400 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50"
                >
                  Foloseste SMTP Outlook
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              {smtpSettings.host.toLowerCase().includes('gmail') && (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
                  Gmail detectat. Parola SMTP trebuie sa fie App Password (16 caractere), nu parola contului Google. Genereaza din Google Account → Security → 2-Step Verification → App passwords.
                </div>
              )}
              {smtpSettings.host.toLowerCase().includes('office365') && (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
                  Outlook/Office 365 detectat. Foloseste parola contului Microsoft sau App Password daca MFA e activ pe cont.
                </div>
              )}
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-xs font-black uppercase text-slate-500">
                  SMTP host
                  <input
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                    placeholder="ex: mail.domeniu.ro"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                  />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Port
                  <input
                    value={smtpSettings.port}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                    placeholder="587"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                  />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Utilizator SMTP
                  <input
                    value={smtpSettings.username}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
                    placeholder="email@domeniu.ro"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                  />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Parola SMTP
                  <input
                    value={smtpSettings.password}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                    type="password"
                    placeholder="Parola contului SMTP"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                  />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Email expeditor
                  <input
                    value={smtpSettings.fromEmail}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, fromEmail: e.target.value })}
                    placeholder="noreply@bnigoldmembers.ro"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                  />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Nume expeditor
                  <input
                    value={smtpSettings.fromName}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                    placeholder="BNI Gold Members Romania"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                  />
                </label>
                <label className="block text-xs font-black uppercase text-slate-500">
                  Reply-to
                  <input
                    value={smtpSettings.replyTo}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, replyTo: e.target.value })}
                    placeholder="contact@bnigoldmembers.ro"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-950"
                  />
                </label>
                <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black text-slate-700">
                  <input
                    type="checkbox"
                    checked={smtpSettings.secure}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, secure: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Conexiune securizata SSL/TLS
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    void testSmtpConnection()
                  }}
                  className="rounded-md bg-[#c8102e] px-4 py-2 text-sm font-black text-white hover:bg-[#a20d25]"
                >
                  Testeaza conexiunea SMTP
                </button>
                {smtpTestStatus.message && (
                  <p className={`text-sm font-semibold ${
                    smtpTestStatus.type === 'success'
                      ? 'text-emerald-700'
                      : smtpTestStatus.type === 'error'
                        ? 'text-red-700'
                        : 'text-slate-500'
                  }`}>
                    {smtpTestStatus.message}
                  </p>
                )}
              </div>

              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                Setarile sunt folosite la schimbarea statusului unei recomandari pentru trimiterea emailului prin SMTP.
              </div>
            </div>
          </section>
        )}

        {activeTab === 'groups' && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">{currentUser.role === 'admin' ? 'Toate grupurile' : 'Grupuri din regiune'}</h2>
              <div className="flex items-center gap-2">
                <input
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Cauta grup..."
                  className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button onClick={() => setShowAddGroup(true)} className="rounded-md bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Adauga grup</button>
              </div>
            </div>

            {showAddGroup && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-900">Adauga grup nou</h3>
                <p className="mt-1 text-sm text-slate-500">Completeaza datele grupului. Tinta minima de lansare este 25 de membri.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <label className="text-xs font-black uppercase text-slate-500">
                    Nume grup
                    <input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Ex: BNI ELITE" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950" />
                  </label>
                  <label className="text-xs font-black uppercase text-slate-500">
                    Regiune
                    <select value={newGroup.region} onChange={(e) => setNewGroup({ ...newGroup, region: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950">
                      <option value="">Alege regiune</option>
                      {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-black uppercase text-slate-500">
                    Persoana responsabila
                    <select value={newGroup.director} onChange={(e) => setNewGroup({ ...newGroup, director: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950">
                      <option value="">Alege director</option>
                      {[...directors].sort((a, b) => a.name.localeCompare(b.name, 'ro')).map((d) => <option key={d.id} value={d.name}>{d.name} — {roleLabel(d.role)}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-black uppercase text-slate-500">
                    Membri existenti
                    <input
                      type="number"
                      min={0}
                      value={newGroup.currentMembers === 0 ? '' : newGroup.currentMembers}
                      onChange={(e) => setNewGroup({ ...newGroup, currentMembers: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950"
                    />
                  </label>
                  <label className="text-xs font-black uppercase text-slate-500">
                    {newGroup.launched ? 'Tinta crestere' : 'Tinta lansare'}
                    <input
                      type="number"
                      min={25}
                      value={newGroup.launchTargetMembers === 0 ? '' : newGroup.launchTargetMembers}
                      onChange={(e) => setNewGroup({ ...newGroup, launchTargetMembers: Number(e.target.value) || 0 })}
                      placeholder="min. 25"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950"
                    />
                  </label>
                  <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newGroup.active}
                        onChange={(e) => setNewGroup({ ...newGroup, active: e.target.checked })}
                        className="h-4 w-4 accent-[#c8102e]"
                      />
                      Activ in competitie
                    </label>
                    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="text-sm font-black text-slate-700">{newGroup.launched ? 'Grup lansat' : 'Grup in formare'}</span>
                      <button
                        type="button"
                        onClick={() => setNewGroup({ ...newGroup, launched: !newGroup.launched })}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${newGroup.launched ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        aria-pressed={newGroup.launched}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${newGroup.launched ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={addGroup} className="rounded-md bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Salveaza</button>
                  <button onClick={() => setShowAddGroup(false)} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">Anuleaza</button>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleGroups.filter((group) => !groupSearch || group.name.toLowerCase().includes(groupSearch.toLowerCase())).map((group) => (
                <div key={group.name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  {editingGroupName === group.name && editingGroup ? (
                    <div className="space-y-3">
                      <input value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-bold" />
                      <select value={editingGroup.region} onChange={(e) => setEditingGroup({ ...editingGroup, region: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                        {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                      </select>
                      <select value={editingGroup.director} onChange={(e) => setEditingGroup({ ...editingGroup, director: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                        <option value="">Alege director</option>
                        {[...directors].sort((a, b) => a.name.localeCompare(b.name, 'ro')).map((d) => <option key={d.id} value={d.name}>{d.name} — {roleLabel(d.role)}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs font-black uppercase text-slate-500">
                          Membri existenti
                          <input type="number" min={0} value={editingGroup.currentMembers} onChange={(e) => setEditingGroup({ ...editingGroup, currentMembers: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950" />
                        </label>
                        <label className="text-xs font-black uppercase text-slate-500">
                          {editingGroup.launchedOn ? 'Tinta crestere' : 'Tinta lansare'}
                          <input type="number" min={25} value={editingGroup.launchTargetMembers} onChange={(e) => setEditingGroup({ ...editingGroup, launchTargetMembers: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950" />
                        </label>
                      </div>
                      <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={editingGroup.active !== false} onChange={(e) => setEditingGroup({ ...editingGroup, active: e.target.checked })} className="h-4 w-4 accent-[#c8102e]" />
                        Activ in lista de competitie
                      </label>
                      <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="text-sm font-black text-slate-700">{editingGroup.launchedOn ? 'Grup lansat' : 'Grup in lansare'}</span>
                        <button
                          type="button"
                          onClick={() => setEditingGroup({ ...editingGroup, launchedOn: editingGroup.launchedOn ? undefined : new Date().toISOString().slice(0, 10) })}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${editingGroup.launchedOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          aria-pressed={Boolean(editingGroup.launchedOn)}
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${editingGroup.launchedOn ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEditedGroup} className="rounded-md bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Salveaza</button>
                        <button onClick={cancelEditGroup} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">Anuleaza</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black">{group.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">Regiunea {group.region}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${group.active === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                            {group.active === false ? 'Inactiv' : 'Activ'}
                          </span>
                          <button
                            onClick={() => deleteGroup(group.name)}
                            disabled={!canDeleteGroup(group)}
                            title={canDeleteGroup(group) ? 'Sterge grupul' : 'Doar directorul executiv al regiunii sau un admin poate sterge'}
                            className={`flex h-7 w-7 items-center justify-center rounded-md text-lg font-black leading-none ${canDeleteGroup(group) ? 'bg-red-50 text-[#c8102e] hover:bg-red-100' : 'cursor-not-allowed bg-slate-100 text-slate-300'}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <p><span className="text-slate-500">Persoana responsabila:</span> <span className="font-semibold">{group.director || 'Neasignat'}</span></p>
                        <p><span className="text-slate-500">Domenii:</span> <span className="font-semibold">{priorityDomains.filter((domain) => domain.group === group.name).length} configurate</span></p>
                        <p><span className="text-slate-500">Membri existenti:</span> <span className="font-semibold">{group.currentMembers}</span></p>
                        <p><span className="text-slate-500">{group.launchedOn ? 'Tinta crestere:' : 'Tinta lansare:'}</span> <span className="font-semibold">{getRecommendedMemberCount(group, priorityDomains)}/{group.launchTargetMembers} membri</span></p>
                        <div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#e5dfd5]" role="progressbar" aria-label={`Progres lansare ${group.name}`} aria-valuemin={0} aria-valuemax={group.launchTargetMembers} aria-valuenow={getRecommendedMemberCount(group, priorityDomains)}>
                            <div className="h-full rounded-full bg-[#c8102e]" style={{ width: `${getLaunchCompletionPercent(group, priorityDomains)}%` }} />
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{getLaunchProgressLabel(group, priorityDomains)}</p>
                        </div>
                        <p><span className="text-slate-500">Recomandari:</span> <span className="font-semibold">{recommendations.filter((recommendation) => recommendation.group === group.name).length}</span></p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => startEditGroup(group)} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700">Editeaza</button>
                        <button onClick={() => toggleGroupActive(group.name)} className={`rounded-md px-3 py-2 text-xs font-black text-white ${group.active === false ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-500 hover:bg-slate-600'}`}>
                          {group.active === false ? 'Activeaza' : 'Dezactiveaza'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
