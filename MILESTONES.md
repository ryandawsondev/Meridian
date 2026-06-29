# MILESTONES.md

Milestones are ordered by dependency. Complete each milestone fully before moving to the next. Each milestone has a clear definition of done.

---

## Milestone 1 — Project Scaffolding

Set up the full project foundation. Nothing functional yet, but everything in place for development.

### Tasks

- [ ] Initialise Vite + React + TypeScript project
- [ ] Configure TypeScript strict mode (`tsconfig.json`)
- [ ] Install and configure Tailwind CSS v3
- [ ] Install and configure shadcn/ui (init, set theme to minimal/neutral)
- [ ] Install ESLint with `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@typescript-eslint`
- [ ] Install and configure Prettier with Tailwind plugin
- [ ] Install Vitest and React Testing Library
- [ ] Install MSW and set up mock service worker in `src/test/mocks/`
- [ ] Install Zustand, TanStack Query, React Router v6, Zod
- [ ] Install and configure `vite-plugin-pwa` with correct manifest (standalone display, icons, theme colour)
- [ ] Set up folder structure as defined in CLAUDE.md
- [ ] Create `.env.local` template with all required env var keys (no values)
- [ ] Create GitHub Actions workflow: lint → type-check → test → build → deploy to `gh-pages`
- [ ] Confirm deployment to GitHub Pages with a placeholder index page

### Definition of Done

- `npm run dev` starts without errors
- `npm run lint` passes
- `npm run type-check` passes
- `npm run test` runs (zero tests, zero failures)
- `npm run build` produces a valid `dist/`
- GitHub Actions pipeline runs green on push to `main`
- App is reachable on GitHub Pages URL

---

## Milestone 2 — Auth

Implement Google OAuth via Supabase so the user can sign in and the app holds a valid Google Calendar API token.

### Tasks

- [ ] Create Supabase project and connect JS client (`src/lib/supabase.ts`)
- [ ] Enable Google OAuth provider in Supabase dashboard
- [ ] Configure Google OAuth to request `calendar.events` scope at sign-in
- [ ] Set up redirect URI in Google Cloud Console pointing to GitHub Pages URL and localhost
- [ ] Implement sign-in page with Google login button (shadcn/ui `Button`)
- [ ] Implement auth callback handler in React Router
- [ ] Store and retrieve session from Supabase (auto-refresh handled by Supabase client)
- [ ] Create `src/lib/auth.ts` with `getSession`, `signIn`, `signOut` helpers
- [ ] Protect all app routes — redirect unauthenticated users to sign-in
- [ ] Write tests for auth helpers using MSW

### Definition of Done

- User can sign in with Google
- After sign-in, a valid Google OAuth token with `calendar.events` scope is accessible
- Unauthenticated users are redirected to sign-in
- Signing out clears the session and redirects to sign-in
- Auth state persists across page refreshes

---

## Milestone 3 — Supabase Schema & Data Layer

Define the database schema and implement all data access hooks.

### Tasks

- [ ] Create Supabase tables:
  - `day_presets` (`id`, `user_id`, `name`, `created_at`, `updated_at`)
  - `blocks` (`id`, `day_preset_id`, `title`, `start_time`, `end_time`, `colour`, `is_variable`, `notes`, `order`)
  - `week_presets` (`id`, `user_id`, `name`, `created_at`, `updated_at`)
  - `week_preset_days` (`id`, `week_preset_id`, `day_of_week`, `day_preset_id`)
  - `user_settings` (`user_id`, `default_week_preset_id`, `preferred_view`)
- [ ] Enable Row Level Security (RLS) on all tables — users can only access their own rows
- [ ] Define all Zod schemas in `src/schemas/index.ts`
- [ ] Derive TypeScript types from Zod schemas in `src/types/index.ts`
- [ ] Implement `usePresets` hook — CRUD for day presets and week presets
- [ ] Implement `useBlocks` hook — CRUD for blocks within a day preset
- [ ] Implement `useUserSettings` hook — read and update user settings
- [ ] Write MSW handlers for all Supabase endpoints
- [ ] Write tests for all hooks

### Definition of Done

- All tables exist in Supabase with RLS enforced
- All Zod schemas and TypeScript types are defined
- All hooks are tested with MSW mocks
- No direct Supabase calls exist outside of hooks

---

## Milestone 4 — Preset Builder

Allow the user to create, edit, and delete day presets and week presets.

### Tasks

- [ ] Build `PresetsPage` with tabs: "Day Presets" and "Week Presets"
- [ ] Day preset list: display all user's day presets, with edit and delete actions
- [ ] Day preset editor:
  - [ ] Name field
  - [ ] Block list with drag-to-reorder (or manual up/down if drag-drop is complex at this stage)
  - [ ] Add block form: title, start time, end time, colour picker, is variable toggle, notes
  - [ ] Edit and delete individual blocks
  - [ ] Validation via Zod — no overlapping blocks, end time must be after start time
- [ ] Week preset list: display all user's week presets, with edit and delete actions
- [ ] Week preset editor:
  - [ ] Name field
  - [ ] 7-day grid: assign a day preset to each day (optional — days can be empty)
  - [ ] Day presets are selected from the existing day preset library
- [ ] All mutations use `usePresets` and `useBlocks` hooks with TanStack Query invalidation
- [ ] Unsaved changes tracked in Zustand — warn user before navigating away
- [ ] Write component tests for preset builder forms

### Definition of Done

- User can create, edit, and delete day presets with blocks
- User can create, edit, and delete week presets composed of day presets
- Validation prevents invalid block configurations
- All changes persist to Supabase

---

## Milestone 5 — Sunday Planning Flow

The core weekly workflow: pick a preset, fill in variable blocks, optionally split them, confirm.

