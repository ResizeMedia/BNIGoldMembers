'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import LaunchSeats from '@/components/LaunchSeats'
import {
  DOMAINS_STORAGE_KEY,
  GROUPS_STORAGE_KEY,
  Group,
  PriorityDomain,
  RECOMMENDATIONS_STORAGE_KEY,
  REGULATION_STORAGE_KEY,
  Recommendation,
  RegulationContent,
  initialRegulationContent,
  getActiveSlotDomains,
  getLaunchCompletionPercent,
  getLaunchProgressLabel,
  getLaunchSeats,
  getMemberLeaderboard,
  getRecommendedMemberCount,
  isGroupActive,
  isGroupLaunched,
  initialGroups,
  initialPriorityDomains,
  initialRecommendations,
} from '@/lib/bni-data'

const mapPositions: Record<string, string> = {
  Arges:             'left-[47%] top-[63.3%]',
  Bihor:             'left-[17.7%] top-[41%]',
  'Braila-Galati':   'left-[74.8%] top-[63.9%]',
  'Galati-Braila':   'left-[76%] top-[52.5%]',
  Brasov:            'left-[51%] top-[50.1%]',
  Bucuresti:         'left-[60.2%] top-[76%]',
  Buzau:             'left-[65%] top-[60%]',
  Cluj:              'left-[35.2%] top-[32.6%]',
  Constanta:         'left-[81.9%] top-[80.4%]',
  Iasi:              'left-[70.6%] top-[23.8%]',
  Maramures:         'left-[38.6%] top-[15.8%]',
  Mures:             'left-[45.2%] top-[36.6%]',
  Prahova:           'left-[58%] top-[62.9%]',
  Salaj:             'left-[31.8%] top-[25%]',
  Sibiu:             'left-[41.8%] top-[49.5%]',
  Timis:             'left-[11.8%] top-[52%]',
  Tulcea:            'left-[83.4%] top-[65.4%]',
  Valcea:            'left-[40.5%] top-[62.6%]',
}

