# Gold Club Refocus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` the Gold Club Members showcase (direction B, 4-up compact, editable profiles), move the recommendation campaign to `/campanie`, and let recommendations target formed groups too.

**Architecture:** Next.js 14 App Router. Swap page contents between `/` and `/campanie`. Add server-file persistence for Gold performers (`data/performers.json` + `/api/performers`), mirroring the existing directors pattern. Add an admin "Membri Gold" CRUD tab. No DB; localStorage stays for groups/domains/recommendations.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind. No test framework — verify with `npx tsc --noEmit`, `npm run build`, and manual browser checks.

---

### Task 1: Header renames + drop left brand label

**Files:**
- Modify: `components/Navigation.tsx`

- [ ] **Step 1: Drop "| Gold Members Romania" in the brand link**

Replace the brand `Link` content (keep only BNI):

```tsx
<Link href="/" className="flex items-center gap-3">
  <span className="text-[#c8102e] font-black text-3xl tracking-tight">BNI</span>
</Link>
```

- [ ] **Step 2: Rename desktop nav links + add /campanie**

The desktop link list becomes (order: Gold club members, Campanie, Trimite recomandare, Domenii cautate, Regulament):

```tsx
<Link href="/" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
  Gold club members
</Link>
<Link href="/campanie" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
  Campanie &quot;6 to Gold&quot;
</Link>
<Link href="/recommendations" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
  Trimite recomandare
</Link>
<Link href="/domains" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
  Domenii cautate
</Link>
<Link href="/regulament" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
  Regulament
</Link>
```

- [ ] **Step 3: Mirror the same links in the mobile menu block** (`md:hidden pb-4 space-y-1`), using `block` classes already present and the same labels/hrefs (Gold club members `/`, Campanie `/campanie`, Trimite recomandare, Domenii cautate, Regulament). Keep the existing "Acces platforma" + "MyBni" entries.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/Navigation.tsx
git commit -m "feat(nav): rebrand left to BNI only, rename links, add /campanie"
```

---

### Task 2: Move campaign to /campanie, make / the Gold members page

The current `app/page.tsx` (campaign) moves to `app/campanie/page.tsx`. The current `app/members/page.tsx` (Gold members) becomes the new `app/page.tsx`. `/members` redirects to `/`.

**Files:**
- Create: `app/campanie/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/members/page.tsx`

- [ ] **Step 1: Create `app/campanie/page.tsx`** with the FULL current contents of `app/page.tsx` (verbatim), changing only the default export function name from `Home` to `Campanie`. Keep `'use client'` and all imports.

- [ ] **Step 2: Replace `app/page.tsx`** with the FULL current contents of `app/members/page.tsx`, renaming the export function from `Members` to `Home`. (This is the server component Gold members page; it will be redesigned in Task 5.)

- [ ] **Step 3: Replace `app/members/page.tsx` with a redirect:**

```tsx
import { redirect } from 'next/navigation'

export default function MembersRedirect() {
  redirect('/')
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds; routes `/`, `/campanie`, `/members` all present.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/campanie/page.tsx app/members/page.tsx
git commit -m "feat: move campaign to /campanie, Gold members to /"
```

---

### Task 3: Add `bniProfileUrl` to GoldPerformer + seed values

**Files:**
- Modify: `lib/bni-data.ts:69-77` (interface), `lib/bni-data.ts:313-322` (seed)

- [ ] **Step 1: Add the optional field to the interface**

```ts
export interface GoldPerformer {
  id: number
  name: string
  group: string
  region: string
  business: string
  sponsoredMembers: number
  competitionRecommendations: number
  bniProfileUrl?: string
}
```

- [ ] **Step 2: Add `bniProfileUrl` to each seed entry** in `initialGoldPerformers`. Use the BNI Connect public profile root as a placeholder for each (editable later in admin):

```ts
{ id: 1, name: 'Angela Cojocaru', group: 'BNI ZEPPELIN TIMIS', region: 'Timis', business: 'Consultanta business', sponsoredMembers: 8, competitionRecommendations: 2, bniProfileUrl: 'https://www.bniconnectglobal.com' },
```

Repeat the `bniProfileUrl: 'https://www.bniconnectglobal.com'` field for all 8 entries (ids 1–8).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/bni-data.ts
git commit -m "feat(data): add bniProfileUrl to GoldPerformer"
```

---

### Task 4: `/api/performers` server persistence route

**Files:**
- Create: `app/api/performers/route.ts`
- Modify: `.gitignore` (confirm `/data/` ignored — already added in a prior session; verify only)

- [ ] **Step 1: Create the route** (mirror `app/api/directors/route.ts`):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { initialGoldPerformers } from '@/lib/bni-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'performers.json')

async function readPerformers() {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : initialGoldPerformers
  } catch {
    return initialGoldPerformers
  }
}

