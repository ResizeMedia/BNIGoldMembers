'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { predefinedDomains } from '@/lib/domain-options'
import {
  Director,
  DirectorRole,
  DomainStatus,
  DIRECTORS_STORAGE_KEY,
  DOMAINS_STORAGE_KEY,
  EMAIL_LOG_STORAGE_KEY,
  EMAIL_TEMPLATES_STORAGE_KEY,
  EmailLog,
  EmailTemplate,
  Group,
  GROUPS_STORAGE_KEY,
  PriorityDomain,
  Recommendation,
  RecommendationStatus,
  REGULATION_STORAGE_KEY,
  RegulationContent,
  RECOMMENDATIONS_STORAGE_KEY,
  SMTP_SETTINGS_STORAGE_KEY,
  SmtpSettings,
  getDirectorRegions,
  getGroupsForDirector,
  getLaunchCompletionPercent,
  getLaunchProgressLabel,
  getMemberLeaderboard,
  getRecommendedMemberCount,
  initialDirectors,
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

  return role === 'executive_director' ? 'Director Executiv' : 'Director Consultant Lansare'
}

function accessLabel(director: Director) {
  if (director.role === 'admin') {
    return 'Acces complet'
  }

  const directorRegions = getDirectorRegions(director)

  if (directorRegions.length > 0) {
    return directorRegions.join(', ')
  }

  return director.group || 'Neconfigurat'
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

type AdminTab = 'overview' | 'recommendations' | 'domains' | 'directors' | 'groups' | 'regulation' | 'email_templates' | 'smtp'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<Director | null>(null)
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false)

  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [directors, setDirectors] = useState<Director[]>(initialDirectors)
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations)
  const [priorityDomains, setPriorityDomains] = useState<PriorityDomain[]>(initialPriorityDomains)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(initialEmailTemplates)
  const [emailLog, setEmailLog] = useState<EmailLog[]>([])
  const [regulationContent, setRegulationContent] = useState<RegulationContent>(initialRegulationContent)
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(initialSmtpSettings)

  const [showAddDirector, setShowAddDirector] = useState(false)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newDirector, setNewDirector] = useState({ name: '', email: '', role: 'launch_consultant' as DirectorRole, temporaryPassword: '', regions: [] as string[], group: '' })
  const [newDomain, setNewDomain] = useState({ name: '', description: '', group: '' })
  const [newGroup, setNewGroup] = useState({ name: '', region: '', director: '', currentMembers: 0, launchTargetMembers: 25, active: true })
  const [editingGroupName, setEditingGroupName] = useState('')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editingDirectorId, setEditingDirectorId] = useState<number | null>(null)
  const [editingDirector, setEditingDirector] = useState<Director | null>(null)
  const [temporaryPasswordInput, setTemporaryPasswordInput] = useState('')
  const [openRecommendationIds, setOpenRecommendationIds] = useState<number[]>([])
  const [smtpTestStatus, setSmtpTestStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({ type: 'idle', message: '' })

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
      if (director.group && visibleGroupNames.has(director.group)) return true
      return getDirectorRegions(director).some((region) => visibleRegionNames.has(region))
    })
  }, [currentUser, directors, visibleGroupNames, visibleRegionNames])

  const rankedGroups = useMemo(
    () => visibleGroups
      .map((group) => ({
        ...group,
        launchPercent: getLaunchCompletionPercent(group, priorityDomains),
        launchLabel: getLaunchProgressLabel(group, priorityDomains),
        recommendedMembers: getRecommendedMemberCount(group, priorityDomains),
        domains: priorityDomains.filter((domain) => domain.group === group.name),
        recommendations: recommendations.filter((recommendation) => recommendation.group === group.name),
      }))
      .sort((a, b) => b.launchPercent - a.launchPercent || b.recommendedMembers - a.recommendedMembers || a.name.localeCompare(b.name)),
    [visibleGroups, recommendations, priorityDomains]
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
    ...(currentUser?.role === 'admin' || currentUser?.role === 'executive_director' ? [
      { key: 'groups' as AdminTab, label: 'Grupuri' },
    ] : []),
    ...(currentUser?.role === 'admin' ? [
      { key: 'regulation' as AdminTab, label: 'Regulament' },
    ] : []),
    ...(currentUser?.role === 'admin' || currentUser?.role === 'executive_director' ? [
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

    const storedDomains = window.localStorage.getItem(DOMAINS_STORAGE_KEY)
    if (storedDomains) {
      try {
        const parsed = JSON.parse(storedDomains) as PriorityDomain[]
        if (Array.isArray(parsed)) {
          setPriorityDomains(parsed)
        }
      } catch {
        setError('Nu am putut citi domeniile salvate local')
      }
    }

    const storedRecommendations = window.localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY)
    if (storedRecommendations) {
      try {
        const parsed = JSON.parse(storedRecommendations) as Recommendation[]
        if (Array.isArray(parsed)) {
          setRecommendations(parsed)
        }
      } catch {
        setError('Nu am putut citi recomandarile salvate local')
      }
    }

    const storedEmailTemplates = window.localStorage.getItem(EMAIL_TEMPLATES_STORAGE_KEY)
    if (storedEmailTemplates) {
      try {
        const parsed = JSON.parse(storedEmailTemplates) as EmailTemplate[]
        if (Array.isArray(parsed)) {
          setEmailTemplates(parsed)
        }
      } catch {
        setError('Nu am putut citi template-urile email salvate local')
      }
    }

    const storedEmailLog = window.localStorage.getItem(EMAIL_LOG_STORAGE_KEY)
    if (storedEmailLog) {
      try {
        const parsed = JSON.parse(storedEmailLog) as EmailLog[]
        if (Array.isArray(parsed)) {
          setEmailLog(parsed)
        }
      } catch {
        setError('Nu am putut citi emailurile generate salvate local')
      }
    }

    const storedRegulation = window.localStorage.getItem(REGULATION_STORAGE_KEY)
    if (storedRegulation) {
      try {
        const parsed = JSON.parse(storedRegulation) as RegulationContent
        setRegulationContent({ ...initialRegulationContent, ...parsed })
      } catch {
        setError('Nu am putut citi regulamentul salvat local')
      }
    }

    const storedSmtpSettings = window.localStorage.getItem(SMTP_SETTINGS_STORAGE_KEY)
    if (storedSmtpSettings) {
      try {
        const parsed = JSON.parse(storedSmtpSettings) as SmtpSettings
        setSmtpSettings({ ...initialSmtpSettings, ...parsed })
      } catch {
        setError('Nu am putut citi configurarea SMTP salvata local')
      }
    }

    setHasLoadedStoredState(true)
  }, [])

  useEffect(() => {
    if (!hasLoadedStoredState) return
    window.localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(recommendations))
  }, [hasLoadedStoredState, recommendations])

  useEffect(() => {
    if (!hasLoadedStoredState) return
    window.localStorage.setItem(DIRECTORS_STORAGE_KEY, JSON.stringify(directors))
  }, [directors, hasLoadedStoredState])

  useEffect(() => {
    if (!hasLoadedStoredState) return
    window.localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
  }, [groups, hasLoadedStoredState])

  useEffect(() => {
    if (!hasLoadedStoredState) return
    window.localStorage.setItem(DOMAINS_STORAGE_KEY, JSON.stringify(priorityDomains))
  }, [hasLoadedStoredState, priorityDomains])

  useEffect(() => {
    if (!hasLoadedStoredState) return
    window.localStorage.setItem(EMAIL_TEMPLATES_STORAGE_KEY, JSON.stringify(emailTemplates))
  }, [emailTemplates, hasLoadedStoredState])

  useEffect(() => {
    if (!hasLoadedStoredState) return
    window.localStorage.setItem(EMAIL_LOG_STORAGE_KEY, JSON.stringify(emailLog))
  }, [emailLog, hasLoadedStoredState])

  useEffect(() => {
    if (!hasLoadedStoredState) return
    window.localStorage.setItem(REGULATION_STORAGE_KEY, JSON.stringify(regulationContent))
  }, [hasLoadedStoredState, regulationContent])

  useEffect(() => {
    if (!hasLoadedStoredState) return
    window.localStorage.setItem(SMTP_SETTINGS_STORAGE_KEY, JSON.stringify(smtpSettings))
  }, [hasLoadedStoredState, smtpSettings])

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

    setPriorityDomains((prev) => [...prev, { ...newDomain, id: prev.length + 1, status: 'open' }])
    setNewDomain({ name: '', description: '', group: '' })
    setShowAddDomain(false)
    setError('')
  }

  const removeDomain = (id: number) => {
    setPriorityDomains((prev) => prev.filter((domain) => domain.id !== id))
  }

  const addDirector = () => {
    if (!newDirector.name || !newDirector.email) return
    if (newDirector.role === 'executive_director' && newDirector.regions.length === 0) return
    if (newDirector.role === 'launch_consultant' && !newDirector.group) return
    if (!newDirector.temporaryPassword) return
    setDirectors((prev) => [...prev, { ...newDirector, id: prev.length + 1, mustChangePassword: true }])
    setNewDirector({ name: '', email: '', role: 'launch_consultant', temporaryPassword: '', regions: [], group: '' })
    setShowAddDirector(false)
    setError('')
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
    setGroups((prev) => [...prev, { ...newGroup, status: 'in formare' }])
    setNewGroup({ name: '', region: '', director: '', currentMembers: 0, launchTargetMembers: 25, active: true })
    setShowAddGroup(false)
  }

  const startEditGroup = (group: Group) => {
    setEditingGroupName(group.name)
    setEditingGroup({ ...group, active: group.active !== false })
    setError('')
  }

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
    setDirectors((prev) => prev.map((director) => director.group === editingGroupName ? { ...director, group: editingGroup.name } : director))
    cancelEditGroup()
  }

  const toggleGroupActive = (groupName: string) => {
    setGroups((prev) => prev.map((group) => group.name === groupName ? { ...group, active: group.active === false } : group))
  }

  const startEditDirector = (director: Director) => {
    setEditingDirectorId(director.id)
    setEditingDirector({ ...director, regions: getDirectorRegions(director), mustChangePassword: director.mustChangePassword !== false })
    setTemporaryPasswordInput('')
    setError('')
  }

  const cancelEditDirector = () => {
    setEditingDirectorId(null)
    setEditingDirector(null)
    setTemporaryPasswordInput('')
    setError('')
  }

  const saveEditedDirector = () => {
    if (!editingDirector) return
    if (!editingDirector.name || !editingDirector.email) return
    if (editingDirector.role === 'executive_director' && getDirectorRegions(editingDirector).length === 0) {
      setError('Directorul executiv trebuie sa aiba cel putin o regiune configurata')
      return
    }
    if (editingDirector.role === 'launch_consultant' && !editingDirector.group) {
      setError('Directorul consultant trebuie sa aiba un grup configurat')
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
              {currentUser.name}, {roleLabel(currentUser.role)}, {currentUser.role === 'admin' ? 'toate regiunile' : currentUser.role === 'executive_director' ? `Regiuni: ${accessLabel(currentUser)}` : currentUser.group}
            </p>
          </div>
          <button
            onClick={() => { setIsAuthenticated(false); setCurrentUser(null); setLoginName(''); setPassword('') }}
            className="w-fit rounded-md bg-[#343a40] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#4b4f54]"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="border-b border-[#ded8ce] bg-white">
        <div className="mx-auto grid max-w-7xl gap-2 px-4 py-3 sm:grid-cols-3 sm:px-6 lg:grid-cols-7 lg:px-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
                { label: 'Noi', value: stats.pending },
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
                              <span>Lansare</span>
                              <span>{group.recommendedMembers}/{group.launchTargetMembers}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#e5dfd5]" role="progressbar" aria-label={`Progres lansare ${group.name}`} aria-valuemin={0} aria-valuemax={group.launchTargetMembers} aria-valuenow={group.recommendedMembers}>
                              <div className="h-full rounded-full bg-[#c8102e]" style={{ width: `${group.launchPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {group.domains.slice(0, 6).map((domain) => (
                          <div key={domain.id} title={`${domain.name} - ${domain.status === 'filled' ? domain.filledBy : 'Cautat'}`} className={`min-h-[58px] rounded-md border p-2 ${domain.status === 'filled' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                            <p className="line-clamp-2 text-[12px] font-black leading-4">{domain.name}</p>
                            <p className={`mt-1 line-clamp-2 text-[10px] font-bold leading-3 ${domain.status === 'filled' ? 'text-emerald-700' : 'text-red-600'}`}>
                              {domain.status === 'filled' ? domain.filledBy : 'Cautat'}
                            </p>
                          </div>
                        ))}
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
              {visibleGroups.map((group) => {
                const groupDomains = priorityDomains.filter((domain) => domain.group === group.name)

                return (
                  <div key={group.name}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black">{group.name}</h3>
                      <span className="text-sm font-semibold text-slate-500">({group.region})</span>
                      <span className="text-sm font-semibold text-slate-400">{groupDomains.length} domenii configurate</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {groupDomains.slice(0, 6).map((domain) => (
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
                        </div>
                      ))}
                      {groupDomains.length < 6 && Array.from({ length: 6 - groupDomains.length }).map((_, index) => (
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
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {activeTab === 'directors' && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black">Directori</h2>
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
                  </select>
                  {newDirector.role === 'admin' ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">Acces complet</div>
                  ) : newDirector.role === 'executive_director' ? (
                    <div>
                      <select
                        multiple
                        value={newDirector.regions}
                        onChange={(e) => setNewDirector({
                          ...newDirector,
                          regions: Array.from(e.target.selectedOptions, (option) => option.value),
                        })}
                        className="min-h-[92px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      >
                        {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                      </select>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">Ctrl/Cmd + click pentru mai multe regiuni.</p>
                    </div>
                  ) : (
                    <select value={newDirector.group} onChange={(e) => setNewDirector({ ...newDirector, group: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                      <option value="">Grup</option>
                      {visibleGroups.map((group) => <option key={group.name} value={group.name}>{group.name}</option>)}
                    </select>
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
                    {['Nume', 'Email', 'Rol', 'Parola temporara', 'Acces configurat', 'Actiuni'].map((head) => <th key={head} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{head}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleDirectors
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
                              <button onClick={() => startEditDirector(director)} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700">
                                Editeaza
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-slate-500">Doar vizualizare</span>
                            )}
                          </td>
                        </tr>
                        {editingDirectorId === director.id && editingDirector && (
                          <tr className="border-t border-slate-100 bg-slate-50">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="grid gap-3 lg:grid-cols-5">
                                <input value={editingDirector.name} onChange={(e) => setEditingDirector({ ...editingDirector, name: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                <input value={editingDirector.email} onChange={(e) => setEditingDirector({ ...editingDirector, email: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                <select value={editingDirector.role} onChange={(e) => setEditingDirector({ ...editingDirector, role: e.target.value as DirectorRole, group: '', regions: [] })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                                  <option value="admin">Administrator</option>
                                  <option value="executive_director">Director Executiv</option>
                                  <option value="launch_consultant">Director Consultant Lansare</option>
                                </select>
                                {editingDirector.role === 'admin' ? (
                                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500">Acces complet</div>
                                ) : editingDirector.role === 'executive_director' ? (
                                  <select
                                    multiple
                                    value={getDirectorRegions(editingDirector)}
                                    onChange={(e) => setEditingDirector({ ...editingDirector, regions: Array.from(e.target.selectedOptions, (option) => option.value), region: undefined, group: undefined })}
                                    className="min-h-[86px] rounded-md border border-slate-300 px-3 py-2 text-sm"
                                  >
                                    {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                                  </select>
                                ) : (
                                  <select value={editingDirector.group || ''} onChange={(e) => setEditingDirector({ ...editingDirector, group: e.target.value, regions: [], region: undefined })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                                    <option value="">Grup</option>
                                    {visibleGroups.map((group) => <option key={group.name} value={group.name}>{group.name}</option>)}
                                  </select>
                                )}
                                <div className="space-y-2">
                                  <input value={temporaryPasswordInput} onChange={(e) => setTemporaryPasswordInput(e.target.value)} placeholder="Parola temporara noua" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                  <button onClick={setTemporaryPasswordForDirector} className="w-full rounded-md bg-[#c8102e] px-3 py-2 text-xs font-black text-white hover:bg-[#9f1239]">Seteaza temporara</button>
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

        {activeTab === 'groups' && (currentUser.role === 'admin' || currentUser.role === 'executive_director') && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black">{currentUser.role === 'admin' ? 'Toate grupurile' : 'Grupuri din regiune'}</h2>
              <button onClick={() => setShowAddGroup(true)} className="rounded-md bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Adauga grup</button>
            </div>

            {showAddGroup && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 md:grid-cols-6">
                  <input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Ex: BNI ELITE" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <select value={newGroup.region} onChange={(e) => setNewGroup({ ...newGroup, region: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Regiune</option>
                    {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                  </select>
                  <input value={newGroup.director} onChange={(e) => setNewGroup({ ...newGroup, director: e.target.value })} placeholder="Director responsabil" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <input
                    type="number"
                    min={0}
                    value={newGroup.currentMembers}
                    onChange={(e) => setNewGroup({ ...newGroup, currentMembers: Number(e.target.value) })}
                    placeholder="Membri actuali"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={25}
                    value={newGroup.launchTargetMembers}
                    onChange={(e) => setNewGroup({ ...newGroup, launchTargetMembers: Number(e.target.value) })}
                    placeholder="Tinta lansare, min. 25 membri"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newGroup.active}
                      onChange={(e) => setNewGroup({ ...newGroup, active: e.target.checked })}
                      className="h-4 w-4 accent-[#c8102e]"
                    />
                    Activ in competitie
                  </label>
                  <div className="flex gap-2">
                    <button onClick={addGroup} className="rounded-md bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Salveaza</button>
                    <button onClick={() => setShowAddGroup(false)} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">Anuleaza</button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleGroups.map((group) => (
                <div key={group.name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  {editingGroupName === group.name && editingGroup ? (
                    <div className="space-y-3">
                      <input value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-bold" />
                      <select value={editingGroup.region} onChange={(e) => setEditingGroup({ ...editingGroup, region: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                        {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                      </select>
                      <input value={editingGroup.director} onChange={(e) => setEditingGroup({ ...editingGroup, director: e.target.value })} placeholder="Persoana responsabila" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs font-black uppercase text-slate-500">
                          Membri actuali
                          <input type="number" min={0} value={editingGroup.currentMembers} onChange={(e) => setEditingGroup({ ...editingGroup, currentMembers: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950" />
                        </label>
                        <label className="text-xs font-black uppercase text-slate-500">
                          Tinta lansare
                          <input type="number" min={25} value={editingGroup.launchTargetMembers} onChange={(e) => setEditingGroup({ ...editingGroup, launchTargetMembers: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950" />
                        </label>
                      </div>
                      <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={editingGroup.active !== false} onChange={(e) => setEditingGroup({ ...editingGroup, active: e.target.checked })} className="h-4 w-4 accent-[#c8102e]" />
                        Activ in lista de competitie
                      </label>
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
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${group.active === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                          {group.active === false ? 'Inactiv' : 'Activ'}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <p><span className="text-slate-500">Persoana responsabila:</span> <span className="font-semibold">{group.director || 'Neasignat'}</span></p>
                        <p><span className="text-slate-500">Domenii:</span> <span className="font-semibold">{priorityDomains.filter((domain) => domain.group === group.name).length} configurate</span></p>
                        <p><span className="text-slate-500">Membri actuali:</span> <span className="font-semibold">{group.currentMembers}</span></p>
                        <p><span className="text-slate-500">Tinta lansare:</span> <span className="font-semibold">{getRecommendedMemberCount(group, priorityDomains)}/{group.launchTargetMembers} membri</span></p>
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
