import {
  getGoldProgress,
  getGoldStatus,
  goldThreshold,
  initialGoldPerformers,
} from '@/lib/bni-data'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Members() {
  const performers = [...initialGoldPerformers].sort(
    (a, b) => b.sponsoredMembers - a.sponsoredMembers || b.competitionRecommendations - a.competitionRecommendations || a.name.localeCompare(b.name)
  )

  const goldMembers = performers.filter((member) => member.sponsoredMembers >= goldThreshold)
  const closeMembers = performers.filter((member) => member.sponsoredMembers < goldThreshold)

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#1f2326]">
      <section className="border-b border-[#ded8ce] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c8102e]">BNI Gold Members Romania</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Performerii GOLD</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6469] sm:text-base">
                Membrii care au adus cel putin {goldThreshold} membri in organizatie si cei care sunt aproape de pragul Gold.
                Concursul ii ajuta sa treaca mai rapid peste acest prag prin recomandari relevante.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
              <div className="rounded-md border border-[#ded8ce] bg-[#fbfaf8] p-3">
                <p className="text-2xl font-black text-[#c8102e]">{goldMembers.length}</p>
                <p className="text-[11px] font-black uppercase text-[#5f6469]">Gold Club</p>
              </div>
              <div className="rounded-md border border-[#ded8ce] bg-[#fbfaf8] p-3">
                <p className="text-2xl font-black text-[#c8102e]">{closeMembers.length}</p>
                <p className="text-[11px] font-black uppercase text-[#5f6469]">Aproape</p>
              </div>
              <div className="rounded-md border border-[#ded8ce] bg-[#fbfaf8] p-3">
                <p className="text-2xl font-black text-[#c8102e]">{goldThreshold}</p>
                <p className="text-[11px] font-black uppercase text-[#5f6469]">Prag membri</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-xl font-black uppercase text-[#e62612] sm:text-2xl">Gold Club Members in BNI Romania</h2>
          <span className="h-1 w-24 bg-[#c8102e]" />
        </div>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {performers.map((member, index) => {
            const progress = getGoldProgress(member)
            const isGold = member.sponsoredMembers >= goldThreshold
            const remaining = Math.max(goldThreshold - member.sponsoredMembers, 0)

            return (
              <article key={member.id} className="group">
                <div className="relative overflow-hidden rounded-sm border border-[#ded8ce] bg-white shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-md">
                  <div className={`flex aspect-[4/3] items-center justify-center ${isGold ? 'bg-[#c8102e]' : 'bg-[#1f2326]'}`}>
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/85 bg-white text-4xl font-black text-[#c8102e] shadow-lg">
                      {initials(member.name)}
                    </div>
                    <div className="absolute left-3 top-3 rounded bg-white px-2 py-1 text-xs font-black text-[#c8102e]">#{index + 1}</div>
                    <div className="absolute bottom-3 right-3 rounded bg-white px-2 py-1 text-xs font-black text-[#1f2326]">
                      {member.sponsoredMembers}/{goldThreshold}
                    </div>
                  </div>

                  <div className="p-4 text-center">
                    <h3 className="text-lg font-black uppercase leading-tight text-[#e62612]">{member.name}</h3>
                    <p className="mt-1 text-sm font-black uppercase text-[#1f2326]">{member.group}</p>
                    <p className="mt-1 text-xs font-semibold text-[#5f6469]">{member.region} · {member.business}</p>

                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-[11px] font-black uppercase text-[#5f6469]">
                        <span>{getGoldStatus(member)}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e5dfd5]" role="progressbar" aria-label={`Progres Gold pentru ${member.name}`} aria-valuemin={0} aria-valuemax={goldThreshold} aria-valuenow={member.sponsoredMembers}>
                        <div className={`h-full rounded-full ${isGold ? 'bg-[#c8102e]' : 'bg-[#1f2326]'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                      <div className="rounded-md bg-[#f7f6f3] p-3">
                        <p className="text-xl font-black">{member.sponsoredMembers}</p>
                        <p className="text-[10px] font-black uppercase text-[#5f6469]">membri adusi</p>
                      </div>
                      <div className="rounded-md bg-[#f7f6f3] p-3">
                        <p className="text-xl font-black">{isGold ? 'GOLD' : remaining}</p>
                        <p className="text-[10px] font-black uppercase text-[#5f6469]">{isGold ? 'status activ' : 'pana la prag'}</p>
                      </div>
                    </div>

                    {member.competitionRecommendations > 0 && (
                      <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-[#c8102e]">
                        +{member.competitionRecommendations} recomandari active in competitie
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
