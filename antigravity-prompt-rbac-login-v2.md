# Prompt for Antigravity — RBAC Login System (Update: Final Credentials + Remove Legacy PIN Modal)

## Context
This is a follow-up to the previous role-based access control (RBAC) spec. Two changes need to be made to the existing/planned implementation:

1. Finalize the 3 login accounts (remove vendor-name scoping from the vendor account).
2. Remove/replace the legacy "Superuser PIN Authorization" modal — it is now **redundant** because Superuser identity is already established through the login/role system, not a separate PIN.

---

## 1. Final Account Credentials

| Field       | Superuser        | Project User        | Vendor User        |
|-------------|-------------------|-----------------------|-----------------------|
| Username    | `superuser`       | `projectuser`         | `vendoruser`          |
| Password    | `superuser123`    | `projectuser123`      | `vendoruser123`       |
| Role        | `superuser`       | `project_user`        | `vendor_user`         |
| Permissions | Full unrestricted access across all portal features. | Full operational access (create, edit, delete, reschedule, mark pending/completed) **except** approving urgent requests. | Can submit regular & urgent requests; view-only dashboard for own submitted data; "Approval Urgent", "Pending", and "Selesai" tabs completely hidden from DOM; edit/delete actions prohibited. |

**Important change:** The Vendor User account is a **single shared account used by all vendors** — do NOT hardcode or scope it to one vendor name (e.g., remove any "PT Global Mandiri" field/binding from the login credential itself). If vendor identity needs to be tracked per request, capture it as a field on the request form itself (e.g., vendor name entered/selected at request-submission time), not as a property of the login account.

---

## 2. Remove the Legacy "Superuser PIN Authorization" Modal

**Current behavior (see attached screenshot):** When approving an urgent request, the app shows a modal titled "Otorisasi Super User" asking the approver to select who is authorizing ("Superuser 1" / "Superuser 2") and enter a separate PIN, before the "Setujui Urgent" (Approve Urgent) button becomes active.

**Why this needs to change:** Now that we have a proper role-based login system, this PIN step is a duplicate/legacy authorization layer left over from before roles existed. The person is already authenticated as `superuser` via login — requiring a second identity check (PIN + picking which superuser) is redundant.

**What to do instead:**
- Remove the PIN modal entirely from the urgent-approval flow.
- The "Setujui Urgent" (Approve Urgent) action should be gated **only** by the logged-in user's role: if `role === superuser`, the button is available and works directly (no modal, no PIN, no "Superuser 1/2" selection).
- If any audit trail previously relied on knowing which of "Superuser 1" / "Superuser 2" approved, replace that with logging the actual authenticated superuser account/username at the time of approval (from the session/token), so accountability is preserved without the extra manual step.
- Confirm this action is still blocked server-side for `project_user` and `vendor_user` roles (per the original permission matrix), even with the modal removed.

---

## Deliverables Expected
1. Updated seed/test accounts matching the table above (no vendor-name field on the vendor account).
2. Urgent-request approval flow simplified to a single role-gated action (no PIN modal).
3. Backend approval endpoint still enforces `superuser`-only access.
4. Confirm audit/log of approvals now records the authenticated username instead of a manually-picked "Superuser 1/2" label.
