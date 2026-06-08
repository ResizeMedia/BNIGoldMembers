# BNI Gold Members Romania — Context proiect

**Stack:** Next.js 14 (Node runtime) + React 18 + TypeScript + Tailwind. Persistenta = localStorage (fara DB).
**Live:** https://bnigoldmembers.resize-media.com · **Repo:** ResizeMedia/BNIGoldMembers · **Workspace:** `C:\CLAUDE\bni`
**Data ultimei sesiuni active:** 2026-06-01

---

## Deploy (FUNCTIONAL, fara SSH/lftp/WSL)

Server cPanel Hosterion. NU exista SSH (port refuzat), NU exista lftp, NU exista WSL. Se foloseste **curl FTP** din PowerShell.

**FTP:** `ftp.resize-media.com` · user `claude@resize-media.com` · pass `Claude123!@#`
**Remote root app:** `/bnigoldmembers.resize-media.com/` (NU public_html)
Serverul are si `.next/` si `_next/static/`. `_next/static` = oglinda lui `.next/static` (server.js serveste static de acolo). BUILD_ID nou la fiecare build → trebuie urcat tot.

**Procedura completa:**
1. `npm run build` (build Windows poate pica tranzitoriu cu errno -4094 file lock pe .next — doar retry)
2. Upload `.next/` (exclus `\cache\`) → `$root/.next/` via curl `-T` cu `--ftp-create-dirs`
3. Upload `.next/static/` → `$root/_next/static/`
4. Verifica BUILD_ID local == remote (`curl $root/.next/BUILD_ID`)
5. Scrie markeri restart: `restart.txt` + `tmp/restart.txt`
6. **Utilizatorul restarteaza manual** NodeJS din cPanel → Software → Setup Node.js App → Restart (eu NU pot restarta)
7. Verifica live cu `curl https://bnigoldmembers.resize-media.com/` — cauta BUILD_ID nou in HTML
8. User face hard-refresh (Ctrl+Shift+R) — cache agresiv

Scriptul curl Up() folosit (PowerShell): walk recursiv fisiere, `$rel = substring relativ`, `curl.exe -s -S --ftp-create-dirs -T $f --user $user ($remoteRoot+$rel)`.

---

## Functionalitati cheie (model date in `lib/bni-data.ts`)

### Harta grupurilor (`app/page.tsx`)
- Titlu: "Harta grupurilor in lansare".
- Imagine `/romania-counties.png` (1124x746 ≈1.5:1) intr-un container `aspect-[4/3]` cu `object-contain` p-2 → imaginea e LETTERBOXED vertical. De-aia coordonatele `top-%` nu corespund centrului vizual al imaginii.
- `mapPositions` = Record judet→`left-[x%] top-[y%]` (valori zecimale, ex `top-[63.3%]`). Calibrate manual de user.
- Tool de calibrare: `C:\CLAUDE\calibrare-harta.html` (self-contained, imagine base64, click+drag bulinele, scoate cod `mapPositions`). Reproduce exact randarea app (4:3, object-contain, p-2). Refoloseste-l daca trebuie recalibrare.
- Buline mici: `h-6 w-6` (butoanele harta).

### Launch Seats checklist (`components/LaunchSeats.tsx`)
Cercuri = locuri pana la lansare. Total per grup = `launchTargetMembers` (min 25).
- **galben** = `group.currentMembers` (membri deja validati manual, in afara procesului)
- **verde** = domenii cu `filledFromRecommendationId` (validate prin recomandare)
- **gri** = `target − galben − verde` (locuri libere)
- Ordine MEREU: galben → verde → gri.
Helper `getLaunchSeats(group, domains)`. Afisat in: admin Domenii, admin Ierarhie, homepage clasament. Buline `h-4 w-4`.
Editare manuala galben = camp "Membri deja validati" (= currentMembers) in editare grup, accesibil consultant lansare + executiv.

### Domenii prioritare (board 6 + replace)
`PriorityDomain` are `inSlots?: boolean` (default true). `getActiveSlotDomains` = domenii grup cu `inSlots !== false`, primele 6.
Buton "Inlocuieste domeniul" pe cardul verde (ocupat) → `inSlots:false` (elibereaza slot, apare "+ Adauga"); domeniul ramane verde in checklist. Revert validare recomandare reseteaza `inSlots:true`.
NU exista concept preFilled per-domeniu (s-a renuntat — galbenul vine din currentMembers).

### Regulament (`app/regulament/page.tsx`)
`RegulationContent` are `periodTitle` + `periodBody`. Banda rosie cu iconita calendar sub titlu. Default: "1 iunie 2026 – 31 august 2026...". Editabil in admin → Regulament. Pagina face merge `{...initialRegulationContent, ...parsed}` → campuri noi apar si pe localStorage vechi.

---

## Directori — persistenta SERVER (fix 2026-06-09)
Directorii + parolele NU mai sunt doar localStorage. Acum sursa de adevar = server.
- Ruta `app/api/directors/route.ts`: GET citeste `data/directors.json` (seed daca lipseste), PUT scrie array. `runtime='nodejs'`, `dynamic='force-dynamic'`. Disk cPanel ESTE writable (confirmat).
- Admin: pe mount face GET → setDirectors; orice schimbare (add/edit/reset parola) face PUT. Fallback la localStorage daca serverul pica.
- Reset parola se propaga acum la TOATE browserele/incognito.
- Login (admin/page.tsx:520) potriveste nume case-insensitive + parola plaintext. Parole inca PLAINTEXT (hashing = TODO daca cere).
- Tranzitie: prima incarcare post-deploy a intors seed (fisier inexistent) → suprascrie reset-urile vechi din localStorage. Reset-urile trebuie refacute o data in UI ca sa se scrie pe server.

## Note importante
- **Date live ≠ seed.** (valabil pt grupuri/domenii/recomandari — acelea inca localStorage) localStorage din browserul adminului difera de `initial*` din cod (ex. screenshot avea Stomatologie ocupata de Mihai Vlad, inexistent in seed). Pentru calcule reale exacte cer export-ul datelor admin.
- Calcul seed (28 grupuri, target 25): total 700 locuri − 222 currentMembers − 3 verzi = **475 locuri libere (gri)**.
- Admin tabs: Sumar, Recomandari, Domenii, Directori, Grupuri, Regulament, Template email, SMTP. SMTP doar Administrator.
- SMTP Hosterion corect: host `lyssa.hosterion.net`, port 465, SSL on, user=mailbox complet, pass=parola mailbox.

## OPEN ITEM — SMTP localhost relay (neconfirmat)
Fix `ignoreTLS` pentru `localhost:25` relay (commit 21d2264, `app/api/send-email/route.ts:78`) deployat. Necesita test dupa restart: host=localhost port=25 SSL=off user/pass goale, fromEmail=contact@resize-media.com → test conexiune + submit recomandare → emailLog "trimis".

## OPEN ITEM — git
Multe schimbari NEPUSE pe git la finalul sesiunii 2026-06-01 (harta, LaunchSeats, regulament, inSlots, titlu harta). Ultimul commit inainte de sesiune: d7778e1. Spec: `docs/superpowers/specs/2026-05-31-launch-seats-checklist-design.md`. Cere user inainte de commit/push.
