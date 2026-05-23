# UI Redesign Plan — Match docs/design prototype

## Context

The `docs/design/` folder contains a complete interactive prototype (`index.html` + JSX screens) defining the target visual design for the Admin Web App. The current app has functional data/routing but plain, unbranded styling (hardcoded Slate palette, no CSS tokens, minimal layout).

This plan updates the UI screen-by-screen to match the design prototype while:
- Preserving all existing API routes, auth flows, and routing structure
- Staying within the CSS Modules constraint (one `.module.css` per component)
- Using CSS custom properties (tokens) in a shared `globals.css` so modules can reference them
- Only building what has API backing; using stub/empty states for future features

---

## Step 1 — Design System Foundation

**Goal:** Establish the CSS token system that every subsequent step depends on.

### Files to create/modify

**`apps/admin/src/app/globals.css`** (create)
- Copy all CSS tokens from `docs/design/styles.css` lines 1–95:
  - Color tokens: `--bg`, `--surface`, `--surface-2`, `--border`, `--border-strong`, `--ink`, `--ink-2`, `--muted`, `--faint`, `--accent`, `--accent-soft`, `--accent-ink`, `--good`, `--good-soft`, `--warn`, `--warn-soft`, `--bad`, `--bad-soft`, `--chrome`, `--chrome-ink`, `--chrome-ink-2`
  - Spacing/radius tokens: `--row-h`, `--pad`, `--pad-sm`, `--r-sm`, `--r`, `--r-lg`
  - Typography tokens: `--sans`, `--serif`, `--mono`
- Base reset: `*, html, body` styles
- Typography defaults: `body`, `h1`–`h3`, `a`, `button` base styles
- DO NOT include component classes here — those go in CSS Modules

**`apps/admin/src/app/layout.tsx`** (modify)
- Import `./globals.css`
- Add `next/font/google` font loading for Newsreader (serif) and Geist (sans, already default in Next.js 14+)
- Apply font CSS variables to `<html>` element

**Verify:** Run `pnpm dev:admin`, open browser — body should use the warm off-white background (`#f4efe5`).

---

## Step 2 — App Shell (Topbar + Sidebar)

**Goal:** Replace the current plain dark nav with the design's chrome topbar + structured sidebar.

### Files to modify

**`apps/admin/src/components/AppLayout.tsx`**
- **Topbar** (ref: `docs/design/styles.css` lines 102–163, `docs/design/components.jsx` Topbar function):
  - Brand: small italic "C" mark + "Compliance Tracker" in serif
  - Global search bar (decorative — just the input element, no functionality yet)
  - Right: environment badge (green dot + "production"), logout button styled as `tb-icon`
- **Sidebar** (ref: `docs/design/styles.css` lines 188–250, `docs/design/components.jsx` Sidebar function):
  - Section label "Workspace" (eyebrow style)
  - Nav items: Dashboard, Locations, Users (with icons, active state)
  - Section label "Programs"
  - Nav items: Roles (with icon)
  - Footer: avatar initials + name + role from session/auth context
  - Active item: `accent-soft` background + left accent bar
- **Main content area**: `padding: 22px 28px 60px`, max-width 1480px

**`apps/admin/src/components/AppLayout.module.css`** (full rewrite)
- Styles for: `.shell`, `.topbar`, `.brand`, `.brandMark`, `.tbSearch`, `.tbRight`, `.tbIcon`, `.tbAvatar`
- `.sidebar`, `.sbSection`, `.sbItem`, `.sbItemActive`, `.sbFoot`
- `.main`
- Reference design tokens via CSS vars (e.g., `background: var(--chrome)`)

