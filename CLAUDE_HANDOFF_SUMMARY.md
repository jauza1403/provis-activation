# Claude Handoff Summary

Read this file together with `CLAUDE_HANDOFF_CHECKLIST.md` and `HANDOFF_RESCHEDULE_NOTES.md` before changing the project.

## Current project state

- Project: iForte Provisioning Activation Portal.
- Local development URL: `http://localhost:5173/`.
- The local server was last started successfully with elevated permission because the normal Vite process hit Windows `spawn EPERM` while resolving React dependencies.
- Do not reset or overwrite unrelated working-tree changes. The worktree was already dirty before the latest UX/data work.
- The current app persists requests to Cloudflare D1. Google Sheets sync is not implemented yet.

## UX critique and implemented UX work

The interface was reviewed as an operations/admin dashboard. Main findings:

- Dashboard action hierarchy was unclear; urgent, pending, approval, reschedule, and overdue work were not visually prioritized.
- Sidebar navigation was dense and role-specific destinations were difficult to scan.
- The request form is long and has substantial cognitive load.
- Icon-only row actions depend heavily on hover/tooltips.
- Contextual help and status explanations are limited.

Implemented:

1. Dashboard priority panel

- Added a `Prioritas operasional` panel above the dashboard metrics.
- It shows role-aware cards for urgent approval, pending/PIC updates, reschedules, and overdue activations.
- Cards navigate directly to the relevant queue.
- Overdue work can be filtered in the dashboard and the filter can be cleared.
- Changes are in `app/page.tsx` and `app/globals.css`.

2. Sidebar information architecture

- Grouped navigation into `WORKSPACE`, `FOLLOW-UP`, and `HISTORY`.
- Preserved all role-based visibility and notification counts.
- Shortened reschedule labels to `Reschedules` / `My Reschedules`.
- Mobile navigation remains a compact responsive grid.
- Changes are in `app/page.tsx` and `app/globals.css`.

3. Multi-step form attempt was rolled back

- A multi-step request form and review screen were prototyped, but the source Google Form could not be inspected because it redirected to Google sign-in.
- Per the user's rollback instruction, only those multi-step changes were removed.
- Do not reintroduce a multi-step form until the source form's required-field contract is confirmed.

## Data-master field additions

The user supplied the source field order and required data concepts:

- Header/order: Email, Hari, Tgl Aktivasi, Time Slot Aktivasi, Area/Regional, Vendor, Akses, Bukti Koordinasi dengan Customer.
- Customer/technical data: Nama & No Telp, PIC Aktivasi, PIC Project, Opportunity Number, Nama Customer, Site ID, Subscription ID, Site Name/Location Name, Work Order, Product/Service, Work Type, Bandwidth IX, Bandwidth IIX, Local Loop.
- POP/network data: Port Customer, Port POP OTB, Type Kabel, New Panjang Kabel, End to End, POP ID, POP Name, Alokasi Port Switch POP, Perangkat yang Akan Dipasang, IP Customer, Build 1:8 / Build 1:4 / Existing 1:4 / Existing 1:8 for Metro/GPON, Port ODP/FAT, Kode ODP/FAT, Koordinat FAT, Redaman ODP/FAT.

Implemented data-model and form additions:

- `email`
- `activationDay` (derived automatically from `activationDate`; not user-entered)
- `customerContact`
- `activationPic`
- `siteName`
- `bandwidthIx`
- `bandwidthIix`
- `localLoop`
- `coordinationProof`
- `switchPopPortAllocation`
- `customerIp`
- `buildType`
- `odpFatPort`
- `fatCoordinates`

Compatibility behavior:

- Existing fields and payload keys were preserved.
- Existing `bandwidth` remains in the model and is derived on new submissions from `bandwidthIx` + `bandwidthIix`.
- `activationDay` is derived server-side from the activation date.
- RFA/POP additions are required for normal RFA access media and cleared for `Interkoneksi` / `Existing Link`.
- `buildType` is required for `METRO` and `GPON` when RFA applies.
- Existing `fatOdpCode`, `customerPort`, `popOtbPort`, `cableLength`, `cableType`, `popId`, `popName`, `endToEnd`, and `attenuation` remain active.

Files changed for this data work:

- `app/page.tsx` — types, defaults, edit mapping, and form inputs.
- `app/api/requests/route.ts` — required-field validation, normalization, derived fields, create/update persistence.
- `db/schema.ts` — Drizzle schema columns with safe defaults.
- `lib/auth.ts` — table creation and migration-safe `ALTER TABLE` additions.

## Validation completed

- `pnpm lint` passes.
- `node_modules/.bin/tsc.cmd --noEmit` passes.
- Production/dev Vite build previously failed in the restricted environment with `spawn EPERM`; do not interpret that as a TypeScript failure.
- Localhost responded with HTTP 200 at `/login` after starting the server with elevated permission.
- No Google Sheet rows were modified.

## Spreadsheet and sync status

The supplied Data Master spreadsheet is:

`https://docs.google.com/spreadsheets/d/1AztzSZFJjWw8cBNuOJItHp_N1ZmaBlaSH5mEnuCm1AY/edit`

The workbook was readable in-browser and contains multiple tabs, including `Regular Project Report_Lani`; the Google Form link required sign-in and could not be inspected directly.

Important:

- Google Sheets append/sync is still not implemented.
- No exact column-order mapping has been committed yet.
- The current additions are intended to cover the field list supplied by the user, but must still be checked against the target sync tab before production use.
- Before enabling sync, confirm the target tab and exact headers, then create one normalized mapping from app fields to sheet columns.
- If a test row has a missing column, wrong order, wrong derived value, or wrong required-field behavior, stop and roll back the field additions before continuing.
- Preferred future architecture remains D1-first persistence, then Sheets append, with retry/outbox and duplicate protection.

## Recommended next work for Claude

1. Inspect the current diff and preserve unrelated user changes.
2. Confirm the target Data Master tab and exact header row.
3. Compare the implemented app fields against every target sheet column.
4. Decide how deferred columns are represented before sync; do not silently invent values.
5. Implement a normalized D1-to-Sheets mapping only after the comparison is complete.
6. Add D1-first append, retry/outbox handling, and duplicate protection for Regular and Urgent requests.
7. Test one Regular and one Urgent request against the spreadsheet before production use.

## Rollback instruction

If the Data Master comparison shows a mismatch, tell the user clearly that rollback is recommended, stop spreadsheet-sync work, and revert only the newly added data fields/migrations. Keep the previously completed dashboard priority and sidebar navigation improvements unless the user asks for a broader rollback.
