# CLAUDE.md

This file provides Claude Code with the full context, architecture, conventions, and constraints for this project. Read it before writing any code.

---

## Project Overview

A mobile-first Progressive Web App (PWA) for weekly time-block planning. The user defines reusable **day presets** (named sequences of time blocks) and composes them into **week presets**. Each Sunday, the user opens the app, picks a week preset, fills in variable blocks (e.g. "Time to Be Productive" → "Ukrainian study"), previews the full week, and publishes directly to Google Calendar.

Google Calendar is the single source of truth for all event history. The app stores only structural data (preset definitions, block configs, user settings) in Supabase. No calendar data is stored locally.

---

## Tech Stack

### Tooling & Build
- **Vite** — build tool and dev server
- **vite-plugin-pwa** — service worker and web manifest generation
- **TypeScript** — strict mode enabled
- **ESLint** — with `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@typescript-eslint`
- **Prettier** — single source of truth for formatting
- **Vitest** — unit and integration tests
- **React Testing Library** — component and interaction tests
- **MSW (Mock Service Worker)** — mock Supabase and Google Calendar API in tests

### Frontend
- **React 18**
- **React Router v6** — client-side routing
- **Tailwind CSS v3** — mobile-first utility classes
- **shadcn/ui** — accessible component primitives (modals, dropdowns, inputs, tabs, popovers)
- **Zustand** — UI state (active view, selected preset, unsaved edits, publish status)
- **TanStack Query v5** — async server state for Supabase and Google Calendar API calls

### Data & Auth
- **Supabase JS client** — preset definitions, day templates, block configs, user settings
- **Supabase Auth with Google OAuth** — single login grants both app access and Google Calendar API scope (`calendar.events`)
- **Google Calendar REST API** — all calendar reads and writes; no local event storage

### Schema & Validation
- **Zod** — schemas for blocks, day presets, week presets, variable block fill-ins, Google Calendar event shapes

### Date & Time
- **Native JS `Date` + `Intl`** — week range calculation, block time arithmetic, Google Calendar event timestamps. No date libraries.

### Hosting & CI/CD
- **GitHub Pages** — static hosting
- **GitHub Actions** — on push to `main`: lint → type-check → test → build → deploy to `gh-pages` branch

---

## Project Structure

```
src/
├── components/
│   ├── ui/               # shadcn/ui generated components (do not edit manually)
│   ├── calendar/         # Timeline, week grid, list view components
│   ├── presets/          # Day preset and week preset builder components
│   ├── planning/         # Sunday planning flow components
│   └── layout/           # App shell, nav, mobile bottom bar
├── pages/
│   ├── PlanningPage.tsx  # Sunday planning flow
│   ├── PresetsPage.tsx   # Manage day and week presets
│   ├── PreviewPage.tsx   # Full week preview before publishing
│   └── HistoryPage.tsx   # Past weeks derived from Google Calendar
├── stores/
│   └── uiStore.ts        # Zustand store for UI state
├── hooks/
│   ├── useGoogleCalendar.ts
│   ├── usePresets.ts
│   └── useWeekRange.ts
├── lib/
│   ├── supabase.ts       # Supabase client init
│   ├── googleCalendar.ts # Google Calendar REST API helpers
│   ├── auth.ts           # Auth helpers
│   └── date.ts           # Native date utilities
├── schemas/
│   └── index.ts          # All Zod schemas
├── types/
│   └── index.ts          # Derived TypeScript types from Zod schemas
└── test/
    ├── mocks/            # MSW handlers
    └── utils/            # Test utilities and render helpers
```

---

## Core Data Models

All types are derived from Zod schemas in `src/schemas/index.ts`.

```ts
// A single time block within a day preset
type Block = {
  id: string
  title: string
  startTime: string        // "HH:MM" 24-hour format
  endTime: string          // "HH:MM" 24-hour format
  colour: string           // Hex value, user-defined
  isVariable: boolean      // If true, user fills in details each week
  notes?: string
}

// A reusable named day template
type DayPreset = {
  id: string
  name: string             // e.g. "Work Day (With Travel)"
  blocks: Block[]
}

// A week preset composed of day presets
type WeekPreset = {
  id: string
  name: string             // e.g. "Standard Work Week"
  days: {
    monday?: string        // DayPreset ID or null
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    sunday?: string
  }
}

// A variable block filled in during the Sunday planning session
type FilledBlock = {
  blockId: string
  title: string
  notes?: string
  subTasks?: { title: string; notes?: string }[]  // Optional
}
```

---

## Key Architectural Decisions

