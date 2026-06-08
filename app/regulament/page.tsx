'use client'

import { useEffect, useState } from 'react'
import { REGULATION_STORAGE_KEY, RegulationContent, initialRegulationContent } from '@/lib/bni-data'

export default function RegulationPage() {
  const [content, setContent] = useState<RegulationContent>(initialRegulationContent)

  useEffect(() => {
    const storedContent = window.localStorage.getItem(REGULATION_STORAGE_KEY)
    if (!storedContent) return

    try {
      const parsed = JSON.parse(storedContent) as RegulationContent
      setContent({ ...initialRegulationContent, ...parsed })
    } catch {
      setContent(initialRegulationContent)
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#1f2326]">
      <section className="border-b border-[#ded8ce] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#c8102e]">{content.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{content.title}</h1>
          <p className="mt-4 max-w-3xl text-lg font-semibold text-[#5f6469]">{content.subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[#c8102e]/30 bg-[#c8102e] p-5 text-white">
          <div className="flex items-center gap-3">
            <svg className="h-7 w-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-black uppercase tracking-wide">{content.periodTitle}</h2>
          </div>
          <p className="whitespace-pre-wrap text-base font-semibold leading-6 text-white/95">{content.periodBody}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <article className="rounded-lg border border-[#ded8ce] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-[#1f2326]">{content.objectiveTitle}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#5f6469]">{content.objectiveBody}</p>
        </article>

        <article className="rounded-lg border border-[#ded8ce] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-[#1f2326]">{content.scoringTitle}</h2>
          <div className="mt-3 space-y-2 text-sm font-semibold text-[#5f6469]">
            {content.scoringRows.map((row) => (
              <p key={row}>{row}</p>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[#ded8ce] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-[#1f2326]">{content.prizesTitle}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#5f6469]">{content.prizesBody}</p>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#c8102e]/25 bg-[#fff1f2] p-5">
          <h2 className="text-xl font-black text-[#1f2326]">{content.transparencyTitle}</h2>
          <p className="mt-3 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-[#5f6469]">{content.transparencyBody}</p>
        </div>
      </section>
    </main>
  )
}
