# Reactivity Audit

Findings from a full scan of hooks, stores, and components for places where a mutation succeeds but the UI does not update without a manual refresh.

---

## Critical

### 1. `usePublishWeek` invalidates a key that no query uses

**File:** `src/hooks/useGoogleCalendar.ts:98–106`

After a week is published, `onSuccess` calls:
```ts
queryClient.invalidateQueries({ queryKey: publishedWeeksKey })
// publishedWeeksKey = ['publishedWeeks']
```

But `usePublishedHistory` (the query that populates the History page) uses:
```ts
queryKey: ['publishedHistory', monthsBack]
```

These keys share no prefix. The invalidation is a no-op against the history query. After publishing, the History page will not show the new week until the TanStack Query default stale time expires or the user manually refreshes.

Additionally, the `['calendarEvents', weekStartISO]` cache for the published week is never invalidated on publish, so even after navigating to History and expanding that week, it will show a "no events" or stale response until the cache expires.

**Fix:** In `usePublishWeek.onSuccess`, also invalidate both the history and calendar-events caches:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['publishedHistory'] })
  queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
  // Remove or keep publishedWeeksKey if a future query uses it
},
```

---

### 2. `useUpdateCalendarEvent` and `useDeleteCalendarEvent` have no `onSuccess` handler

**File:** `src/hooks/useGoogleCalendar.ts:115–133`

Both mutations call the Google Calendar API but neither invalidates any query cache on success:

```ts
export function useUpdateCalendarEvent() {
  return useMutation({
    mutationFn: (...) => updateEvent(...),
    // no onSuccess
  })
}

export function useDeleteCalendarEvent() {
  return useMutation({
    mutationFn: (...) => deleteEvent(...),
    // no onSuccess
  })
}
```

If these are called (e.g., from a future edit-event flow), the `['calendarEvents', weekStartISO]` cache will serve stale data — the deleted or updated event will still appear in History until the cache naturally expires.

**Fix:** Add `onSuccess` to both:
```ts
const queryClient = useQueryClient()
onSuccess: (_data, { calendarId: _cid, eventId: _eid }) => {
  queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
},
```

---

## Medium

### 3. `useCalendarEventsForWeek` query key does not include the token

**File:** `src/hooks/useGoogleCalendar.ts:135–151`

```ts
const token = getGoogleAccessToken(session)

return useQuery({
  queryKey: ['calendarEvents', weekStartISO],   // token not in key
  queryFn: async () => {
    // token used here in closure
    return getEventsForWeek(token, ...)
  },
  enabled: !!token && !!weekStartISO,
})
```

When the user's Google session expires and they reconnect (new token), TanStack Query sees the same key `['calendarEvents', weekStartISO]` and returns the cached result from the old request without re-fetching. The cache entry is not stale from the library's perspective.

In practice this is low risk for same-user reconnect since the data is the same calendar, but it's technically incorrect and will silently serve stale data if the token changes identity.

**Fix:** Include a stable token identifier in the key:
```ts
queryKey: ['calendarEvents', weekStartISO, !!token],
```
Using `!!token` (boolean presence) is sufficient to force a refetch when the session transitions from expired → active.

---

### 4. `useGoogleCalendarHealth` query key does not include the token

**File:** `src/hooks/useHealthCheck.ts:41–48`

Same pattern as above. The health check pings Google Calendar using `token` from the closure but the key is `['health', 'googleCalendar']`. A fresh token after reconnect won't trigger a new health check until the 60-second `refetchInterval` fires.

Lower severity because the health check is cosmetic and the `refetchInterval: 60_000` acts as a natural correction.

**Fix:**
```ts
queryKey: ['health', 'googleCalendar', !!token],
```

---

## Low / Architectural Notes

### 5. `publishedWeeksKey` is a dangling constant

**File:** `src/hooks/useGoogleCalendar.ts:17`

```ts
export const publishedWeeksKey = ['publishedWeeks'] as const
```

No `useQuery` in the codebase uses this key. It was likely a naming artifact from before `usePublishedHistory` was split into its own file. The `invalidateQueries` call in `usePublishWeek.onSuccess` that targets this key is a no-op. Once issue #1 above is fixed, this constant can be removed or repurposed.

---

### 6. Editor components initialise `name` from a prop, not live query data

**Files:** `src/components/presets/DayPresetEditor.tsx:41`, `src/components/presets/WeekPresetEditor.tsx:51`

Both editors do:
```ts
const [name, setName] = useState(preset.name)
```

`useState` initialises once and does not re-sync when the prop changes. The parent components address this correctly by passing a `livePreset` derived from the live query:

```tsx
// DayPresetList.tsx:210-219, WeekPresetList.tsx:221-231
const livePreset = presets.find((p) => p.id === editingPreset.id) ?? editingPreset
```

So in practice the editor always opens with fresh data. The only remaining edge case is if the name is updated externally (another browser tab) *while* the editor is open — the local `name` state would not reflect the change. This is cosmetic and unlikely to matter.

No fix needed unless real-time collaboration is added.

---

## Summary Table

| # | File | Severity | Issue | Impact |
|---|------|----------|-------|--------|
| 1 | `useGoogleCalendar.ts:102` | **Critical** | `usePublishWeek.onSuccess` targets `['publishedWeeks']` — no query has this key | History page never updates after publish |
| 2 | `useGoogleCalendar.ts:115,128` | **Critical** | `useUpdateCalendarEvent` / `useDeleteCalendarEvent` have no `onSuccess` invalidation | Calendar events stay stale after edit/delete |
| 3 | `useGoogleCalendar.ts:140` | Medium | `useCalendarEventsForWeek` key omits token | Stale events served after session reconnect |
| 4 | `useHealthCheck.ts:43` | Low | `useGoogleCalendarHealth` key omits token | Stale health status for up to 60 s after reconnect |
| 5 | `useGoogleCalendar.ts:17` | Low | `publishedWeeksKey` constant is unused by any query | No active bug, but dead code obscures intent |
| 6 | `DayPresetEditor.tsx:41`, `WeekPresetEditor.tsx:51` | Low | `name` local state does not re-sync on external prop change | Only observable with multi-tab edits |
