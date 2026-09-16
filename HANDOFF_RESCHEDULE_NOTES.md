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

- The seeded `vendoruser` account has `vendorName: ""`, while demo requests use varied vendor names.
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
