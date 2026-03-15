# Auth Contract

## Overview
The auth layer uses three guard functions with separated responsibilities: `redirectForPage`, `requireAuthUser`, and `requireRole`. This separation prevents overlapping redirects, reduces guard duplication, and makes it clear which guard owns each route.

## Function Contract

| Function | File | Owns | Pages it covers | What it does if check fails |
|---|---|---|---|---|
| `redirectForPage(page, user)` | `src/auth/authService.js` | Public-entry redirect policy | `login.html` (called there via `app.js`) | Returns a redirect path (`courses.html`, `admin.html`), then `app.js` executes `window.location.replace(...)` |
| `requireAuthUser({ redirectTo })` | `src/auth/authGuard.js` | Auth gate (logged-in required) | `courses.html`, `booking.html` (via page renderers) | Redirects to `redirectTo` (default `login.html`) using `window.location.href`, then returns `null` |
| `requireRole(role, { redirectTo })` | `src/auth/authGuard.js` | Role gate + auth gate | `admin.html` (via admin renderer) | If not logged in: redirect `login.html` (through internal `requireAuth`). If wrong role: redirect to `redirectTo` (default `courses.html`). Returns `null` |

## Page Guard Map

- `index.html`
  - Primary guard: none
  - Why: Public landing page. All users are allowed. No redirect logic applies.
- `login.html`
  - Primary guard: `redirectForPage`
  - Why: Public login route that should not stay open for already-authenticated users.
- `courses.html`
  - Primary guard: `requireAuthUser`
  - Why: Protected route that needs auth only.
- `booking.html`
  - Primary guard: `requireAuthUser`
  - Why: Protected route that needs auth only.
- `admin.html`
  - Primary guard: `requireRole("teacher")`
  - Why: Protected route that needs teacher role.

## What `redirectForPage` does and does not do

`redirectForPage` runs only for `login.html` in `src/api/app.js`.
It must not be used as the primary guard for protected pages (`courses.html`, `booking.html`, `admin.html`), because those pages are guarded by `requireAuthUser`/`requireRole`.

## Path Format Rule

All redirect paths use relative format without leading slash: `login.html`, `courses.html`, `admin.html`, `booking.html`.
Correct: `"login.html"`  
Incorrect: `"/login.html"`

## What to do when adding a new page

1. Decide whether the page is **public** or **protected**.
2. If protected, decide whether it needs **auth only** or **role gating**.
3. Use the correct function:
   - Public entry route: `redirectForPage`
   - Protected (auth only): `requireAuthUser`
   - Protected (role required): `requireRole`
4. Add the guard call in the correct place:
   - Public entry routing in `src/api/app.js`
   - Protected route guard in that page renderer/module
5. Update `redirectForPage` only if the new page is a public entry page with public-entry redirect rules.

## What not to do

- Do not run `redirectForPage` globally for every page.
- Do not stack multiple primary guards on the same page without a clear reason.
- Do not mix path formats (`/login.html` and `login.html`) in redirect logic.
- Do not use `requireAuthUser` for role-protected pages that should use `requireRole`.
- Do not split role policy across multiple places with different outcomes (causes mismatch and redirect loops).
