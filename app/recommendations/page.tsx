'use client'

import { useEffect, useState } from 'react'
import { predefinedDomains } from '@/lib/domain-options'
import {
  EMAIL_LOG_STORAGE_KEY,
  EMAIL_TEMPLATES_STORAGE_KEY,
  EmailLog,
  EmailTemplate,
  GROUPS_STORAGE_KEY,
  Group,
  RECOMMENDATIONS_STORAGE_KEY,
  SMTP_SETTINGS_STORAGE_KEY,
  Recommendation,
  SmtpSettings,
  initialEmailTemplates,
  initialGroups,
  initialRecommendations,
  initialSmtpSettings,
  isGroupActive,
  renderEmailTemplate,
} from '@/lib/bni-data'

export default function Recommendations() {
  const [formData, setFormData] = useState({
    recommendingMember: '',
    recommendingGroup: '',
    recommenderPhone: '',
    recommenderEmail: '',
    recommendedMember: '',
    recommendedPhone: '',
    contactNotes: '',
    businessDescription: '',
    referralDetails: '',
    group: '',
    domain: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [groups, setGroups] = useState<Group[]>(initialGroups)

  useEffect(() => {
    const storedGroups = window.localStorage.getItem(GROUPS_STORAGE_KEY)
    if (storedGroups) {
      try {
        const parsed = JSON.parse(storedGroups) as Group[]
        if (Array.isArray(parsed)) {
          setGroups(parsed)
        }
      } catch {
        setGroups(initialGroups)
      }
    }

    const params = new URLSearchParams(window.location.search)
    const group = params.get('group') || ''
    const domain = params.get('domain') || ''

    setFormData((prev) => ({
      ...prev,
      group,
      domain,
      businessDescription: domain ? `Recomandare pentru domeniul ${domain}` : prev.businessDescription,
    }))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const stored = window.localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY)
    const existingRecommendations = stored ? JSON.parse(stored) as Recommendation[] : initialRecommendations
    const newRecommendation: Recommendation = {
      id: Date.now(),
      from: formData.recommendingMember,
      to: formData.recommendedMember,
      domain: formData.domain,
      group: formData.group,
      recommendingGroup: formData.recommendingGroup,
      recommenderPhone: formData.recommenderPhone,
      recommenderEmail: formData.recommenderEmail,
      recommendedPhone: formData.recommendedPhone,
      contactNotes: formData.contactNotes,
      consentConfirmed: hasConsent,
      fitDetails: formData.referralDetails,
      details: [
        formData.referralDetails ? `Potrivire domeniu: ${formData.referralDetails}` : '',
        formData.recommendingGroup ? `Grup recomandator: ${formData.recommendingGroup}` : '',
        formData.recommenderPhone ? `Telefon recomandator: ${formData.recommenderPhone}` : '',
        formData.recommenderEmail ? `Email recomandator: ${formData.recommenderEmail}` : '',
        formData.recommendedPhone ? `Telefon persoana recomandata: ${formData.recommendedPhone}` : '',
        formData.contactNotes ? `Modalitate contact: ${formData.contactNotes}` : '',
        hasConsent ? 'Confirmare: persoana recomandata a acceptat sa fie sunata de un reprezentant BNI local.' : '',
      ].filter(Boolean).join(' '),
      date: new Date().toISOString().split('T')[0],
      status: 'new',
    }

    window.localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify([...existingRecommendations, newRecommendation]))

    const storedTemplates = window.localStorage.getItem(EMAIL_TEMPLATES_STORAGE_KEY)
    const templates = storedTemplates ? JSON.parse(storedTemplates) as EmailTemplate[] : initialEmailTemplates
    const confirmationTemplate = templates.find((template) => template.type === 'recommendation_confirmation') || initialEmailTemplates[0]
    const renderedEmail = renderEmailTemplate(confirmationTemplate, {
      recommenderName: formData.recommendingMember,
      recommendedName: formData.recommendedMember,
      domain: formData.domain,
      group: formData.group,
      status: 'Recomandare noua',
    })
    const emailEntry: EmailLog = {
      id: Date.now() + 1,
      type: 'recommendation_confirmation',
      to: formData.recommenderEmail,
      subject: renderedEmail.subject,
      body: renderedEmail.body,
      recommendationId: newRecommendation.id,
      createdAt: new Date().toISOString(),
      status: 'generat',
    }

    const storedEmailLog = window.localStorage.getItem(EMAIL_LOG_STORAGE_KEY)
    const emailLog = storedEmailLog ? JSON.parse(storedEmailLog) as EmailLog[] : []
    window.localStorage.setItem(EMAIL_LOG_STORAGE_KEY, JSON.stringify([...emailLog, emailEntry]))

    if (formData.recommenderEmail) {
      const storedSmtp = window.localStorage.getItem(SMTP_SETTINGS_STORAGE_KEY)
      const smtpSettings: SmtpSettings = storedSmtp ? { ...initialSmtpSettings, ...JSON.parse(storedSmtp) as SmtpSettings } : initialSmtpSettings

      if (smtpSettings.host && smtpSettings.username && smtpSettings.password) {
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtpSettings,
              email: {
                to: formData.recommenderEmail,
                subject: renderedEmail.subject,
                body: renderedEmail.body,
              },
            }),
          })
          const result = await response.json() as { success?: boolean; error?: string }
          const updatedLog = window.localStorage.getItem(EMAIL_LOG_STORAGE_KEY)
          const logArr = updatedLog ? JSON.parse(updatedLog) as EmailLog[] : []
          window.localStorage.setItem(EMAIL_LOG_STORAGE_KEY, JSON.stringify(
            logArr.map((item) => item.id === emailEntry.id
              ? { ...item, status: result.success ? 'trimis' : 'eroare', error: result.success ? undefined : result.error }
              : item
            )
          ))
        } catch {
          // Email send failed silently — logged in emailLog with 'generat' status
        }
      }
    }

    // Notify the group's launch consultant + region's executive director(s) so they
    // validate quickly. Sent server-side (server-stored SMTP) so it works for any
    // submission, including public visitors with no SMTP in their browser. Best-effort.
    const notificationTemplate = templates.find((template) => template.type === 'recommendation_notification')
      || initialEmailTemplates.find((template) => template.type === 'recommendation_notification')
    if (notificationTemplate) {
      const region = groups.find((group) => group.name === formData.group)?.region
      fetch('/api/notify-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: {
            from: formData.recommendingMember,
            to: formData.recommendedMember,
            domain: formData.domain,
            group: formData.group,
          },
          region,
          template: { subject: notificationTemplate.subject, body: notificationTemplate.body },
        }),
      }).catch(() => {
        // Best-effort notification; never blocks the recommendation submission.
      })
    }

    setSubmitted(true)
    setFormData((prev) => ({
      ...prev,
      recommendingMember: '',
      recommendingGroup: '',
      recommenderPhone: '',
      recommenderEmail: '',
      recommendedMember: '',
      recommendedPhone: '',
      contactNotes: '',
      referralDetails: '',
    }))
    setHasConsent(false)
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c8102e]">Recomandare BNI</p>
          <h1 className="mt-2 text-4xl font-black text-[#1f2326]">Trimite o recomandare</h1>
          <p className="mt-2 text-sm text-[#5f6469]">
            Domeniul selectat ajunge direct la directorul responsabil pentru validare.
          </p>
        </div>

        {submitted && (
          <div className="mb-6 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            Recomandarea a fost trimisa. Directorul o va vedea in admin ca recomandare noua.
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-lg border border-[#ded8ce] bg-white p-6 shadow-sm">
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#5f6469]">Grup</label>
              <select
                name="group"
                value={formData.group}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#c9c3b8] bg-white px-4 py-2 font-black text-[#1f2326] focus:border-[#c8102e] focus:outline-none"
              >
                <option value="">Selecteaza grupul</option>
                {groups.filter(isGroupActive).map((group) => (
                  <option key={group.name} value={group.name}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#5f6469]">Domeniu</label>
              <input
                type="text"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                required
                list="predefined-domains"
                className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 font-black text-[#1f2326] focus:border-[#c8102e] focus:outline-none"
                placeholder="Cauta sau selecteaza domeniul"
              />
              <datalist id="predefined-domains">
                {predefinedDomains.map((domain) => (
                  <option key={domain} value={domain} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block font-bold text-[#1f2326]">Numele tau</label>
            <input
              type="text"
              name="recommendingMember"
              value={formData.recommendingMember}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 focus:border-[#c8102e] focus:outline-none"
              placeholder="Prenume Nume"
            />
          </div>

          <div className="mb-5 grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block font-bold text-[#1f2326]">Grupul BNI din care faci parte</label>
              <input
                type="text"
                name="recommendingGroup"
                value={formData.recommendingGroup}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 focus:border-[#c8102e] focus:outline-none"
                placeholder="Ex: BNI Gold, BNI Health"
              />
            </div>
            <div>
              <label className="mb-2 block font-bold text-[#1f2326]">Telefonul tau</label>
              <input
                type="tel"
                name="recommenderPhone"
                value={formData.recommenderPhone}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 focus:border-[#c8102e] focus:outline-none"
                placeholder="Numar telefon"
              />
            </div>
            <div>
              <label className="mb-2 block font-bold text-[#1f2326]">Emailul tau</label>
              <input
                type="email"
                name="recommenderEmail"
                value={formData.recommenderEmail}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 focus:border-[#c8102e] focus:outline-none"
                placeholder="email@exemplu.ro"
              />
            </div>
          </div>

          <div className="mb-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-bold text-[#1f2326]">Persoana recomandata</label>
              <input
                type="text"
                name="recommendedMember"
                value={formData.recommendedMember}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 focus:border-[#c8102e] focus:outline-none"
                placeholder="Nume persoana"
              />
            </div>
            <div>
              <label className="mb-2 block font-bold text-[#1f2326]">Numar telefon</label>
              <input
                type="tel"
                name="recommendedPhone"
                value={formData.recommendedPhone}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 focus:border-[#c8102e] focus:outline-none"
                placeholder="Numar telefon"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block font-bold text-[#1f2326]">Informatii suplimentare legate de modalitatea de contact</label>
            <textarea
              name="contactNotes"
              value={formData.contactNotes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 focus:border-[#c8102e] focus:outline-none"
              placeholder="Ex: prefera sa fie sunat dimineata, a cerut detalii pe WhatsApp, vorbeste mai usor dupa ora 17:00"
            />
          </div>

          <label className="mb-5 flex gap-3 rounded-lg border border-[#ded8ce] bg-[#f7f6f3] p-4 text-sm font-semibold text-[#1f2326]">
            <input
              type="checkbox"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              required
              className="mt-1 h-4 w-4 shrink-0 accent-[#c8102e]"
            />
            <span>Ai confirmat cu persoana pe care o recomanzi ca va fi sunata de catre un reprezentant BNI local?</span>
          </label>

          <div className="mb-5">
            <label className="mb-2 block font-bold text-[#1f2326]">Potrivirea cu domeniul</label>
            <textarea
              name="referralDetails"
              value={formData.referralDetails}
              onChange={handleChange}
              required
              rows={4}
              className="w-full rounded-lg border border-[#c9c3b8] px-4 py-2 focus:border-[#c8102e] focus:outline-none"
              placeholder="De ce se potriveste aceasta persoana pentru domeniul selectat?"
            />
          </div>

          <button
            type="submit"
            disabled={!formData.group || !formData.domain || !hasConsent}
            className="rounded-lg bg-[#c8102e] px-6 py-3 font-bold text-white transition hover:bg-[#9f1239] disabled:cursor-not-allowed disabled:bg-[#c9c3b8]"
          >
            Trimite recomandarea
          </button>
        </form>
      </div>
    </div>
  )
}
