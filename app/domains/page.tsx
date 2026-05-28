'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  DOMAINS_STORAGE_KEY,
  GROUPS_STORAGE_KEY,
  Group,
  PriorityDomain,
  initialGroups,
  initialPriorityDomains,
} from '@/lib/bni-data'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function Domains() {
  const [domains, setDomains] = useState<PriorityDomain[]>(initialPriorityDomains)
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  useEffect(() => {
    const storedDomains = window.localStorage.getItem(DOMAINS_STORAGE_KEY)
    if (storedDomains) {
      try { setDomains(JSON.parse(storedDomains) as PriorityDomain[]) } catch { /* ignore */ }
    }
    const storedGroups = window.localStorage.getItem(GROUPS_STORAGE_KEY)
    if (storedGroups) {
      try { setGroups(JSON.parse(storedGroups) as Group[]) } catch { /* ignore */ }
    }
  }, [])

  const groupedDomains = useMemo(() => {
    const acc: Record<string, PriorityDomain[]> = {}
    domains.forEach((domain) => {
      acc[domain.name] = acc[domain.name] || []
      acc[domain.name].push(domain)
    })
    return acc
  }, [domains])

  const domainRows = useMemo(() =>
    Object.entries(groupedDomains)
      .map(([name, entries]) => ({
        name,
        entries: entries
          .map((entry) => ({ ...entry, groupInfo: groups.find((g) => g.name === entry.group) }))
          .sort((a, b) => a.group.localeCompare(b.group)),
        openCount: entries.filter((e) => e.status === 'open').length,
        recommendedCount: entries.filter((e) => e.status === 'filled').length,
      }))
      .sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name)),
    [groupedDomains, groups]
  )

  const availableLetters = useMemo(() =>
    new Set(domainRows.map((d) => d.name[0]?.toUpperCase()).filter(Boolean)),
    [domainRows]
  )

  const filteredRows = useMemo(() =>
    selectedLetter
      ? domainRows.filter((d) => d.name[0]?.toUpperCase() === selectedLetter)
      : domainRows,
    [domainRows, selectedLetter]
  )

  const totalDomains = domains.length
  const openDomains = domains.filter((d) => d.status === 'open').length
  const recommendedDomains = domains.filter((d) => d.status === 'filled').length

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#1f2326]">
      <section className="border-b border-[#ded8ce] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c8102e]">Domenii in competitie</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Domenii cautate de grupuri</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6469] sm:text-base">
                Aici apar toate domeniile configurate in sistem, indiferent de regiune sau grup.
                Fiecare domeniu arata catre ce grup se poate trimite recomandarea si cine il cauta sa il ocupe.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-[#ded8ce] bg-[#fbfaf8] p-3">
                <p className="text-2xl font-black text-[#c8102e]">{totalDomains}</p>
                <p className="text-[11px] font-black uppercase text-[#5f6469]">configurate</p>
              </div>
              <div className="rounded-md border border-[#ded8ce] bg-[#fbfaf8] p-3">
                <p className="text-2xl font-black text-[#c8102e]">{openDomains}</p>
                <p className="text-[11px] font-black uppercase text-[#5f6469]">cautate</p>
              </div>
              <div className="rounded-md border border-[#ded8ce] bg-[#fbfaf8] p-3">
                <p className="text-2xl font-black text-[#c8102e]">{recommendedDomains}</p>
                <p className="text-[11px] font-black uppercase text-[#5f6469]">recomandate</p>
              </div>
            </div>
          </div>

          {/* Alphabet filter */}
          <div className="mt-6 flex flex-wrap items-center gap-1">
            <button
              onClick={() => setSelectedLetter(null)}
              className={`rounded px-2.5 py-1 text-xs font-black transition ${
                selectedLetter === null
                  ? 'bg-[#c8102e] text-white'
                  : 'bg-[#f0ece6] text-[#5f6469] hover:bg-[#e5dfd5]'
              }`}
            >
              Toate
            </button>
            {ALPHABET.map((letter) => {
              const active = availableLetters.has(letter)
              return (
                <button
                  key={letter}
                  disabled={!active}
                  onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                  className={`rounded px-2.5 py-1 text-xs font-black transition ${
                    !active
                      ? 'cursor-default text-[#c9c3b8]'
                      : selectedLetter === letter
                        ? 'bg-[#c8102e] text-white'
                        : 'bg-[#f0ece6] text-[#1f2326] hover:bg-[#e5dfd5]'
                  }`}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {filteredRows.length === 0 && (
          <p className="text-sm text-[#5f6469]">Niciun domeniu gasit pentru litera selectata.</p>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredRows.map((domain) => (
            <article key={domain.name} className="rounded-lg border border-[#ded8ce] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eee8df] pb-3">
                <div>
                  <h2 className="text-xl font-black text-[#1f2326]">{domain.name}</h2>
                  <p className="mt-1 text-xs font-semibold text-[#5f6469]">
                    {domain.entries.length === 1 ? '1 grup configurat' : `${domain.entries.length} grupuri configurate`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {domain.openCount > 0 && (
                    <span className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-black text-[#c8102e]">
                      {domain.openCount} cauta
                    </span>
                  )}
                  {domain.recommendedCount > 0 && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      {domain.recommendedCount} recomandat
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {domain.entries.map((entry) => (
                  <div key={entry.id} className={`rounded-md border p-3 ${entry.status === 'filled' ? 'border-emerald-200 bg-emerald-50' : 'border-[#ded8ce] bg-[#fbfaf8]'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${entry.status === 'filled' ? 'bg-emerald-500' : 'bg-[#c8102e]'}`} />
                          <p className="font-black text-[#1f2326]">{entry.group}</p>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[#5f6469]">
                          {entry.groupInfo ? `${entry.groupInfo.region}, ${entry.groupInfo.director}` : 'Grup in competitie'}
                        </p>
                        <p className="mt-2 text-sm leading-5 text-[#5f6469]">{entry.description}</p>
                        <p className={`mt-2 text-xs font-black uppercase ${entry.status === 'filled' ? 'text-emerald-700' : 'text-[#c8102e]'}`}>
                          {entry.status === 'filled' ? `Recomandat de: ${entry.filledBy}` : 'Grupul cauta recomandare pentru acest domeniu'}
                        </p>
                      </div>
                      {entry.status === 'open' ? (
                        <Link
                          href={`/recommendations?group=${encodeURIComponent(entry.group)}&domain=${encodeURIComponent(entry.name)}`}
                          className="shrink-0 rounded-md bg-[#c8102e] px-4 py-2 text-center text-sm font-black text-white transition hover:bg-[#9f1239]"
                        >
                          Trimite recomandare
                        </Link>
                      ) : (
                        <span className="shrink-0 rounded-md border border-emerald-200 bg-white px-4 py-2 text-center text-sm font-black text-emerald-700">
                          Domeniu recomandat
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
