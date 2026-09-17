# Claude handoff checklist

Use this file as the current project handoff. Items marked `[x]` are completed or verified; `[ ]` are follow-up tasks and have not been implemented.

## Completed application work

- [x] Shared New Request/Urgent Request form retained; urgent cutoff and urgent-approval logic were preserved.
- [x] `Jadwal aktivasi`/timeslot display was changed to `Time` while the underlying `timeSlot` key was preserved.
- [x] `Pekerjaan` was changed to required `Work Type` dropdown with the specified options. Existing drafts remain loadable; required validation applies to new submissions.
- [x] Akses Media options were expanded and the duplicate `METRO` entry was removed.
- [x] Service Type display label was changed to `Product Type` and its old options were replaced with the requested exact list. The underlying `serviceType` key remains unchanged.
- [x] Pending Request search was added with debounced client-side filtering.
- [x] PIC Provisioning capacity rule remains: each PIC is visible but disabled at 7 active assignments. The exact counted statuses should be re-confirmed before changing it.
- [x] Timeslot capacity/advance-opening behavior was reverted after it interfered with the date picker. Do not re-add that feature unless explicitly requested.

## Reschedule separation

- [x] PIC Reschedule and Vendor Reschedule are separate modes in the shared UI.
- [x] PIC Reschedule is restricted to `superuser`/`project_user`, directly updates the active request schedule, and does not require vendor approval.
- [x] Vendor Reschedule is restricted to `vendor_user` for its own matching request and uses its own date/time/reason snapshot.
- [x] PIC Reason is required and stored as `picRescheduleReason`; vendor reason remains `rescheduleReason`.
- [x] Both modes ultimately update the request's active `activationDate`/`timeSlot`; the separate snapshot fields preserve the latest reason/date/time for each side.
- [x] There is no automatic email, Outlook redirect, or notification in the reschedule PATCH flow. Dashboard-click Outlook behavior must remain separate.
- [x] Known limitation: PIC reschedule currently has no vendor email/push/in-app notification; the vendor sees the changed schedule/reason after refresh/detail reopen.

## Vendor accounts and region scoping

- [x] Vendor accounts were expanded to per-company/per-region accounts using `regionScope` values `jabo`, `jabojabar`, and `regional`.
- [x] Vendor request visibility and Vendor Reschedule ownership checks match both vendor identity and region scope.
- [x] `VENDOR ASSIGN` is a real PT/vendor and is included as `vendorassign-jabojabar`; it must not be skipped.
- [x] The standalone test account `airi`/`airi123` was superseded by CSV-defined accounts such as `airi-jabo` and `airi-regional`; do not recreate it unless explicitly requested.
- [x] Vendor profile card now displays the region, e.g. `Region: JABO`, `Region: JABO/JABAR`, or `Region: REGIONAL`.
- [x] Fixed session parsing so `regionScope` is retained in the logged-in user payload. Without this, the card could not display the region.
- [ ] Re-test region isolation for at least three companies with both Jabo and Regional accounts; previous smoke testing showed an unresolved possibility of cross-region leakage.
- [ ] Resolve the `VENDOR ASSIGN` demo ownership test case without weakening the vendor ownership check.

## Demo data and Excel export

- [x] Idempotent local demo request seed exists at `scripts/seed-demo-requests.mjs`.
- [x] Demo data covers New/Urgent requests, work types, media values, product types, slots, statuses, vendors, regions, and Install Switch cases.
- [x] Local seed previously completed with 46 stable demo rows. Run from the project root with `node scripts/seed-demo-requests.mjs`.
- [x] Account workbook was created at `outputs/vendor-accounts-20260917/vendor-accounts.xlsx` with 46 account rows and the supplied username/password/company/region/role fields.
- [ ] Do not put the account workbook or plaintext passwords into a public repository.

## Spreadsheet sync — future work

- [ ] Confirm the Google Sheet tab for gid `1251673368` is `SCHEDULE AKTIVATION` and finalize exact header mapping.
- [ ] Add missing form/database fields needed by the spreadsheet, or explicitly define blank/deferred columns. Datek POP and status synchronization remain out of scope unless requested.
- [ ] Implement D1-first persistence, then append one row to Google Sheets for both New and Urgent submissions.
- [ ] Add retry/outbox or equivalent handling so a Sheets failure does not lose a D1 request.
- [ ] Add duplicate protection for retries.
- [ ] Configure Cloudflare secrets; never commit the Google service-account private key:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
  - `GOOGLE_SHEET_ID`
- [ ] Test one New Request and one Urgent Request from submission through spreadsheet append.

## Known verification notes

- [x] Localhost was restarted successfully at `http://localhost:5173/` after resolving the stale dev-server process.
- [x] Browser verification showed `Airi / VENDOR USER / Region: JABO`.
- [x] `npx tsc --noEmit` passed after the session-region fix.
- [x] `git diff --check` passed for the latest UI/session change.
- [ ] Run the production-equivalent build again when the Windows Vite `spawn EPERM` environment issue is available with the required permissions.

## Suggested order for Claude

1. Verify current git status and do not overwrite unrelated user changes.
2. Re-test vendor region isolation with real matching demo requests.
3. Fix/complete demo ownership assignment for `VENDOR ASSIGN` if business behavior is confirmed.
4. Implement and test Google Sheets sync only after exact column mapping is confirmed.
5. Treat vendor notification for PIC reschedules as a separate future feature.