export default function Campanie() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'forming' | 'active'>('all')
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false)
  const [openModal, setOpenModal] = useState<null | 'regulament' | 'premii'>(null)
  const [regulation, setRegulation] = useState<RegulationContent>(initialRegulationContent)
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [priorityDomains, setPriorityDomains] = useState<PriorityDomain[]>(initialPriorityDomains)
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations)

  useEffect(() => {
    const storedGroups = window.localStorage.getItem(GROUPS_STORAGE_KEY)
    const storedDomains = window.localStorage.getItem(DOMAINS_STORAGE_KEY)
    const storedRecommendations = window.localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY)

    if (storedGroups) {
      try {
        const parsed = JSON.parse(storedGroups) as Group[]
        if (Array.isArray(parsed)) setGroups(parsed)
      } catch {
        setGroups(initialGroups)
      }
    }

    if (storedDomains) {
      try {
        const parsed = JSON.parse(storedDomains) as PriorityDomain[]
        if (Array.isArray(parsed)) setPriorityDomains(parsed)
      } catch {
        setPriorityDomains(initialPriorityDomains)
      }
    }

    if (storedRecommendations) {
      try {
        const parsed = JSON.parse(storedRecommendations) as Recommendation[]
        if (Array.isArray(parsed)) setRecommendations(parsed)
      } catch {
        setRecommendations(initialRecommendations)
      }
    }

    const storedRegulation = window.localStorage.getItem(REGULATION_STORAGE_KEY)
    if (storedRegulation) {
      try {
        const parsed = JSON.parse(storedRegulation) as Partial<RegulationContent>
        setRegulation({ ...initialRegulationContent, ...parsed })
      } catch {
        setRegulation(initialRegulationContent)
      }
    }
  }, [])

  const rankedGroups = useMemo(() => groups
    .filter(isGroupActive)
    .map((group) => ({
      ...group,
      launchPercent: getLaunchCompletionPercent(group, priorityDomains),
      launchLabel: getLaunchProgressLabel(group, priorityDomains),
      recommendedMembers: getRecommendedMemberCount(group, priorityDomains),
      slotDomains: getActiveSlotDomains(group, priorityDomains),
      seats: getLaunchSeats(group, priorityDomains),
      launched: isGroupLaunched(group),
      newMembers: priorityDomains.filter((domain) => domain.group === group.name && domain.filledFromRecommendationId != null).length,
    }))
    .sort((a, b) => b.launchPercent - a.launchPercent || b.recommendedMembers - a.recommendedMembers || a.name.localeCompare(b.name)), [groups, priorityDomains, recommendations])

  const filteredGroups = rankedGroups
    .filter((group) => (selectedRegion ? group.region === selectedRegion : true))
    .filter((group) => statusFilter === 'all' || (statusFilter === 'active' ? group.launched : !group.launched))
  // Right panel celebrates groups that REACHED their target, ranked by the number of
  // new members brought in through the 6-to-Gold competition (recommendation-validated).
  const celebratedGroups = rankedGroups
    .filter((group) => group.recommendedMembers >= group.launchTargetMembers)
    .sort((a, b) => b.newMembers - a.newMembers || a.name.localeCompare(b.name))
  const regionCounts = rankedGroups.reduce<Record<string, number>>((acc, group) => {
    acc[group.region] = (acc[group.region] || 0) + 1
    return acc
  }, {})

  const totalRecommendations = recommendations.length
  const filledDomains = priorityDomains.filter((domain) => domain.status === 'filled').length
  const memberLeaders = getMemberLeaderboard(recommendations)
  const visibleMemberLeaders = memberLeaders.slice(0, 5)

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#1f2326]">
      <section className="border-b border-[#9f1239] bg-gradient-to-br from-[#ed1c24] via-[#d71920] to-[#9f1239] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/85">Campanie</p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">6 to Gold</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-white/90">
              Recomandarile aduc fiecare grup mai aproape de lansare.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setOpenModal('regulament')} className="inline-block shrink-0 rounded-md border border-white/70 bg-transparent px-4 py-2 text-sm font-black text-white hover:bg-white/10">
              Regulament
            </button>
            <button onClick={() => setOpenModal('premii')} className="inline-block shrink-0 rounded-md border border-white/70 bg-transparent px-4 py-2 text-sm font-black text-white hover:bg-white/10">
              Premii
            </button>
            <Link href="/" className="inline-block shrink-0 rounded-md bg-white px-4 py-2 text-sm font-black text-[#c8102e] hover:bg-white/90">
              Vezi membrii Gold
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[#ded8ce] bg-white">
        <div className="mx-auto grid max-w-7xl gap-2 px-4 py-3 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { label: 'Grupuri in lansare', value: rankedGroups.length },
            { label: 'Persoane recomandate', value: totalRecommendations },
            { label: 'Colegi noi', value: filledDomains },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-md border border-[#ded8ce] bg-[#f7f6f3] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-[#5f6469]">{item.label}</p>
              <p className="text-2xl font-black text-[#c8102e]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-lg border border-[#ded8ce] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black text-[#1f2326]">Top 5 Giveri</h2>
              <p className="mt-1 text-sm font-semibold text-[#5f6469]">Membrii care dau tonul competitiei.</p>
            </div>
            {memberLeaders.length > 5 && (
              <button
                onClick={() => setIsLeaderboardModalOpen(true)}
                className="rounded-md border border-[#c8102e] bg-white px-4 py-2 text-sm font-black text-[#c8102e] hover:bg-[#fff1f2]"
              >
                Vizualizeaza clasamentul complet
              </button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {visibleMemberLeaders.map((member, index) => (
              <div
                key={member.name}
                className={`flex items-center justify-between gap-4 rounded-md border p-3 ${
                  index < 3 ? 'border-[#c8102e]/25 bg-[#fff1f2]' : 'border-[#ded8ce] bg-[#fbfaf7]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#c8102e] text-sm font-black text-white">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-[#1f2326]">{member.name}</p>
                    <p className="truncate text-xs font-black uppercase tracking-wide text-[#c8102e]">{member.group}</p>
                    <p className="text-xs text-[#5f6469]">{member.sent} recomandari, {member.completed} membri BNI</p>
                  </div>
                </div>
                <p className="shrink-0 text-xl font-black text-[#1f2326]">{member.points}p</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#ded8ce] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl font-black text-[#1f2326]">Harta grupurilor in lansare</h2>
            {selectedRegion && <span className="rounded bg-[#fff1f2] px-2 py-1 text-xs font-black text-[#c8102e]">{selectedRegion}</span>}
          </div>
          <p className="mt-1 text-sm font-semibold text-[#5f6469]">Click pe judet pentru filtrarea grupurilor.</p>

          <div className={`relative mt-5 aspect-[4/3] rounded-lg border border-[#ded8ce] bg-white transition ${selectedRegion ? 'ring-2 ring-[#c8102e]/25' : ''}`}>
            <img
              src="/romania-counties.png"
              alt="Harta Romaniei pe judete"
              className={`absolute inset-0 h-full w-full rounded-lg object-contain p-2 transition duration-300 ${selectedRegion ? 'scale-110' : 'scale-100'}`}
            />
            {Object.entries(regionCounts).map(([region, count]) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                title={`${region}: ${count} grupuri in formare`}
                className={`group absolute ${mapPositions[region] || 'left-1/2 top-1/2'} z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#c8102e] text-xs font-black text-white shadow-[0_4px_10px_rgba(31,35,38,0.30)] transition hover:z-20 hover:scale-110 ${selectedRegion === region ? 'ring-4 ring-[#c8102e]/20' : ''}`}
              >
                {count}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1f2326] px-2 py-1 text-[11px] font-black text-white shadow-lg group-hover:block">
                  {region}: {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#1f2326]">Clasament grupuri</h2>
            <p className="text-sm text-[#5f6469]">Ordonare dupa cat de aproape sunt de tinta lor (primele au cele mai mari sanse).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: 'all', label: 'Toate' },
              { key: 'forming', label: 'Grupuri in formare' },
              { key: 'active', label: 'Grupuri active' },
            ] as const).map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-md border px-3 py-2 text-sm font-black transition ${
                  statusFilter === filter.key
                    ? 'border-[#c8102e] bg-[#c8102e] text-white'
                    : 'border-[#ded8ce] bg-white text-[#c8102e] hover:bg-[#fff1f2]'
                }`}
              >
                {filter.label}
              </button>
            ))}
            {selectedRegion && (
              <button
                onClick={() => setSelectedRegion(null)}
                className="rounded-md border border-[#ded8ce] bg-white px-3 py-2 text-sm font-black text-[#c8102e] hover:bg-[#fff1f2]"
              >
                Toate judetele
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {filteredGroups.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#ded8ce] bg-white p-4 text-sm font-semibold text-[#5f6469]">
                Nu exista grupuri pentru acest filtru.
              </div>
            )}
            {filteredGroups.map((group, index) => (
              <article key={group.name} className="rounded-lg border border-[#ded8ce] bg-white p-3 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1f2326] text-xs font-black text-white">#{index + 1}</span>
                      <div>
                        <h3 className="text-sm font-black text-[#1f2326]">{group.name}</h3>
                        <p className="text-xs font-semibold text-[#5f6469]">{group.region}, {group.director}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-wide text-[#5f6469]">
                        <span>{group.launched ? 'Crestere' : 'Lansare'}</span>
                        <span>{group.recommendedMembers}/{group.launchTargetMembers} membri</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5dfd5]" role="progressbar" aria-label={`Progres lansare ${group.name}`} aria-valuemin={0} aria-valuemax={group.launchTargetMembers} aria-valuenow={group.recommendedMembers}>
                        <div className="h-full rounded-full bg-[#c8102e] transition-all" style={{ width: `${group.launchPercent}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] font-semibold leading-4 text-[#5f6469]">{group.launchLabel}</p>
                    </div>
                  </div>

                  <div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {group.slotDomains.map((domain) => (
                        <Link
                          key={domain.id}
                          href={`/recommendations?group=${encodeURIComponent(group.name)}&domain=${encodeURIComponent(domain.name)}`}
                          title={`${domain.name} - ${domain.status === 'filled' ? `Recomandat de: ${domain.filledBy}` : 'Cautat'}`}
                          className={`min-h-[68px] rounded-md border px-3 py-2 transition hover:border-[#c8102e] ${
                            domain.status === 'filled'
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-[#ded8ce] bg-[#fbfaf7]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${domain.status === 'filled' ? 'bg-emerald-500' : 'bg-[#c8102e]'}`} />
                            <p className="line-clamp-2 text-[13px] font-black leading-4 text-[#1f2326]">{domain.name}</p>
                          </div>
                          <p className={`mt-1 line-clamp-2 text-[11px] font-black leading-4 ${domain.status === 'filled' ? 'text-emerald-700' : 'text-[#c8102e]'}`}>
                            {domain.status === 'filled' ? `Recomandat de: ${domain.filledBy}` : 'Cautat'}
                          </p>
                        </Link>
                      ))}
                    </div>
                    <LaunchSeats seats={group.seats} showLegend />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-lg border border-[#ded8ce] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-[#1f2326]">Celebram urmatoarele grupuri</h2>
            <p className="mt-1 text-xs font-semibold text-[#5f6469]">Si-au atins tinta, in ordinea membrilor noi adusi prin competitia 6 to Gold.</p>
            <div className="mt-4 space-y-3">
              {celebratedGroups.length > 0 ? celebratedGroups.map((group, index) => (
                <div key={group.name} className="rounded-md border border-[#ded8ce] bg-[#fbfaf7] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#1f2326]">#{index + 1} {group.name}</p>
                      <p className="text-xs font-semibold text-[#5f6469]">{group.region}</p>
                    </div>
                    <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">Tinta atinsa</span>
                  </div>
                  <p className="mt-2 text-xs font-black text-[#c8102e]">
                    +{group.newMembers} membri noi in urma competitiei 6 to Gold
                  </p>
                </div>
              )) : (
                <div className="rounded-md border border-dashed border-[#ded8ce] bg-[#fbfaf7] p-3 text-sm font-semibold text-[#5f6469]">
                  Niciun grup nu si-a atins inca tinta. Primele reusite vor aparea aici.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {isLeaderboardModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2326]/65 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leaderboard-modal-title"
        >
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-lg border border-[#ded8ce] bg-white shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ded8ce] px-5 py-4">
              <div>
                <h2 id="leaderboard-modal-title" className="text-2xl font-black text-[#1f2326]">
                  Clasamentul complet Top Giveri
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#5f6469]">
                  Toti membrii care au trimis recomandari in competitie.
                </p>
              </div>
              <button
                onClick={() => setIsLeaderboardModalOpen(false)}
                className="rounded-md border border-[#c8102e] bg-white px-4 py-2 text-sm font-black text-[#c8102e] hover:bg-[#fff1f2]"
              >
                Inchide
              </button>
            </div>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
              {memberLeaders.map((member, index) => (
                <div
                  key={`${member.name}-${member.group}`}
                  className={`flex items-center justify-between gap-4 rounded-md border p-4 ${
                    index < 3 ? 'border-[#c8102e]/25 bg-[#fff1f2]' : 'border-[#ded8ce] bg-[#fbfaf7]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-[#c8102e] text-lg font-black text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-[#1f2326]">{member.name}</p>
                      <p className="truncate text-xs font-black uppercase tracking-wide text-[#c8102e]">{member.group}</p>
                      <p className="text-sm text-[#5f6469]">{member.sent} recomandari, {member.completed} membri BNI</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-2xl font-black text-[#1f2326]">{member.points}p</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2326]/65 px-4 py-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenModal(null)}
        >
          <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-lg border border-[#ded8ce] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-[#ded8ce] px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c8102e]">{regulation.eyebrow}</p>
                <h2 className="text-2xl font-black text-[#1f2326]">
                  {openModal === 'regulament' ? regulation.title : regulation.prizesTitle}
                </h2>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="rounded-md border border-[#c8102e] bg-white px-4 py-2 text-sm font-black text-[#c8102e] hover:bg-[#fff1f2]"
              >
                Inchide
              </button>
            </div>
            <div className="max-h-[72vh] space-y-5 overflow-y-auto p-5 text-sm leading-6 text-[#1f2326]">
              {openModal === 'regulament' ? (
                <>
                  <p className="font-semibold text-[#5f6469]">{regulation.subtitle}</p>
                  <div>
                    <h3 className="text-base font-black text-[#1f2326]">{regulation.periodTitle}</h3>
                    <p className="mt-1 whitespace-pre-line">{regulation.periodBody}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1f2326]">{regulation.objectiveTitle}</h3>
                    <p className="mt-1 whitespace-pre-line">{regulation.objectiveBody}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1f2326]">{regulation.scoringTitle}</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {regulation.scoringRows.map((row) => <li key={row}>{row}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1f2326]">{regulation.prizesTitle}</h3>
                    <p className="mt-1 whitespace-pre-line">{regulation.prizesBody}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1f2326]">{regulation.transparencyTitle}</h3>
                    <p className="mt-1 whitespace-pre-line">{regulation.transparencyBody}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-base font-black text-[#1f2326]">{regulation.prizesTitle}</h3>
                    <p className="mt-1 whitespace-pre-line">{regulation.prizesBody}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1f2326]">Conditii de premiere</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {regulation.scoringRows.map((row) => <li key={row}>{row}</li>)}
                    </ul>
                    <p className="mt-2 whitespace-pre-line text-[#5f6469]">{regulation.transparencyBody}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
