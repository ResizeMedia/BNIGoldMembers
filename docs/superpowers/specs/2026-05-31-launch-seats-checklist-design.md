# Launch Seats Checklist — Design

**Date:** 2026-05-31
**Project:** BNI Gold Members Romania

## Goal

Visualize launch progress as a checklist of circles (one per target member seat) under each
group, in both admin views and the public homepage. Let launch/executive directors replace a
filled priority domain among the active 6 without losing the secured seat.

## Data model (`lib/bni-data.ts`)

`PriorityDomain` gains two optional fields (backward-compatible with existing localStorage):

- `preFilled?: boolean` — domain marked "already occupied" at creation. Yellow seat.
  `status:'filled'`, no `filledFromRecommendationId`, `inSlots:false`.
- `inSlots?: boolean` — default `true`. `false` = removed from active 6-card board but still
  counts as a secured seat in the checklist.

### Seat colors
- **green** = domain with `filledFromRecommendationId` (validated via recommendation)
- **yellow** = domain with `preFilled` and no `filledFromRecommendationId`
- **gray** = `launchTargetMembers − green − yellow` (remaining open seats)
- total circles = `max(launchTargetMembers, green + yellow)`

### Helpers
```ts
export type SeatColor = 'green' | 'yellow' | 'gray'
export function getLaunchSeats(group: Group, domains: PriorityDomain[]): SeatColor[]
export function getActiveSlotDomains(group: Group, domains: PriorityDomain[]): PriorityDomain[]
// active board = group domains where inSlots !== false && !preFilled, first 6
```

## Component (`components/LaunchSeats.tsx`)

Presentational. Props: `seats: SeatColor[]`, optional `showLegend`. Renders a wrap row of small
circles (h-5 w-5): green/yellow filled with check icon, gray empty bordered. Optional legend.
Reused in admin + homepage.

## UI changes

1. **Admin add-domain modal** — checkbox "Deja ocupat (membru existent)". When checked →
   `preFilled:true, status:'filled', inSlots:false`.
2. **Admin Domenii card** — board uses `getActiveSlotDomains`. Filled (green) card gets
   "Inlocuieste" button → sets `inSlots:false` (frees slot, domain stays green in checklist).
   X-delete stays only on open domains. `LaunchSeats` rendered below board with legend.
3. **Admin Ierarhie grupuri** — board uses `getActiveSlotDomains`; `LaunchSeats` under each group.
4. **Homepage clasament** — board uses `getActiveSlotDomains`; `LaunchSeats` under each group.

## Edge cases
- Reverting a recommendation validation resets the domain to `status:'open'`, clears
  `filledFromRecommendationId`, and resets `inSlots:true` so it returns to the active board.
- `getRecommendedMemberCount` (counts `status:'filled'`) stays consistent: green + yellow both
  count as members, matching the progress bar.
- Old localStorage records lack the new fields → `inSlots` undefined treated as true, `preFilled`
  undefined as false. No migration needed.