export async function GET() {
  const performers = await readPerformers()
  return NextResponse.json({ success: true, data: performers })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Expected an array of performers' }, { status: 400 })
    }
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save performers' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: build lists `ƒ /api/performers`.

- [ ] **Step 3: Commit**

```bash
git add app/api/performers/route.ts
git commit -m "feat(api): server persistence for Gold performers"
```

---

### Task 5: Home `/` redesign — direction B (hero + podium + 4-up compact cards)

Convert the home page (currently the moved members server component) into a client component that loads performers from `/api/performers`, renders a bold red hero with a top-3 podium, then a 4-per-row compact grid with a "Profil BNI" link.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Make it a client component with server-loaded performers**

Top of file:

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  GoldPerformer,
  getGoldProgress,
  getGoldStatus,
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
  // ...render below
}
```

- [ ] **Step 2: Render the bold hero + podium**

Inside the returned JSX, first section:

```tsx
<main className="min-h-screen bg-[#f7f6f3] text-[#1f2326]">
  <section className="bg-gradient-to-br from-[#ed1c24] via-[#d71920] to-[#9f1239] text-white">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/85">BNI ROMANIA</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Gold Club Members</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded bg-white px-3 py-1 text-sm font-black text-[#c8102e]">{goldMembers.length} membri Gold</span>
        <span className="rounded bg-white/20 px-3 py-1 text-sm font-black">Prag: {goldThreshold} membri adusi</span>
      </div>

      <div className="mt-8 grid grid-cols-3 items-end gap-3 sm:max-w-xl">
        {[podium[1], podium[0], podium[2]].map((member, i) => {
          if (!member) return <div key={i} />
          const height = member === podium[0] ? 'h-28' : member === podium[1] ? 'h-20' : 'h-16'
          const place = member === podium[0] ? 1 : member === podium[1] ? 2 : 3
          return (
            <div key={member.id} className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-white text-lg font-black text-[#c8102e]">{initials(member.name)}</div>
              <p className="mt-2 text-center text-xs font-black leading-tight">{member.name}</p>
              <div className={`mt-2 flex ${height} w-full items-start justify-center rounded-t-md bg-white/15 pt-2 text-2xl font-black`}>{place}</div>
            </div>
          )
        })}
      </div>
    </div>
  </section>
```

- [ ] **Step 3: Render the 4-up compact grid + Profil BNI link**

```tsx
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
            <div className={`relative flex h-24 items-center justify-center ${isGold ? 'bg-[#c8102e]' : 'bg-[#1f2326]'}`}>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/85 bg-white text-xl font-black text-[#c8102e]">{initials(member.name)}</div>
              <span className="absolute left-2 top-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-[#c8102e]">#{index + 1}</span>
              <span className="absolute bottom-2 right-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-[#1f2326]">{member.sponsoredMembers}/{goldThreshold}</span>
            </div>
            <div className="p-3 text-center">
              <h3 className="text-sm font-black uppercase leading-tight text-[#e62612]">{member.name}</h3>
              <p className="mt-0.5 text-xs font-black uppercase text-[#1f2326]">{member.group}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#5f6469]">{member.region} · {member.business}</p>
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase text-[#5f6469]">
                  <span>{isGold ? 'GOLD' : `${remaining} pana la prag`}</span>
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
```

(`getGoldStatus` import may be unused now — remove it from the import list if so, to avoid the ESLint "assigned but never used" build failure.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds, no ESLint unused-var error.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): direction B Gold Club showcase with podium + 4-up cards"
```

---

### Task 6: Admin "Membri Gold" tab — server load/save + CRUD with scope

Add a tab that lists performers, supports add/edit/delete, persists via `/api/performers`, and scopes editing (admin = all; executive = members in their regions/groups).

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Add state + server load/save (mirror the directors pattern)**

Near the other admin state, add:

```tsx
const [performers, setPerformers] = useState<GoldPerformer[]>(initialGoldPerformers)
const [performersLoadedFromServer, setPerformersLoadedFromServer] = useState(false)
```

Mount effect:

```tsx
useEffect(() => {
  fetch('/api/performers')
    .then((res) => res.json())
    .then((json) => {
      if (json?.success && Array.isArray(json.data)) setPerformers(json.data)
    })
    .catch(() => {})
    .finally(() => setPerformersLoadedFromServer(true))
}, [])
```

Save effect (only after first server load, same guard directors use):

```tsx
useEffect(() => {
  if (!performersLoadedFromServer) return
  fetch('/api/performers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(performers),
  }).catch(() => {})
}, [performers, performersLoadedFromServer])
```

Add `GoldPerformer`, `initialGoldPerformers`, `getGroupsForDirector`, `getDirectorRegions` to the `@/lib/bni-data` import if not already present.

- [ ] **Step 2: Compute the editable subset by scope**

`currentDirector` is the logged-in director (already tracked by the admin login). Add:

```tsx
const editablePerformers = useMemo(() => {
  if (!currentDirector) return [] as GoldPerformer[]
  if (currentDirector.role === 'admin') return performers
  const regions = getDirectorRegions(currentDirector)
  const groupNames = getGroupsForDirector(currentDirector, groups).map((g) => g.name)
  return performers.filter((p) => regions.includes(p.region) || groupNames.includes(p.group))
}, [performers, currentDirector, groups])
```

- [ ] **Step 3: Add the tab button + panel**

Register a `'performers'` tab key alongside the existing tabs (label "Membri Gold"). In its panel render a table of `editablePerformers` with inline edit fields for `name`, `group`, `region`, `business`, `sponsoredMembers` (number), `bniProfileUrl`, plus Add and Delete. Persist by updating `performers` state (the save effect writes through). Example handlers:

```tsx
function addPerformer() {
  const nextId = performers.reduce((max, p) => Math.max(max, p.id), 0) + 1
  setPerformers((prev) => [...prev, { id: nextId, name: 'Membru nou', group: '', region: '', business: '', sponsoredMembers: 0, competitionRecommendations: 0, bniProfileUrl: '' }])
}

function updatePerformer(id: number, patch: Partial<GoldPerformer>) {
  setPerformers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
}

function deletePerformer(id: number) {
  if (!window.confirm('Stergi acest membru?')) return
  setPerformers((prev) => prev.filter((p) => p.id !== id))
}
```

The panel (match existing admin table styling):

```tsx
<div className="space-y-3">
  <div className="flex justify-end">
    <button onClick={addPerformer} className="rounded-md bg-[#c8102e] px-4 py-2 text-sm font-black text-white hover:bg-[#9f1239]">+ Adauga membru</button>
  </div>
  {editablePerformers.map((p) => (
    <div key={p.id} className="grid gap-2 rounded-md border border-[#ded8ce] bg-white p-3 sm:grid-cols-2 lg:grid-cols-3">
      <input value={p.name} onChange={(e) => updatePerformer(p.id, { name: e.target.value })} placeholder="Nume" className="rounded border border-[#ded8ce] px-2 py-1 text-sm" />
      <input value={p.group} onChange={(e) => updatePerformer(p.id, { group: e.target.value })} placeholder="Grup" className="rounded border border-[#ded8ce] px-2 py-1 text-sm" />
      <input value={p.region} onChange={(e) => updatePerformer(p.id, { region: e.target.value })} placeholder="Regiune" className="rounded border border-[#ded8ce] px-2 py-1 text-sm" />
      <input value={p.business} onChange={(e) => updatePerformer(p.id, { business: e.target.value })} placeholder="Business" className="rounded border border-[#ded8ce] px-2 py-1 text-sm" />
      <input type="number" value={p.sponsoredMembers} onChange={(e) => updatePerformer(p.id, { sponsoredMembers: Number(e.target.value) })} placeholder="Membri adusi" className="rounded border border-[#ded8ce] px-2 py-1 text-sm" />
      <input value={p.bniProfileUrl || ''} onChange={(e) => updatePerformer(p.id, { bniProfileUrl: e.target.value })} placeholder="Link profil BNI" className="rounded border border-[#ded8ce] px-2 py-1 text-sm" />
      <button onClick={() => deletePerformer(p.id)} className="rounded border border-[#c8102e] px-2 py-1 text-xs font-black text-[#c8102e] hover:bg-[#fff1f2]">Sterge</button>
    </div>
  ))}
</div>
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): Membri Gold tab with server persistence + scope"
```

---

### Task 7: Unify /campanie hero + crossover CTA

**Files:**
- Modify: `app/campanie/page.tsx`

- [ ] **Step 1: Add the shared eyebrow + crossover CTA to the campaign hero**

In the first `<section>` hero of `app/campanie/page.tsx`, add an eyebrow label above the H1 and a CTA linking back to Gold members:

```tsx
<p className="text-xs font-black uppercase tracking-[0.2em] text-white/85">CAMPANIE</p>
<h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">6 to Gold</h1>
```

And after the existing subtitle paragraphs, inside the hero container:

```tsx
<Link href="/" className="mt-5 inline-block rounded-md bg-white px-4 py-2 text-sm font-black text-[#c8102e] hover:bg-white/90">
  Vezi membrii Gold
</Link>
```

(`Link` is already imported in this file.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/campanie/page.tsx
git commit -m "feat(campanie): unify hero + crossover CTA to Gold members"
```

---

### Task 8: Recommendations target formed groups too

The recommendation group selector already maps `groups.filter(isGroupActive)` (`app/recommendations/page.tsx:236`), which includes formed groups as long as they are active and present. The gap is data: formed groups need "domenii cautate" entries to be useful targets. Add example priority domains for one formed group and confirm the selector + domains page show them.

**Files:**
- Modify: `lib/bni-data.ts` (`initialPriorityDomains` — add entries for a formed group)
- Verify: `app/recommendations/page.tsx`, `app/domains/page.tsx`

- [ ] **Step 1: Identify a formed group** in `initialGroups` (a group whose `status` indicates launched, e.g. contains "lansat", or `recommendedMembers >= launchTargetMembers`). If none exists in seed, pick an active group and treat it as the example. Note its exact `name`.

- [ ] **Step 2: Add 2–3 open priority domains for that group** to `initialPriorityDomains`, following the existing entry shape:

```ts
{ id: <nextId>, name: 'Contabilitate', status: 'open', group: '<FORMED_GROUP_NAME>' },
{ id: <nextId+1>, name: 'Asigurari', status: 'open', group: '<FORMED_GROUP_NAME>' },
```

Use the next free numeric `id` values (max existing id + 1, +2).

- [ ] **Step 3: Confirm no forming-only filter blocks formed groups.** Grep for status/forming filters in the two pages:

Run: `npx tsc --noEmit`
Then manually verify in the browser (Task 9 deploy) that the formed group appears in the recommendation group dropdown and on `/domains` with its open domains. If a forming-only `.filter` is found in `app/recommendations/page.tsx` or `app/domains/page.tsx`, relax it to include active formed groups.

- [ ] **Step 4: Commit**

```bash
git add lib/bni-data.ts
git commit -m "feat(recommendations): seed domains for a formed group as a target"
```

---

### Task 9: Build, deploy, manual verification

**Files:** none (deploy + verify)

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: success (retry once if Windows file-lock errno -4094 / worker crash).

- [ ] **Step 2: Deploy via curl FTP** (per `memory/bni.md`): upload `.next/` (excluding `cache`) to `$root/.next/`, `.next/static/` to `$root/_next/static/`, write `restart.txt` + `tmp/restart.txt`, verify remote `BUILD_ID` == local.

- [ ] **Step 3: Ask the user to restart NodeJS** (cPanel → Setup Node.js App → Restart) and hard-refresh.

- [ ] **Step 4: Manual checks (live):**
  - Header: left shows only BNI; links Gold club members `/`, Campanie `/campanie`, Trimite recomandare, Domenii cautate, Regulament.
  - `/` shows hero + podium + 4-up compact cards + "Profil BNI" links open the BNI URL.
  - `/campanie` shows the old campaign (map, Top Giveri, clasament, launch seats) + "Vezi membrii Gold" CTA.
  - `/members` redirects to `/`.
  - Admin → Membri Gold: edit a member, confirm it persists after refresh (server-written) and reflects on `/`.
  - Recommendation flow: formed group selectable with its open domains.

---

## Notes
- Server persistence transition: first post-deploy GET returns the seed (file absent) then writes on first admin change — same caveat as directors. Performer edits must be made once in the UI to materialize `data/performers.json`.
- Out of scope (later): photo upload, editing `competitionRecommendations`, password hashing.
