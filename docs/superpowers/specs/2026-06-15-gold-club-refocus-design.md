# Site Refocus: Gold Club Front + Editable Profiles + Expanded Recommendations — Design

**Date:** 2026-06-15

## Goal
Refocus the public site on the **Gold Club Members**. The homepage `/` becomes the
Gold Club showcase (was `/members`); the recommendation campaign moves to `/campanie`
(was `/`). Executives/Admins can edit member profiles. Recommendations now target both
forming AND already-formed groups. Visual language = direction **B (bold competition)**,
applied consistently across pages.

## Navigation / header (`components/Navigation.tsx`)
- Left brand: drop `| Gold Members Romania`, keep only **BNI**.
- Links: **Gold club members** (`/`) · **Campanie "6 to Gold"** (`/campanie`) ·
  Trimite recomandare (`/recommendations`) · Domenii cautate (`/domains`) · Regulament.
- Top red utility bar + Login membri dropdown unchanged.

## Routing move
- `/` → Gold Club Members showcase (content currently in `app/members/page.tsx`).
- `/campanie` → campaign (content currently in `app/page.tsx`: hero, Top Giveri, Harta,
  Clasament grupuri, Launch seats, Grupuri lansate aside, leaderboard modal).
- `/members` → redirect to `/` (or remove; nav no longer points there).
- Internal links and crossover CTAs point to the new routes.

## Home `/` — Gold Club Members (direction B)
- **Hero**: red gradient (`from-[#ed1c24] via-[#d71920] to-[#9f1239]`), eyebrow
  "BNI ROMANIA", title "Gold Club Members", stat badges (nr. Gold, prag).
- **Podium top 3** by `sponsoredMembers` inside/under hero (1 center tallest, 2 left, 3 right).
- **Grid 4 per row** (`lg:grid-cols-4`), compact cards. No big "Performerii GOLD" page title.
- Card (compact): avatar initials, name, group, `region · business`, `sponsoredMembers/goldThreshold`,
  thin progress bar, **"Profil BNI"** button linking to `bniProfileUrl` (external, new tab) —
  replaces the old contact/competition note. Keep `#rank` and Gold/`remaining` badge.
- Crossover CTA: "Vezi Campania 6 to Gold" → `/campanie`.

## `/campanie` — "6 to Gold"
- Move current home content verbatim; keep behavior (region filter, leaderboard modal,
  launch seats). Unify hero to the shared pattern. Crossover CTA: "Vezi membrii Gold" → `/`.

## Data model (`lib/bni-data.ts`)
- `GoldPerformer` gains `bniProfileUrl?: string`.
- Editable fields: `name`, `group`, `region`, `business`, `sponsoredMembers`, `bniProfileUrl`.
  `competitionRecommendations` stays from seed/computed (not in edit form for now).
- Add `PERFORMERS_STORAGE_KEY` parity is not needed — performers become server-sourced.

## Profiles: server persistence + admin CRUD
- New route `app/api/performers/route.ts`: GET reads `data/performers.json` (seed from
  `initialGoldPerformers` if missing), PUT writes the array. `runtime='nodejs'`,
  `dynamic='force-dynamic'`. Mirrors `app/api/directors/route.ts`.
- Home `/` reads performers from `/api/performers` (server source of truth), falls back
  to `initialGoldPerformers`.
- Admin: new tab **"Membri Gold"** — list + add + edit + delete, persists via PUT
  (load-from-server + save-on-change pattern, same as directors).
- **Edit scope**: Admin → all members. Executive → members whose `group`/`region` is in
  the director's scope (`getGroupsForDirector` / `getDirectorRegions`). Non-scoped roles: none.

## Expanded recommendations (forming + formed groups)
- Recommendation target selector includes **formed** groups, not only forming ones.
  Formed groups also carry `priorityDomains` ("domenii cautate"); flow otherwise unchanged
  (select group → select domain → submit → notify launch consultant + executive).
- Audit where groups are filtered to forming-only (`isGroupActive`, status checks) in
  `app/recommendations/page.tsx`, `app/domains/page.tsx`, admin — relax so formed groups
  appear as valid recommendation/domain targets.
- Campaign `/campanie` clasament stays forming-focused; formed groups remain in the
  "Grupuri lansate" aside. Only the recommendation/domain surfaces expand.

## Visual consistency
- Shared hero pattern (eyebrow + bold title + red underline) across `/`, `/campanie`,
  `/members`-derived, regulament where sensible.
- Consistent card radius/border/shadow, button styles, equal section spacing.

## Touch points
`components/Navigation.tsx`, `app/page.tsx` (→ campaign, also new `/campanie`),
`app/members/page.tsx` (→ home `/`), `lib/bni-data.ts` (model + helper),
`app/api/performers/route.ts` (new), `app/admin/page.tsx` (Membri Gold tab + persistence),
`app/recommendations/page.tsx` + `app/domains/page.tsx` (formed groups).

## Out of scope (later)
Photo upload (initials for now), editing `competitionRecommendations`, password hashing,
formed-group launch metrics on the clasament.
