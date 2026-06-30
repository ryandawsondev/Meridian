# Supabase — Meridian

## Project Details

| Field | Value |
|---|---|
| Project name | Meridian |
| Project ID | `aracsatkhfiaznsmkhai` |
| Region | `eu-west-2` (London) |
| Postgres version | 17.6.1.127 |
| Status | ACTIVE_HEALTHY |
| Created | 2026-06-29 |
| DB host | `db.aracsatkhfiaznsmkhai.supabase.co` |

---

## What Supabase Is

Supabase is an open-source Firebase alternative built on Postgres. It provides:

- **Postgres database** — full relational DB, migrations, SQL editor
- **Auth** — built-in user management; supports OAuth providers (Google, GitHub, etc.)
- **Row Level Security (RLS)** — Postgres-native per-row access control so users can only touch their own data
- **Auto-generated REST + Realtime APIs** — instant API from your schema; JS client via `@supabase/supabase-js`
- **Storage** — file buckets (not used in Meridian)
- **Edge Functions** — serverless Deno functions (not used in Meridian)

In Meridian, Supabase handles **auth** and **structural data storage only**. Calendar events live in Google Calendar, not Supabase.

---

## Auth Configuration

- Provider: **Google OAuth**
- Scope requested at sign-in: `https://www.googleapis.com/auth/calendar.events`
- After OAuth, Supabase issues a session. The Google `provider_token` (access token) is extracted and used for all Google Calendar API calls — no second auth step required.
- Redirect URL on login: `{origin}{BASE_URL}auth/callback`

---

## Schema

### Migration history

| Version | Name |
|---|---|
| `20260629213201` | `initial_schema` |
| `20260629213214` | `published_weeks` |

---

### Table: `day_presets`

Stores named day templates. Each day preset holds a list of time blocks.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE | — |
| `name` | `text` | NOT NULL | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` |
| `updated_at` | `timestamptz` | NOT NULL | `now()` (auto-updated via trigger) |

**RLS policy:** `day_presets_owner` — all operations require `auth.uid() = user_id`.

**Current rows:** 1

---

### Table: `blocks`

Individual time blocks belonging to a day preset.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` |
| `day_preset_id` | `uuid` | NOT NULL, FK → `day_presets.id` ON DELETE CASCADE | — |
| `title` | `text` | NOT NULL | — |
| `start_time` | `text` | NOT NULL | — (`"HH:MM"` 24-hour) |
| `end_time` | `text` | NOT NULL | — (`"HH:MM"` 24-hour) |
| `colour` | `text` | NOT NULL | — (hex, e.g. `#4F46E5`) |
| `is_variable` | `boolean` | NOT NULL | `false` |
| `notes` | `text` | nullable | — |
| `order` | `integer` | NOT NULL | `0` |

**RLS policy:** `blocks_owner` — access allowed only if the parent `day_preset` belongs to `auth.uid()`.

> **Important:** `is_variable = false` by default. Blocks inserted directly via Supabase table editor will NOT appear as variable blocks in the planning flow unless this is explicitly set to `true`.

**Current rows:** 1

---

### Table: `week_presets`

Named week templates that map days of the week to day presets.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE | — |
| `name` | `text` | NOT NULL | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` |
| `updated_at` | `timestamptz` | NOT NULL | `now()` (auto-updated via trigger) |

**RLS policy:** `week_presets_owner` — all operations require `auth.uid() = user_id`.

**Current rows:** 0

---

### Table: `week_preset_days`

Join table — maps a specific day of the week within a week preset to a day preset.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` |
| `week_preset_id` | `uuid` | NOT NULL, FK → `week_presets.id` ON DELETE CASCADE | — |
| `day_of_week` | `text` | NOT NULL, CHECK: must be one of the values below | — |
| `day_preset_id` | `uuid` | nullable, FK → `day_presets.id` ON DELETE SET NULL | — |

**`day_of_week` allowed values:** `monday` `tuesday` `wednesday` `thursday` `friday` `saturday` `sunday`

**Unique constraint:** `(week_preset_id, day_of_week)` — one row per day per week preset.

**RLS policy:** `week_preset_days_owner` — access allowed only if parent `week_preset` belongs to `auth.uid()`.

**Current rows:** 0

---

### Table: `user_settings`

One row per user. Stores display preferences and default week preset.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `user_id` | `uuid` | PK, FK → `auth.users.id` ON DELETE CASCADE | — |
| `default_week_preset_id` | `uuid` | nullable, FK → `week_presets.id` ON DELETE SET NULL | — |
| `preferred_view` | `text` | NOT NULL, CHECK: `day` \| `week` \| `list` | `'week'` |

**RLS policy:** `user_settings_owner` — all operations require `auth.uid() = user_id`.

**Current rows:** 0

---

### Table: `published_weeks`

One row per published week. Records which week preset was used and when the publish happened.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE | — |
| `week_start` | `date` | NOT NULL | — (Monday date of that week) |
| `week_preset_id` | `uuid` | nullable, FK → `week_presets.id` ON DELETE SET NULL | — |
| `created_at` | `timestamptz` | — | `now()` |

**RLS policy:** `Users manage own published weeks` — all operations require `auth.uid() = user_id`.

**Current rows:** 0

---

### Table: `published_events`

One row per calendar event created during a publish. Stores the Google Calendar event ID for future edits/deletes.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `published_week_id` | `uuid` | NOT NULL, FK → `published_weeks.id` ON DELETE CASCADE |
| `google_calendar_event_id` | `text` | NOT NULL |
| `block_id` | `uuid` | nullable, FK → `blocks.id` ON DELETE SET NULL |
| `day_date` | `date` | NOT NULL |
| `title` | `text` | NOT NULL |
| `start_time` | `text` | NOT NULL (`"HH:MM"`) |
| `end_time` | `text` | NOT NULL (`"HH:MM"`) |

**RLS policy:** `Users manage own published events` — access allowed only if parent `published_week` belongs to `auth.uid()`.

**Current rows:** 0

---

## Entity Relationships

```
auth.users
  │
  ├── day_presets (user_id)
  │     └── blocks (day_preset_id)
  │
  ├── week_presets (user_id)
  │     └── week_preset_days (week_preset_id)
  │           └── day_presets (day_preset_id)  ← FK reference
  │
  ├── user_settings (user_id)
  │     └── week_presets (default_week_preset_id)  ← FK reference
  │
  └── published_weeks (user_id)
        └── published_events (published_week_id)
              └── blocks (block_id)  ← FK reference
```

---

## Row Level Security Summary

All tables have RLS enabled. No anonymous reads. Every policy gates on `auth.uid()` matching either:
- The row's own `user_id` column (direct tables)
- A parent table's `user_id` via subquery (join tables: `blocks`, `week_preset_days`, `published_events`)

This means: even if the anon key is exposed in client JS, users cannot read or write other users' data.

---

## Triggers

| Trigger | Table | Event | Action |
|---|---|---|---|
| `day_presets_updated_at` | `day_presets` | BEFORE UPDATE | Sets `updated_at = now()` |
| `week_presets_updated_at` | `week_presets` | BEFORE UPDATE | Sets `updated_at = now()` |

---

## Environment Variables (client)

```
VITE_SUPABASE_URL=https://aracsatkhfiaznsmkhai.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

The anon key is safe to expose in client JS — RLS enforces data isolation.

---

## What Is NOT Stored in Supabase

- Calendar events (live in Google Calendar — source of truth)
- Session tokens (managed by Supabase Auth internally)
- Planning session state (ephemeral Zustand state, cleared after publish)
