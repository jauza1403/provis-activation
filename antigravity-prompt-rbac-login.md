# Prompt for Antigravity — Role-Based Login System (3 User Types)

## Context
Build a login page and role-based access control (RBAC) system for a request/approval dashboard application. There are exactly **3 user roles**, each with a fixed, distinct set of permissions. Access control must be enforced both on the UI (hide/disable) and on the backend/API (reject unauthorized actions) — never rely on frontend hiding alone.

## User Roles & Permissions

### 1. Superuser
- Full access to everything in the web app.
- Can create, view, edit, delete any request.
- Can **approve/accept urgent requests**.
- Can view all statuses: Approval Urgent, Pending, and Selesai (Completed).
- Can manage other users/accounts (if user management exists).

### 2. Project User
- Same access as Superuser **except**:
  - **Cannot approve/accept urgent requests.** This action must be hidden or disabled for this role, and blocked server-side even if attempted directly via API.
- Otherwise can create, view, edit requests, and see all statuses (Approval Urgent, Pending, Selesai).

### 3. Vendor User
- Restricted, view-mostly role:
  - **Can create** a new request.
  - **Can create** an urgent request.
  - **Can view** their own data on the dashboard only (no access to other vendors' data).
  - **Cannot edit** anything — no edit/delete actions available anywhere in the UI.
  - **Cannot approve/accept** urgent requests.
  - **Must not see** the following dashboard sections/tabs at all (fully hidden, not just disabled): "Approval Urgent", "Pending", and "Selesai" status views/lists. Vendor should only see their own submitted requests and their current status in a simplified view (e.g., "My Requests").

## Permission Matrix

| Action / View                          | Superuser | Project User | Vendor User |
|-----------------------------------------|:---------:|:------------:|:-----------:|
| Login                                    | ✅        | ✅           | ✅          |
| Create new request                       | ✅        | ✅           | ✅          |
| Create urgent request                    | ✅        | ✅           | ✅          |
| Edit / update request                    | ✅        | ✅           | ❌          |
| Delete request                           | ✅        | ✅           | ❌          |
| Approve / accept urgent request          | ✅        | ❌           | ❌          |
| View "Approval Urgent" section           | ✅        | ✅           | ❌ (hidden) |
| View "Pending" section                   | ✅        | ✅           | ❌ (hidden) |
| View "Selesai / Completed" section       | ✅        | ✅           | ❌ (hidden) |
| View own submitted requests / status     | ✅        | ✅           | ✅ (own data only) |
| Manage users/accounts                    | ✅        | ❌           | ❌          |

## Login Page Requirements
- Single login page supporting all 3 roles via one credential form (username/email + password).
- After authentication, redirect user to a role-specific dashboard view based on their assigned role.
- Store role in session/JWT/auth token and use it to gate both routes (frontend) and endpoints (backend).
- Seed/provide 3 test accounts, one per role, for initial testing:
  - `superuser` (role: superuser)
  - `projectuser` (role: project_user)
  - `vendoruser` (role: vendor_user)
- Include basic auth safeguards: password hashing, session/token expiry, and protection against accessing another role's routes by direct URL/API call.

## Technical Notes for Implementation
- Enforce role checks at the **API/backend level**, not just by hiding UI elements — a Vendor User must receive a 403/Forbidden if they attempt an edit/approve action directly via API.
- Vendor User's data queries must be scoped/filtered to only their own records (by vendor ID or equivalent), never all records.
- Navigation menus, buttons, and dashboard tabs should be conditionally rendered based on role — Vendor User's UI should not include hidden sections in the DOM/response at all where feasible, not just via CSS hiding.
- Suggest using a middleware/guard pattern (e.g., role-based route guards) so permission logic is centralized and reusable rather than duplicated per page.

## Deliverables Expected
1. Login page (UI + auth logic).
2. Role-based dashboard views (3 variants or 1 dashboard with conditional rendering).
3. Backend role/permission enforcement (middleware or equivalent).
4. Seed data / test accounts for the 3 roles.