**Nav icons:** Use simple inline SVG elements — extract the relevant icon paths from `docs/design/components.jsx` (ICONS object, look in the script for the actual SVG paths — they're standard Lucide-style icons).

**Active state detection:** Use Next.js `usePathname()` hook in a `'use client'` wrapper component for the sidebar nav items. The topbar can remain a server component.

**Verify:** All 4 nav links work, active item highlighted, layout matches design.

---

## Step 3 — Shared UI Components

**Goal:** Build reusable primitives used across all screens. These avoid duplicating styles.

### Files to create

**`apps/admin/src/components/ui/Pill.tsx`** + **`Pill.module.css`**
- Props: `kind?: 'good' | 'warn' | 'bad' | 'info'`, `dot?: boolean`, `children`
- Ref: `docs/design/styles.css` lines 299–319

**`apps/admin/src/components/ui/PageHead.tsx`** + **`PageHead.module.css`**
- Props: `title`, `sub?`, `crumbs?`, `actions?`
- Ref: `docs/design/styles.css` lines 256–263, `docs/design/components.jsx` PageHead function

**`apps/admin/src/components/ui/Card.tsx`** + **`Card.module.css`**
- Renders `.card`, `.card-hd`, `.card-body` pattern
- Props: `header?` (title + meta/actions), `flush?` (no padding on body)
- Ref: `docs/design/styles.css` lines 321–336

**Note on buttons:** Rather than a Button component, define shared button styles in each module that needs them — buttons are always custom-contextual in this app (Link buttons, form submits, etc).

**Verify:** Import and render each component on the dashboard — visually compare to prototype.

---

## Step 4 — Dashboard Screen

**Goal:** Replace the "Welcome" placeholder with a layout-complete dashboard.

**Current file:** `apps/admin/src/app/page.tsx` — currently just `<AppLayout><h1>Welcome</h1></AppLayout>`

### Files to modify

**`apps/admin/src/app/page.tsx`**
- PageHead: title "Compliance overview", sub "Your workspace"
- KPI strip card with 4 metric boxes: structure/layout only, values hardcoded as `—` or `0` with "No data yet" sub-labels (no API backing yet)
  - Compliance score, Open findings, Audits this month, Locations at risk
- Body: Two-column grid (2fr 1fr):
  - Left: "Upcoming audits" card — empty state "No audits scheduled"
  - Right stack: "Findings by severity" + "Region scorecard" — empty states
- Below: "Recent activity" card — empty state "No recent activity"

**`apps/admin/src/app/page.module.css`** (create)
- `.kpiRow` (4-column grid), `.kpi`, `.kpiLabel`, `.kpiValue`, `.kpiSub`
- `.grid` (2fr 1fr), `.stack`
- References: `docs/design/styles.css` lines 381–391

**Verify:** Dashboard renders with layout matching the prototype; no errors.

---

## Step 5 — Locations List Screen

**Goal:** Redesign the locations table to match the design's rich table layout.

### Files to modify

**`apps/admin/src/app/locations/LocationListClient.tsx`**
- Add PageHead: title "Locations", sub from count, actions: "New location" button (primary)
- Tools row: search input, spacer, count display
- Table columns matching available API data (`{id, name, createdAt}`):
  - Name (bold), Created date
  - Status: hardcode as Pill `kind="info"` with "Active" (no status field in API yet — note as future work)
- Row click → navigate to `/locations/{id}` (existing behavior)
- Empty state: styled card with message

**`apps/admin/src/app/locations/page.module.css`** (rewrite)
- `.toolsRow`, `.search`, `.tbl` table styles using design tokens
- `.pageHead`, `.pageActions`
- Remove old `.page`, `.header`, `.title`, `.newButton` etc.

**Note:** Columns for Region/Type, Compliance Score, Open Findings, Owner, Next Audit require API changes — mark as out-of-scope for this step. The table will render Name + Created + Status(stub).

**Verify:** Table renders with new styles; New location link works; row click opens detail.

---

## Step 6 — Location Detail Screen

**Goal:** Apply the card-based layout to location detail/edit pages.

### Files to modify

**`apps/admin/src/app/locations/[id]/page.tsx`** (currently uses `LocationDetail` component)
**`apps/admin/src/components/LocationDetail.tsx`** + **`LocationDetail.module.css`**
- PageHead with breadcrumb: Locations → {name}, actions: Edit + Delete buttons
- Two-column grid (2fr 1fr):
  - Left: "Details" card showing `id`, `name`, `createdAt` as detail rows
  - Right: "Manage" card with Edit and Archive (danger) buttons — existing functionality
- Edit modal: keep existing form, re-style to match `.modal` pattern from design
- Delete confirmation: keep existing confirm UI, re-style

**Ref:** `docs/design/screens/locations.jsx` LocationDetailScreen, lines 123–338

**Verify:** Detail page renders; edit form opens/submits; delete confirm works.

---

## Step 7 — Users List Screen

**Goal:** Redesign the users table with avatar display, status pills, role badges.

### Files to modify

**`apps/admin/src/app/users/UserListClient.tsx`**
- PageHead: title "Users", sub from counts (`{total} accounts · {active} active · {pending} invited`), actions: "Invite user" button (primary)
- Tools row: search input (filter by email client-side), spacer, count display
- Table columns matching API (`{id, email, status, roles[]}`):
  - Avatar (initials from email, color derived from email hash) + email + name-col
  - Roles: first role name or "No roles" muted
  - Status: `Pill` with `kind` mapped: `active→good`, `pending→info`
- Row click → `/users/{id}`

**`apps/admin/src/app/users/page.module.css`** (rewrite)
- Same table pattern as locations

**Verify:** Users table renders; invite link works; row click opens detail.

---

## Step 8 — Roles Screen

**Goal:** Redesign roles page with the two-panel layout (list + detail/matrix).

### Files to modify

**`apps/admin/src/app/roles/RoleListClient.tsx`**
- PageHead: title "Roles & permissions", actions: "New role" button
- Two-column grid (320px fixed | 1fr):
  - Left: Card listing roles — each row shows color dot, name, member count, description, scope tag; selected item gets accent-soft background + accent left border
  - Right stack:
    - Selected role overview card: name, desc, member count stat
    - Permissions matrix card: real permissions from API, checkmarks per role (needs all roles data)
    - Members card: users with this role (already has data from `/api/users`)

**`apps/admin/src/app/roles/page.module.css`** (rewrite)

**Verify:** Roles list renders; selecting a role updates right panel; permissions matrix shows.

---

## Step 9 — Login Page

**Goal:** Apply design tokens to the login page to match the warm palette.

### Files to modify

**`apps/admin/src/app/login/login.module.css`**
- Update hardcoded colors to use CSS vars
- Background: `var(--bg)`, card: `var(--surface)`, borders: `var(--border)`
- Buttons: match `.btn.primary` style from design

**Verify:** Login page matches design palette; form submits successfully.

---

## Execution Order

Work one step at a time. Each step ends with a visual check in the browser before moving on.

1. Design System Foundation (globals.css + layout.tsx) — enables all other steps
2. App Shell — visible on every page
3. Shared Components — needed by screens
4. Dashboard — low risk, no API changes
5. Locations List → Location Detail → Users List → Roles → Login

---

## Fonts

- **Sans:** Geist — built into Next.js 14+ via `next/font/local`, no import needed if using the default
- **Serif:** Newsreader — add via `next/font/google`: `Newsreader({ subsets: ['latin'], weight: ['400', '500'] })`
- Apply both as CSS variables on `<html>`: `style={{ '--sans': sans.style.fontFamily, '--serif': serif.style.fontFamily }}`

---

## Future work (out of scope for this plan)

These require schema/API changes before the UI can reflect them:
- Location: status, compliance score, region/type, owner, next audit date
- Location: open findings list, audit history timeline, documents
- User: display name, last active timestamp, MFA status, location count
- Dashboard: real KPI data endpoint
- Sidebar: item counts (locations, users, roles)
