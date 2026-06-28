# Additive Director Capabilities + Responsible Autocomplete — Design

**Date:** 2026-06-09

## Goal
A director can hold executive scope (regions) AND launch scope (groups) at the same
time (e.g. executive in region A + launch consultant for a group in region B). The
group "Persoana responsabila" field becomes an autocomplete that links the chosen
director as the group's launch consultant.

## Model (`lib/bni-data.ts`)
- Replace `Director.group?: string` with `Director.groups?: string[]` (launch scope).
- Keep `regions?: string[]` (executive scope) and `role` (primary label + admin gate).
- Scope is computed from `regions ∪ groups`, independent of `role`.
- Legacy migration helper `getDirectorGroups(director)`: returns `groups` if present,
  else `[group]` if the old single field is set, else `[]`.
- Seed `initialDirectors`: launch consultants use `groups: [...]`.

## Helpers
- `getGroupsForDirector`: admin → all; else groups where `group.name ∈ getDirectorGroups`
  OR `group.region ∈ getDirectorRegions`.
- `getDirectorGroups(director): string[]` (with legacy fallback).

## Notifications (`/api/notify-recommendation`)
Recipients = directors where `getDirectorGroups` includes the recommendation's group
OR `getDirectorRegions` includes the region. Scope-based (not role-based). Dedupe by email.

## Admin — directors UI
Non-admin directors show BOTH a regions multiselect (executive) and a groups multiselect
(launch), both optional. Admin → "Acces complet". `role` select kept as label. addDirector
and saveEditedDirector persist `regions` + `groups`.

## Admin — group "Persoana responsabila"
- `<input list>` datalist of director names.
- On group save (add/edit), if `director` matches a Director name: ensure the group name
  is in that director's `groups`, and remove it from every other director's `groups`
  (single launch owner per group). Implemented in `addGroup`/`saveEditedGroup`.

## Migration
`data/directors.json` currently holds seed with the old single `group`. `getDirectorGroups`
normalizes on read everywhere (admin + notify route), so no data migration step needed.

## Touch points
bni-data (model, helpers, seed), admin (directors UI, addDirector, saveEditedDirector,
addGroup, saveEditedGroup, visibility), notify route, any `director.group` reads.