### Tasks

- [ ] Build `PlanningPage` as a stepped flow:
  - [ ] Step 1: Pick a week preset (or start from blank)
  - [ ] Step 2: Select the target week (defaults to the coming week)
  - [ ] Step 3: For each variable block across the week, fill in title + notes, with optional sub-tasks
  - [ ] Step 4: Review summary before proceeding to preview
- [ ] Sub-task support on variable blocks:
  - [ ] Toggle to expand a variable block into sub-tasks
  - [ ] Add/remove sub-tasks with title and notes
  - [ ] Sub-tasks are informational — they become event description text in Google Calendar, not separate events
- [ ] Planning session state held entirely in Zustand (ephemeral — cleared on publish or cancel)
- [ ] Validate all filled blocks before allowing progression to preview
- [ ] Write tests for planning flow state logic

### Definition of Done

- User can complete the full planning flow from preset selection to filled variable blocks
- Sub-tasks are optional and can be added to any variable block
- Session state is held in Zustand and cleared on completion or cancellation
- Validation prevents proceeding with unfilled required blocks

---

## Milestone 6 — Week Preview

Visual preview of the planned week before publishing to Google Calendar.

### Tasks

- [ ] Build `PreviewPage` showing the full planned week
- [ ] Implement three view modes, each with grid and list layout options:
  - [ ] **Day view** — vertical timeline, CSS Grid, blocks sized by duration
  - [ ] **Week view** — 7-column horizontal grid, blocks per column
  - [ ] **List view** — blocks as cards grouped by day
- [ ] View mode and layout preference persisted in Zustand
- [ ] View toggle UI (tabs or segmented control using shadcn/ui)
- [ ] Blocks rendered with user-defined colours (inline styles)
- [ ] Variable blocks show their filled-in title and notes
- [ ] Sub-tasks shown collapsed under their parent block, expandable on tap
- [ ] Edit a block inline from preview (title, notes, sub-tasks) — updates Zustand session state
- [ ] "Publish" button to proceed to Google Calendar publish
- [ ] "Back" button returns to planning flow with session state preserved
- [ ] Write component tests for each view mode

### Definition of Done

- All three view modes render correctly across mobile and desktop
- User-defined colours are applied correctly
- Inline editing works and updates session state
- Publish and back navigation work correctly

---

## Milestone 7 — Google Calendar Integration

Publish the planned week to Google Calendar and handle post-publish editing.

### Tasks

- [ ] Create `src/lib/googleCalendar.ts` with helpers:
  - [ ] `createEvent(token, event)` — POST to Google Calendar API
  - [ ] `updateEvent(token, eventId, event)` — PATCH to Google Calendar API
  - [ ] `deleteEvent(token, eventId)` — DELETE from Google Calendar API
  - [ ] `getEventsForWeek(token, weekStart, weekEnd)` — GET events in range
- [ ] On publish: create all events for the week in Google Calendar
  - [ ] Map blocks to Google Calendar events (title, description with notes/sub-tasks, start datetime, end datetime)
  - [ ] Store the published Google Calendar event IDs in Supabase against the week (needed for post-publish editing)
  - [ ] Show progress indicator during publish (can be slow for a full week of events)
  - [ ] Handle partial failures gracefully — report which events failed
- [ ] Post-publish editing:
  - [ ] Load a published week's events from Google Calendar via `getEventsForWeek`
  - [ ] Allow editing individual events (title, notes)
  - [ ] "Update event" — pushes change directly to Google Calendar immediately
  - [ ] "Save for next publish" — holds the change in Zustand for the next weekly publish
- [ ] Write tests for all Google Calendar helpers using MSW

### Definition of Done

- Publishing creates all events in Google Calendar correctly
- Event descriptions include notes and sub-tasks formatted readably
- Post-publish editing updates individual events in Google Calendar
- All Google Calendar helpers are tested with MSW mocks

---

## Milestone 8 — History

Surface past weeks from Google Calendar within the app.

### Tasks

- [ ] Build `HistoryPage` showing past published weeks
- [ ] Fetch past events from Google Calendar using `getEventsForWeek` for previous week ranges
- [ ] Display in list view by default, with option to switch to week/day view
- [ ] Pagination or infinite scroll — load one month at a time going backwards
- [ ] Tapping a past week shows the full event list in read-only mode
- [ ] Write tests for history data fetching

### Definition of Done

- Past weeks are visible in the app derived from Google Calendar
- History is read-only
- Pagination works correctly

---

## Milestone 9 — Polish & PWA

Final pass on mobile UX, PWA install behaviour, and production readiness.

### Tasks

- [ ] Audit all screens on mobile (375px viewport) — fix any layout issues
- [ ] Implement mobile bottom navigation bar for main sections (Planning, Presets, History)
- [ ] Confirm "Add to Home Screen" works on iOS Safari — app opens in standalone mode
- [ ] Offline support: presets readable offline (TanStack Query cache); publishing requires network with clear error state
- [ ] Loading and error states on all async operations
- [ ] Empty states on all list screens (no presets yet, no history yet)
- [ ] Confirm GitHub Actions pipeline is fully green
- [ ] Review and tighten all ESLint rules
- [ ] Final accessibility pass: keyboard navigation, focus management, ARIA labels on icon buttons

### Definition of Done

- App is fully usable on iOS Safari as a PWA
- All loading, error, and empty states are handled
- CI/CD pipeline is green
- App passes basic accessibility checks

---

## Future Milestones (Out of Scope for Now)

- Multi-user support with shared presets
- Drag-and-drop block reordering in the preset builder
- Notifications / reminders via the Web Push API
- Integration with calendars other than Google Calendar
- Native iOS/Android app