**Google Calendar as source of truth**
All published events live in Google Calendar. The app never caches or stores calendar events in Supabase. History is derived by querying Google Calendar directly. This eliminates sync conflicts.

**Supabase stores structure only**
Supabase holds preset definitions and user settings — not events. Tables: `day_presets`, `week_presets`, `blocks`, `user_settings`.

**Single Google OAuth flow**
Supabase Auth handles login via Google OAuth. The `calendar.events` scope is requested at sign-in so no second auth step is needed to publish to Google Calendar.

**Stateless planning flow**
The Sunday planning session is ephemeral. The user picks a preset, fills variable blocks, previews, and publishes. Nothing is saved mid-flow until publish. Zustand holds the in-progress state for the session.

**Post-publish editing**
After publishing, the user can return to the app and edit individual events. Changes can be pushed directly to Google Calendar (updates the specific event) or held and applied on the next full weekly publish.

**Day presets are reusable**
A day preset can be used in multiple week presets. Editing a day preset does not retroactively affect already-published weeks (those live in Google Calendar).

---

## Views

The calendar/preview screen supports three view modes:

- **Day view** — vertical timeline, CSS Grid, blocks positioned by start/end time
- **Week view** — horizontal 7-column grid, blocks per day column
- **List view** — blocks as cards grouped by day

Each view supports a **grid layout** and a **tabular/list layout**. View preference is persisted in Zustand.

---

## Conventions

**TypeScript**
- Strict mode. No `any`. Use `unknown` and narrow explicitly.
- All types derived from Zod schemas via `z.infer<>`.
- Prefer type imports: `import type { Foo } from '...'`

**Components**
- Functional components only. No class components.
- Props interfaces defined inline above the component or in a co-located `types.ts`.
- shadcn/ui components go in `src/components/ui/` and are not edited directly.
- Custom components go in their relevant subfolder.

**State**
- Zustand for UI/session state only. No server state in Zustand.
- TanStack Query for all async data fetching and mutation.
- Do not mix concerns — TanStack Query manages cache invalidation, Zustand manages what the user is looking at.

**Styling**
- Tailwind utility classes only. No custom CSS files except global resets in `index.css`.
- Mobile-first: base styles for mobile, `md:` and `lg:` for larger screens.
- User-defined block colours are applied via inline styles, not Tailwind classes (dynamic values).
- Clean minimal aesthetic: generous whitespace, simple typography, no decorative elements.

**Forms**
- Use shadcn/ui form primitives with `react-hook-form` and Zod resolvers.
- No HTML `<form>` submit behaviour — use `onClick` handlers.

**Date & Time**
- All times stored as `"HH:MM"` strings (24-hour).
- All calendar event timestamps formatted as ISO 8601 for Google Calendar API.
- No date libraries. Use native `Date`, `Intl.DateTimeFormat`, and utilities in `src/lib/date.ts`.

**API Calls**
- All Google Calendar API calls go through helpers in `src/lib/googleCalendar.ts`.
- All Supabase calls go through hooks in `src/hooks/`.
- Never call Supabase or Google Calendar directly from components.

**Testing**
- Every hook has a corresponding test file.
- MSW handlers mock all external API calls — no real network calls in tests.
- Tests live in `src/test/` mirroring the `src/` structure.

**Naming**
- Files: `camelCase.tsx` for components, `camelCase.ts` for utilities and hooks.
- Components: `PascalCase`.
- Hooks: `useCamelCase`.
- Zod schemas: `camelCaseSchema`.

---

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_CALENDAR_API_KEY=
```

These must be set in `.env.local` for local development and as GitHub Actions secrets for CI/CD. Never commit `.env.local`.

---

## PWA Configuration

The app must be installable on iOS via Safari's "Add to Home Screen". Ensure:
- `manifest.webmanifest` includes `display: "standalone"`, correct icons at 192×192 and 512×512, and `theme_color`
- Service worker is registered via `vite-plugin-pwa`
- The app works offline for viewing existing presets (read from Supabase cache). Publishing requires network.

---

## CI/CD Pipeline

GitHub Actions workflow on push to `main`:
1. Install dependencies
2. Run ESLint
3. Run TypeScript type-check (`tsc --noEmit`)
4. Run Vitest
5. Run Vite build
6. Deploy `dist/` to `gh-pages` branch via `peaceiris/actions-gh-pages`

---

## Out of Scope (for now)

- Multi-user / team support (Supabase schema should be designed with `user_id` on all rows to make this straightforward later)
- Native iOS/Android app
- Notifications or reminders
- Drag-and-drop block reordering (add later if needed)
- Integration with any calendar other than Google Calendar