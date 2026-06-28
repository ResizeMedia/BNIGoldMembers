'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  GoldPerformer,
  getGoldProgress,
  goldThreshold,
  initialGoldPerformers,
} from '@/lib/bni-data'

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export default function Home() {
  const [performers, setPerformers] = useState<GoldPerformer[]>(initialGoldPerformers)

  useEffect(() => {
    fetch('/api/performers')
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) setPerformers(json.data)
      })
      .catch(() => {})
  }, [])

  const sorted = [...performers].sort(
    (a, b) => b.sponsoredMembers - a.sponsoredMembers || b.competitionRecommendations - a.competitionRecommendations || a.name.localeCompare(b.name)
  )
  const goldMembers = sorted.filter((m) => m.sponsoredMembers >= goldThreshold)
  const podium = sorted.slice(0, 3)

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#1f2326]">
      <section className="bg-gradient-to-br from-[#ed1c24] via-[#d71920] to-[#9f1239] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/85">BNI Romania</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Gold Club Members</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-white px-3 py-1 text-sm font-black text-[#c8102e]">{goldMembers.length} membri Gold</span>
              <span className="rounded bg-white/20 px-3 py-1 text-sm font-black">Prag: {goldThreshold} membri adusi</span>
            </div>
          </div>

          {podium.length > 0 && (
            <div className="grid w-full max-w-md grid-cols-3 items-end gap-3 lg:w-auto">
              {[podium[1], podium[0], podium[2]].map((member, i) => {
                if (!member) return <div key={i} />
                const height = member === podium[0] ? 'h-16' : member === podium[1] ? 'h-12' : 'h-10'
                const place = member === podium[0] ? 1 : member === podium[1] ? 2 : 3
                return (
                  <div key={member.id} className="flex flex-col items-center">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="h-11 w-11 rounded-full border-2 border-white object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-white text-sm font-black text-[#c8102e]">{initials(member.name)}</div>
                    )}
                    <p className="mt-1 text-center text-[11px] font-black leading-tight">{member.name}</p>
                    <div className={`mt-1.5 flex ${height} w-full items-start justify-center rounded-t-md bg-white/15 pt-1 text-xl font-black`}>{place}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-[#ded8ce] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
          <img src="/gold-club-pin.png" alt="Pin GOLD CLUB MEMBER" className="h-20 w-auto shrink-0 drop-shadow" />
          <div className="text-sm leading-6 text-[#1f2326]">
            <p>
              <span className="font-black">Membrii Gold Club</span> sunt recunoscuti pentru ca au recomandat sase (6) sau mai multe persoane noi in comunitatea BNI (oricare grup din regiune, orice perioada de timp).
            </p>
            <p className="mt-2">
              Ei primesc o insigna speciala de membru si un pin cu diamant, impreuna cu recunoastere in cadrul grupului lor si pe site-ul national. Exista si evenimente regionale pentru ca membrii sa interactioneze cu alti lideri din BNI.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black uppercase text-[#e62612] sm:text-2xl">Gold Club Members in BNI Romania</h2>
            <span className="h-1 w-24 bg-[#c8102e]" />
          </div>
          <Link href="/campanie" className="rounded-md border border-[#c8102e] bg-white px-4 py-2 text-sm font-black text-[#c8102e] hover:bg-[#fff1f2]">
            Vezi Campania &quot;6 to Gold&quot;
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((member, index) => {
            const progress = getGoldProgress(member)
            const isGold = member.sponsoredMembers >= goldThreshold
            const remaining = Math.max(goldThreshold - member.sponsoredMembers, 0)
            return (
              <article key={member.id} className="overflow-hidden rounded-md border border-[#ded8ce] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`relative flex aspect-square items-center justify-center ${isGold ? 'bg-[#c8102e]' : 'bg-[#1f2326]'}`}>
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/85 bg-white text-xl font-black text-[#c8102e]">{initials(member.name)}</div>
                  )}
                  <span className="absolute left-2 top-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-[#c8102e]">#{index + 1}</span>
                  <span className="absolute bottom-2 right-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-[#1f2326]">{member.sponsoredMembers}/{goldThreshold}</span>
                </div>
                <div className="p-3 text-center">
                  <h3 className="text-sm font-black uppercase leading-tight text-[#e62612]">{member.name}</h3>
                  <p className="mt-0.5 text-xs font-black uppercase text-[#1f2326]">{member.group}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#5f6469]">{member.region} · {member.business}</p>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase text-[#5f6469]">
                      <span className="flex items-center gap-1">
                        {isGold ? (
                          <>GOLD {Array.from({ length: Math.floor(member.sponsoredMembers / goldThreshold) }, (_, i) => <span key={i} className="text-[11px]" style={{ color: '#d4a017' }}>&#9830;</span>)}</>
                        ) : `${remaining} pana la prag`}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#e5dfd5]">
                      <div className={`h-full rounded-full ${isGold ? 'bg-[#c8102e]' : 'bg-[#1f2326]'}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  {member.bniProfileUrl && (
                    <a href={member.bniProfileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-md border border-[#c8102e] px-3 py-1.5 text-xs font-black text-[#c8102e] hover:bg-[#fff1f2]">
                      Profil BNI
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
