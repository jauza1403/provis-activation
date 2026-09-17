# Reschedule handoff notes

## Current request

Investigate and fix the shared-state problem between PIC Reschedule and Vendor Reschedule, and add a required Reason field to PIC Reschedule.

## Relevant files

- `app/page.tsx` — shared reschedule dialog, mode selection, client state, role-specific labels, and request detail display.
- `app/api/requests/route.ts` — PATCH validation and persistence.
- `db/schema.ts` — activation request columns.
- `lib/auth.ts` — D1 table creation and migration-safe column additions; seeded accounts.

## Findings and current implementation

- Both actions use the same dialog component. The original coupling was that both actions read and wrote the same active `activationDate`/`timeSlot`, so one could overwrite the other.
- `rescheduleReason` is the vendor reason; `picRescheduleReason` is the PIC reason.
- PIC Reschedule is for `superuser`/`project_user`, sets status to `Pending`, and does not require vendor approval.
- Vendor Reschedule is for `vendor_user` on matching vendor requests and sets status to `Reschedule`.
- Both reasons are required and visible in request details.
- Separate latest-value snapshots exist for PIC and Vendor date/time/reason. The active installation schedule remains the single `activation_date`/`time_slot` source of truth.
- There is no automatic email, Outlook redirect, or notification in the reschedule PATCH flow.
- When PIC reschedules, the vendor sees the updated date/time and PIC reason after dashboard refresh/reopen through the shared request record; there is currently no email, Outlook redirect, WhatsApp, popup, or push notification.
- Slot capacity is enforced by the API when date/time changes; the current request is excluded, freeing the old slot and consuming capacity in the new slot.

## Important test blocker

- The CSV includes `VENDOR ASSIGN`; it is a valid vendor account with username `vendorassign-jabojabar` and `jabojabar` scope.
- Vendor PATCH therefore correctly returns `403` because no request matches the account identity.
- Do not bypass this ownership check. Decide whether to assign the demo account to one fake vendor, add a proper request-owner key, or define shared-vendor-account behavior.
- A temporary assignment to `PT Global Mandiri` was reverted. Credentials and roles were not changed.

## Verification

- Local Vendor Reschedule dialog has date, time, required Reason, and Save controls.
- The save attempt reached `PATCH /api/requests` and returned the expected ownership `403`.
- `pnpm.cmd build` passed and `git diff --check` passed.

## Recommended next steps

1. Choose the correct ownership model without weakening role boundaries.
2. Re-login as vendor and submit a matching request end-to-end.
3. Test PIC and Vendor reschedules on one request, confirming independent snapshots/reasons and the latest active schedule.

## Planned later work — do not implement yet

- Add a vendor-facing notification when PIC Provisioning reschedules a request.
- Decide the notification channel: in-app badge/banner, email, WhatsApp, or another approved channel.
- Show clearly that the reschedule was initiated by PIC Provisioning.
- Include the new activation date/time and the PIC-provided reason.
- Decide whether the vendor must acknowledge the notification.
- Add an audit/history entry for the notification and delivery/read state if required.
- Test the notification flow for both New Request and Urgent Request.
- Preserve the existing separation: PIC Reschedule must remain approval-free, and Vendor Reschedule must remain an independent vendor action.

## Spreadsheet sync work — not implemented yet

- User wants every New Request and Urgent Request submission to append to the supplied spreadsheet in the same table/column order.
- Spreadsheet link: `https://docs.google.com/spreadsheets/d/1e_Tjv5bM2gGHfCAbDHMtO3jcMOQ-hSRJYW4bYL97xAo/edit?gid=1251673368`
- Spreadsheet ID: `1e_Tjv5bM2gGHfCAbDHMtO3jcMOQ-hSRJYW4bYL97xAo`.
- Target tab is expected to be `SCHEDULE AKTIVATION`; confirm the tab name for gid `1251673368`.
- Workbook inspection found main tab `SCHEDULE AKTIVATION` with roughly 67 columns, plus `DATA`, `SCHEDULE PIKET`, `Sheet3`, `NOTED`, pivot/supporting tabs, and AutoCrat configuration tabs.
- The workbook has the requested columns including Email Address, Hari, Tanggal Aktivasi, Time Slot Aktivasi, Area/Regional, Vendor, Akses, Bukti Koordinasi, customer PIC, PIC Aktivasi Mitra, PIC Project, Opportunity Number, Customer, Site ID, Subscription ID, Site Name, Work Order, Produk Layanan, Work Type, Bandwidth IX, Bandwidth IIX, and Local Loop.
- The current app persists to Cloudflare D1 through `app/api/requests/route.ts`; it has no Google Sheets integration yet.
- Current form/database do not have all spreadsheet fields. Missing or incomplete examples include Email, customer phone/contact, PIC Aktivasi, Site Name, Bandwidth IX, Bandwidth IIX, Local Loop, and proof-of-coordination.
- Datek POP/RFA columns are partly implemented in the current form but were previously marked out of scope for the new form specification. Leave them blank or keep them deferred unless the scope is explicitly changed.
- Status synchronization is deferred. D1 remains the source of truth; spreadsheet sync should happen after a successful D1 insert.
- Preferred architecture: D1 save first, then Cloudflare Worker calls Google Sheets API and appends one normalized row. Add retry/outbox handling so a temporary Sheets failure does not lose a request.

## Google service-account setup status

- User chose the Cloudflare Worker + Google Sheets API approach instead of Apps Script.
- User was guided to create a Google Cloud project/service account, enable Google Sheets API, and share the spreadsheet with the service-account email as Editor.
- Do not request or store the JSON key in the repository or chat.
- Still required before implementation/testing: configure Cloudflare secrets for the service-account email, private key, and spreadsheet ID. Suggested names:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
  - `GOOGLE_SHEET_ID`
- The private key must be stored as a Wrangler/Cloudflare secret, never committed.

## Demo data and AIRI account

- Existing local-only idempotent seed script: `scripts/seed-demo-requests.mjs`.
- It generates 46 fake request records covering Regular/Urgent, Pending/approval/completed/active states, all Work Types, all Akses Media values, all Product Types, slots 1–4, Install Switch cases, and varied vendors/PICs.
- The seed script distributes matching company+region requests across the vendor accounts. Rerun locally with:
  `node scripts/seed-demo-requests.mjs`
- New seeded account was added in `lib/auth.ts`:
  - username: `airi`
  - password: `airi123`
  - display/vendor name: `AIRI`
  - role: `vendor_user`
- Existing accounts and roles should not be changed.

## Later checklist

- Configure Wrangler secrets for Google Sheets.
- Confirm the target tab name and exact header mapping against `SCHEDULE AKTIVATION`.
- Decide whether to add all missing form/database fields before sync or append blanks for deferred fields.
- Implement Google Sheets append after successful D1 persistence for both Regular and Urgent submissions.
- Keep status sync deferred until separately requested.
- Reseed local data and verify AIRI sees matching requests after logging in again.
- Test one New Request and one Urgent Request append end-to-end.
- Add retry/error handling and prevent duplicate spreadsheet rows on retries.
- Later, implement vendor notification for PIC reschedules; do not implement that as part of spreadsheet sync unless requested.
