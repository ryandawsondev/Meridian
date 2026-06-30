# Google Cloud Console — Meridian

## What Google Cloud Console Is

Google Cloud Console (console.cloud.google.com) is Google's platform for managing APIs, credentials, and cloud infrastructure. For Meridian, it's used exclusively to:

1. **Enable the Google Calendar API** — gives the app permission to make Calendar REST calls
2. **Create OAuth 2.0 credentials** — the Client ID that Supabase uses to broker Google sign-in
3. **Configure the OAuth consent screen** — what users see when they authorise the app

You don't need to run any servers or pay for anything for this use case — the Calendar API has a generous free tier (1,000,000 requests/day).

---

## Current Configuration

### Project

| Field | Value |
|---|---|
| Project name | Meridian (or similar — check console) |
| APIs enabled | Google Calendar API |

---

### OAuth 2.0 Credentials

| Field | Value |
|---|---|
| Credential type | OAuth 2.0 Client ID |
| Application type | Web application |
| Client ID | Set as `VITE_GOOGLE_CLIENT_ID` in `.env.local` |
| Client Secret | Stored in Supabase Auth provider settings (not in app code) |

**Authorised JavaScript origins** — domains allowed to initiate OAuth:
- `http://localhost:5173` (local dev)
- `https://<your-github-pages-domain>` (production)

**Authorised redirect URIs** — where Google sends the user after auth:
- `https://aracsatkhfiaznsmkhai.supabase.co/auth/v1/callback` (Supabase handles the OAuth callback)

> If you add a new domain (e.g. custom domain), you must add it to both lists here or OAuth will fail with `redirect_uri_mismatch`.

---

### OAuth Consent Screen

| Field | Value |
|---|---|
| App name | Meridian |
| User support email | Ryan_Dawson_04@outlook.com |
| Publishing status | Testing (or In production) |
| User type | External |
| Scopes requested | `openid`, `email`, `profile`, `https://www.googleapis.com/auth/calendar.events` |

**Testing vs Production:**
- **Testing** — only explicitly added test users can sign in. Fine for development.
- **Production** — any Google account can sign in. Requires Google verification for sensitive scopes.

`calendar.events` is a **sensitive scope**, which means Google will show a warning screen to users until the app goes through OAuth verification. For personal/solo use, staying in Testing mode avoids this.

---

### API Key

| Field | Value |
|---|---|
| Type | API Key |
| Restrictions | HTTP referrer restricted to your domains (recommended) |
| Used for | `VITE_GOOGLE_CALENDAR_API_KEY` in `.env.local` |

> In Meridian, the API key is defined in env vars but the actual Calendar calls use the OAuth `provider_token` (Bearer token) from the user's session — not the API key directly. The API key may be used for unauthenticated read operations if needed in future.

---

## How the Auth Flow Works

```
User clicks "Sign in with Google"
  │
  ▼
Supabase Auth → redirects to Google OAuth
  │   (passes Client ID, requested scopes, redirect URI)
  ▼
Google shows consent screen
  │   (user approves calendar.events access)
  ▼
Google redirects to Supabase callback URI
  │   (with auth code)
  ▼
Supabase exchanges code for tokens
  │   stores session + provider_token (Google access token)
  ▼
App receives session via supabase.auth.getSession()
  │
  ▼
getGoogleAccessToken(session) → extracts provider_token
  │
  ▼
All Google Calendar API calls use: Authorization: Bearer <provider_token>
```

---

## Scopes Explained

| Scope | Why needed |
|---|---|
| `openid` | Standard OIDC — lets Supabase identify the user |
| `email` | User's email address for the Supabase user record |
| `profile` | User's name and avatar |
| `https://www.googleapis.com/auth/calendar.events` | Read and write events on the user's Google Calendar |

`calendar.events` is the minimum scope for publishing. It does NOT grant access to calendar settings, other people's calendars, or calendar list management.

---

## Google Calendar API — What Meridian Uses

All calls go through `src/lib/googleCalendar.ts`. Base URL: `https://www.googleapis.com/calendar/v3/calendars`.

| Operation | Method | Endpoint | Used when |
|---|---|---|---|
| List events for week | GET | `/calendars/{id}/events` | History tab, preview |
| Create event | POST | `/calendars/{id}/events` | Publishing a week |
| Update event | PATCH | `/calendars/{id}/events/{eventId}` | Post-publish edit |
| Delete event | DELETE | `/calendars/{id}/events/{eventId}` | Removing a block |

Calendar ID is typically `primary` — the user's default Google Calendar.

Event shape sent to API:
```json
{
  "summary": "Morning Focus",
  "description": "Optional notes or sub-tasks",
  "start": { "dateTime": "2026-06-30T09:00:00", "timeZone": "Europe/London" },
  "end":   { "dateTime": "2026-06-30T12:00:00", "timeZone": "Europe/London" }
}
```

---

## What Else Google Cloud Console Can Do (Not Used Yet)

| Feature | What it does |
|---|---|
| Cloud Functions | Serverless backend — could run publish logic server-side |
| Cloud Run | Containerised services |
| Pub/Sub | Event streaming |
| Google People API | Contacts, if you ever want to invite others to blocks |
| Calendar API — `calendar.readonly` | Read-only access (lighter scope for history-only features) |
| Firebase | Realtime DB, push notifications — different product, same console |

---

## Common Issues & Fixes

| Problem | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | Redirect URI not in allowed list | Add URI to OAuth credential in console |
| `invalid_client` | Wrong Client ID or secret | Check Supabase Auth → Google provider settings |
| `Access blocked: app not verified` | Sensitive scope + Production mode | Switch to Testing, or complete OAuth verification |
| Calendar events not creating | `provider_token` expired or null | User must re-sign-in to get fresh token |
| `403 Forbidden` on Calendar API | Scope not granted | User must re-authorise with `calendar.events` scope |

---

## Environment Variables

```
VITE_GOOGLE_CLIENT_ID=<OAuth 2.0 Client ID from console>
VITE_GOOGLE_CALENDAR_API_KEY=<API key from console>
```

Client Secret is stored **only** in Supabase Auth settings (Dashboard → Authentication → Providers → Google). Never put it in client-side code or `.env.local`.
