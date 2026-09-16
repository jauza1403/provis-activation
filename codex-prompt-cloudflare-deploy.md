# Prompt for Codex — Production Branch + Remove Demo Quick-Fill + Deploy to Cloudflare Workers + Post-Deploy Verification

## Context
This is a request/approval dashboard app with a 3-role RBAC login system already built (superuser, project_user, vendor_user). Before deploying: a dedicated `production` branch needs to be created and the live deployment must be based on that branch, and one leftover UI element needs to be removed. After that, deploy to Cloudflare Workers and verify everything works correctly in production.

---

## Step 1 — Create a `production` Branch and Deploy Live From It

- Create a new branch named `production` (from the current stable/main branch).
- Configure the Cloudflare Workers deployment so the **live/production deployment is built from the `production` branch**, not from `main`/`dev` directly (e.g., set this branch as the production branch in Cloudflare Pages/Workers project settings, or adjust the CI/deploy config accordingly).
- Going forward, future changes should be merged into `production` only when ready to go live — confirm this branch-to-deploy mapping is correctly wired up before proceeding to the next steps.
- Report back the branch name, the deploy config change made, and confirm the live URL is now tied to `production`.

---

## Step 2 — Remove the "Pilih Akun Demo (Quick-Fill)" Panel

**Current state (see attached screenshot):** The login page currently shows a demo/testing helper panel titled "Pilih Akun Demo (Quick-Fill)" that lists all 3 accounts (superuser, projectuser, vendoruser) along with their roles, descriptions, and plaintext passwords (`superuser123`, `projectuser123`, `vendoruser123`), letting anyone quick-fill the login form with one click.

**What to do:**
- Remove this quick-fill demo panel completely from the login page UI.
- Remove any associated component/code (quick-fill buttons, the account list, and any hardcoded credential strings shown in that panel) so no plaintext passwords are exposed on the login screen.
- Confirm no other page or dev/debug route still renders this panel or exposes the same credential list.
- The login page should be left as a clean username/password form only.

---

## Step 3 — Deploy to Cloudflare Workers

- Deploy the application to Cloudflare Workers from the `production` branch.
- Check the build and deployment logs for **any errors or warnings** (build failures, missing environment variables/secrets, bundle size issues, incompatible Node APIs, routing/config errors, etc.) and resolve them before considering the deploy complete.
- Confirm the deployed Worker responds correctly at its production URL (no 500s, no blank/broken pages).

---

## Step 4 — Post-Deploy Verification: 3 Accounts

- Confirm all 3 accounts can log in successfully on the **deployed/production** instance (not just locally):
  - `superuser` / `superuser123` → role `superuser`
  - `projectuser` / `projectuser123` → role `project_user`
  - `vendoruser` / `vendoruser123` → role `vendor_user`
- For each account, confirm the correct role-based dashboard/permissions load (per the existing permission matrix — e.g., vendor user should not see "Approval Urgent"/"Pending"/"Selesai" tabs, project user should not be able to approve urgent requests, superuser has full access).
- Report back if any account fails to log in or lands on the wrong role's view.

---

## Step 5 — Database Readiness Check

- Confirm the production database is properly connected and ready (correct connection string/binding for the Cloudflare environment, e.g., D1, or whichever DB is in use).
- Confirm required tables/schema exist and any pending migrations have been applied.
- Confirm the 3 seed accounts and their roles actually exist as records in the production database (not just working because of a fallback/hardcoded auth path).
- Report the database status clearly: connected/not connected, schema up to date/not, seed data present/not.

---

## Deliverables Expected
1. `production` branch created, with the live Cloudflare Workers deployment confirmed to build from it.
2. Confirmation the demo quick-fill panel and its exposed credentials are fully removed from the login page.
3. Successful Cloudflare Workers deployment with no unresolved errors.
4. Verification report confirming all 3 accounts log in and land on their correct role-based views in production.
5. Database readiness report (connection, schema/migrations, seed data present).
