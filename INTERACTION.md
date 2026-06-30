# INTERACTION.md

Interaction design audit for Meridian. Covers navigation flow, UX gaps, inconsistencies, and specific improvements. Ordered by area, prioritised by impact.

---

## Overview

The core interaction problem is **inconsistency**: steps 1–2 of planning advance implicitly via card clicks; steps 3–4 use explicit buttons. Preview's "Back" mutates the planning store rather than navigating. Presets save some changes immediately and others only on button press. These inconsistencies mean users cannot build a reliable mental model of how the app works.

A secondary problem is **no clear escape hatch** — from several screens, there is no obvious way to cancel, go back, or start fresh without triggering a destructive action.

---

## 1. Planning Flow (4-Step Wizard)

### 1.1 Implicit vs Explicit Navigation

**Problem:** Steps 1 and 2 advance automatically when the user clicks a card — no "Next" button, no confirmation. Steps 3 and 4 both have explicit "Back" / "Next" buttons. This inconsistency is disorienting: a user who accidentally taps a preset on step 1 is already on step 2 with no warning.

**File:** `src/components/planning/StepPresetPicker.tsx`, `src/components/planning/StepWeekPicker.tsx`

**Fix:** Add a selected-state visual to the card (checkmark, highlighted border) and a "Next" button that only activates once a card is selected. The click selects; the "Next" button advances. Optionally, auto-advance on card click is acceptable if a "Back" button on the next step is reliable — but the selected state must be visible.

---

### 1.2 No Confirmation on "Start Over"

**Problem:** The "Start over" button in the planning header immediately calls `clearSession()` and resets to step 1. There is no confirmation. A user 3 steps in loses all their work with one tap.

**File:** `src/pages/PlanningPage.tsx`

**Fix:** Show an alert dialog:
> "Start over? You'll lose your current selections and filled blocks."
> `Cancel` / `Start over`

---

### 1.3 No Cancel / Exit from Planning Flow

**Problem:** There is no way to leave the planning flow mid-session without either completing it, hitting "Start over" (destructive), or navigating away via the bottom nav (which abandons state silently). The planning session state is in Zustand with no persistence, so navigating away then back shows the planning page — but at the step the user left, which is correct, though the user doesn't know this.

**Fix:** The bottom nav navigation away should either:
- Warn ("Leave planning? Your progress will be saved.") and preserve state, or
- Make it clearer that returning to `/planning` resumes from where the user left off.

At minimum, clarify the experience by adding a "Continue later" affordance (explicit, named) rather than relying on implicit Zustand state persistence.

---

### 1.4 No Way to Jump to Earlier Steps

**Problem:** From step 4 (Review), the only way to fix something in step 1 is to click "Back" → "Back" → "Back". There is a step progress indicator at the top but it is not clickable.

**File:** `src/pages/PlanningPage.tsx`

**Fix:** Make the step indicator clickable for steps already completed. Clicking step 1 from step 4 should jump directly there, not require three "Back" taps.

---

### 1.5 Validation Errors Only on Submit

**Problem:** In step 3 (Fill Blocks), variable block title fields are required. Errors only appear after the user clicks "Review week" — `showErrors` is set to `true` on that click and propagates to all forms. Users get no real-time feedback as they type.

**File:** `src/components/planning/StepFillBlocks.tsx`, `src/components/planning/VariableBlockForm.tsx`

**Fix:** Two options:
- Validate on blur (when user leaves each field). Show error immediately per field.
- At minimum, show an inline error counter at the top of the step ("2 fields still required") that updates in real time.

---

### 1.6 No Indication of What "Variable Block" Means

**Problem:** Users new to the app encounter "variable blocks" on step 3 with no explanation. The word "variable" is developer jargon. If a user has no variable blocks, they see "No variable blocks" and a "Review week" button — no explanation of why step 3 is effectively empty.

**Fix:** Add a one-line explanation in step 3:
- Non-empty case: "These blocks have placeholder titles — fill them in for this week."
- Empty case: "All your blocks have fixed titles this week. Nothing to fill in."

---

### 1.7 Sub-Tasks Feature Not Discoverable

**Problem:** The sub-tasks section inside `VariableBlockForm` is collapsed by default and labelled "Add sub-tasks". Most users will never discover it because nothing on the previous steps or documentation surface hints at it.

**File:** `src/components/planning/VariableBlockForm.tsx`

**Fix:** Consider surfacing sub-tasks on the Review step (step 4) if any blocks already have them (showing count). Also, label the toggle more descriptively: "Add sub-tasks to this block" with a brief description: "(optional, shows in calendar event description)".

---

### 1.8 No Visual Warning on Review if Blocks Are Unfilled

**Problem:** Step 4 (Review) shows unfilled variable blocks in grey italic as `(blockTitle)`. There is no warning or call-to-action telling the user these will publish with placeholder text. A user might proceed to publish without noticing.

**File:** `src/components/planning/StepReview.tsx`

**Fix:** Add a warning banner on step 4 if any variable blocks remain unfilled:
> "⚠ 2 blocks have unfilled titles. Go back to fill them in, or they'll publish with placeholder text."

---

### 1.9 Planning State Lost on Refresh

**Problem:** The planning store is Zustand without any localStorage persistence. A page refresh at any step returns the user to step 1 with all state cleared. There is no indication to the user that refreshing will lose their work.

**File:** `src/stores/planningStore.ts`

**Fix:** Persist planning state to `localStorage` using Zustand's `persist` middleware. On app load, hydrate state and resume at the correct step. Show a "Resume your planning session" banner if a stored session is found on entry to `/planning`.

---

## 2. Preview Page

### 2.1 "Back" Button Behaviour is Wrong

**Problem:** The "Back" button on PreviewPage calls `setStep(4)` then `navigate('/planning')`. This couples the Preview page to the planning wizard's internal step state. If the user reaches the preview page by a different path (browser back button, direct link), this breaks. It also feels wrong — the back button should navigate without mutating store state.

**File:** `src/pages/PreviewPage.tsx`

**Fix:** Use browser history for back navigation:
```ts
navigate(-1)
```
If the app's routing guarantees preview is always reached from planning step 4, `navigate('/planning')` alone is fine — but drop the `setStep(4)` call. The planning flow should restore its own step state when the user re-enters `/planning`.

---

### 2.2 No Confirmation Before Publishing

**Problem:** Clicking "Publish to Calendar" immediately fires the publish mutation with no confirmation dialog. Publishing is the most consequential, least-reversible action in the app.

**File:** `src/pages/PreviewPage.tsx`

**Fix:** Show a confirmation dialog:
> "Publish 23 events to Google Calendar for Mon 30 Jun – Sun 6 Jul?"
> `Cancel` / `Publish`

---

### 2.3 Google Token Expiry Warning Not Prominent Enough

**Problem:** If the Google session has expired, a warning appears above the footer. The "Publish to Calendar" button is disabled but the warning may not be visible without scrolling. Users may think the button is broken.

**File:** `src/pages/PreviewPage.tsx`

**Fix:** Move the token-expiry warning to a sticky banner at the top of the page (not just above the footer). The warning should be the first thing the user sees when the token is gone, not the last.

---

### 2.4 No Loading State During Publish

**Problem:** During publish, only the button label changes to "Publishing…". There is no overlay, no disabled state on the rest of the page, and no progress indicator. The user could scroll, tap other elements, or navigate away while the publish is in flight.

**Fix:** Disable the entire page during publish (overlay with spinner). Show a progress message: "Publishing events… 12 of 23 done" if the mutation allows for incremental feedback.

---

### 2.5 No Retry for Partial Publish Failures

**Problem:** If some events fail to publish, the success dialog shows a list of failures. The user's only option is "Done" which clears the session. They cannot retry just the failed events.

**File:** `src/pages/PreviewPage.tsx`

**Fix:** Add a "Retry failed events" button in the partial-failure dialog. This should re-run the publish mutation with only the failed events, not the full week.

---

### 2.6 No Pre-Flight Validation

**Problem:** The user can reach the preview page with an expired Google token. The publish button is disabled but there is no proactive check before the user sees the preview.

**Fix:** On PreviewPage mount, validate that a Google token exists and is not expired. If it is expired, show a modal immediately: "Your Google session has expired. Re-authenticate to publish." with a "Sign in again" button that triggers re-auth without leaving the planning session.

---

### 2.7 View Mode Preference Not Persisted

**Problem:** The view mode (Day / Week / List) on the Preview page is stored in Zustand but Zustand is not persisted. On every visit to the preview page, the default view is `'week'` regardless of user preference.

**File:** `src/stores/uiStore.ts`

**Fix:** Persist `viewMode` to `localStorage`. User should see their preferred view each time.

---

## 3. Presets Page

### 3.1 Week Preset Day Dropdowns Auto-Apply with No Save

**Problem:** In the WeekPresetEditor, changing a day's dropdown immediately applies the change to local state. There is no "Save" button for individual day assignments. The only way out is "Close" (which triggers an unsaved-changes guard if the name changed, but NOT if only day assignments changed). This means the user can accidentally change day assignments and not realise they've been applied.

**File:** `src/components/presets/WeekPresetEditor.tsx`

**Fix:** Two options:
1. Make day assignment changes explicit: add a "Save" button per row, or a footer "Save changes" button.
2. If auto-apply is intentional (save on change), make it visually clear: show a "Saved" tick next to each row after mutation resolves, and handle errors inline.

---

### 3.2 Unsaved Name Changes Inconsistency

**Problem:** The day preset editor shows an unsaved-changes alert when the user tries to close *only if the name was changed*. Day/block changes are saved via separate mutations. This is inconsistent — users may not realise closing the modal will discard an unsaved name.

**File:** `src/components/presets/DayPresetEditor.tsx`

**Fix:** Clarify the save model: the name has an explicit inline save button ("Save" appears when name differs from stored value). Make this more discoverable — highlight the save button when the field is dirty. Alternatively, unify save: all changes in the modal (name, block edits) are saved only on an explicit "Save and close" button.

---

### 3.3 No Feedback After Saving Preset Name

**Problem:** After clicking the inline "Save" button on a preset name, the button disappears (because the name is no longer "different from stored"). There is no success flash, toast, or visual confirmation that the save worked.

**Fix:** Show a brief success state: "Saved" next to the field for 2 seconds after mutation resolves. On error, show an inline error message.

---

### 3.4 Block Reordering is Clunky on Mobile

**Problem:** Blocks in DayPresetEditor are reordered using up/down chevron buttons. On mobile, these are small tap targets, and reordering many blocks requires many taps.

**File:** `src/components/presets/DayPresetEditor.tsx`

**Fix:** Implement drag-to-reorder using the HTML Drag and Drop API or a library like `@dnd-kit/sortable`. The up/down chevrons can remain as a keyboard-accessible fallback.

---

### 3.5 No Empty State Guidance in Presets

**Problem:** When no day presets exist, the list shows "No day presets yet." with no call to action beyond the "New day preset" button at the top of the page. New users have no guidance on where to start.

**Fix:** Replace the empty state message with an onboarding card:
> "Create a day preset to get started. A day preset is a named set of time blocks for a type of day — like 'Deep Work Day' or 'Light Friday'. You can reuse it across multiple week presets."
> `+ Create your first day preset`

---

### 3.6 No Validation on Empty Week Presets

**Problem:** A user can create a week preset and assign no days to it. This week preset will appear in the planning flow step 1 and, if selected, will produce a blank week with no blocks. There is no validation or warning.

**Fix:** Warn when closing the WeekPresetEditor if no days are assigned:
> "This week preset has no days assigned. Add at least one day to use it in planning."
Allow the user to close anyway (it's valid to have an in-progress preset), but surface the warning.

---

### 3.7 Delete Confirmation Could Be More Specific

**Problem:** The delete alert for day presets says it will delete the preset and its blocks, and that week presets using it will "lose that day assignment." The user doesn't know which week presets are affected.

**Fix:** List the affected week presets by name in the delete confirmation:
> "This will also remove this day from: Standard Work Week, Travel Week."

---

## 4. History Page

### 4.1 No Empty State When No History Exists

**Problem:** If no published weeks exist in Google Calendar, the history page renders a blank area with no message.

**File:** `src/pages/HistoryPage.tsx`

**Fix:** Show an empty state:
> "No published weeks yet. Plan and publish your first week to see it here."

---

### 4.2 Expand/Collapse Transition is Jarring

**Problem:** Clicking a week card in history toggles expanded/collapsed state with no animation. The page height changes abruptly, which is disorienting on mobile.

**Fix:** Add a CSS transition on the expanded content's height, or use a `<details>` element with CSS animation.

---

### 4.3 No Search or Filter

**Problem:** As published weeks accumulate, the history page becomes a long scrollable list with no way to find a specific week.

**Fix:** Add a date picker or text filter at the top. At minimum, allow jumping to a specific month.

---

### 4.4 No Way to Reuse a Past Week

**Problem:** History is read-only. There is no way to take a past published week and use it as the basis for this week's plan.

**Fix:** Add a "Use as template" button on each history entry. This would pre-populate the planning flow (step 1) with the same week preset and filled blocks from that week.

---

## 5. Global Navigation

### 5.1 No Scroll-to-Top on Route Change

**Problem:** Navigating via the bottom nav does not scroll the page back to the top. If the user is scrolled 50% down on the Presets page and taps "Plan", the planning page loads scrolled down.

**Fix:** Add a scroll-to-top effect on route change in the router or in `AppShell`.

---

### 5.2 Bottom Nav Has No Active State Affordance for Disabled Routes

**Problem:** The bottom nav always shows all 3 items (Plan, Presets, History). If the user is in the middle of a planning session, tapping "History" or "Presets" will navigate away silently, leaving the planning session in Zustand.

**Fix:** Either:
- Show a visual indicator when a planning session is active (e.g., a dot on the "Plan" nav item).
- Intercept navigation away from `/planning` mid-session and confirm with the user.

---

### 5.3 No App-Wide Error Boundary with Recovery

**Problem:** If a component throws during render, there is no app-level error boundary. The user sees a blank screen with no recovery path.

**Fix:** Wrap the app in an `<ErrorBoundary>` that shows:
> "Something went wrong. [Reload page]"

---

### 5.4 No Offline Indicator

**Problem:** The app is a PWA and must work offline for viewing presets. However, there is no indication to the user when they are offline, and publish attempts will fail silently (or with a generic network error).

**Fix:** Add an offline banner using the `online`/`offline` browser events:
> "You're offline. Preset changes will sync when you reconnect. Publishing requires a connection."

---

## 6. Dead Code / Broken State

### 6.1 `layoutMode` in uiStore is Dead

**Problem:** `uiStore.ts` tracks `layoutMode: 'grid' | 'tabular'` and exposes `setLayoutMode`. Nothing in the codebase reads or uses it. The switcher UI does not exist.

**File:** `src/stores/uiStore.ts`

**Fix:** Either implement the layout switcher (show blocks in tabular/list vs grid format in the views) or remove `layoutMode` and `setLayoutMode` entirely.

---

### 6.2 PreviewPage Mutates Planning Store for Back Navigation

**Problem:** See section 2.1. This is an architectural issue masquerading as a navigation bug. The `setStep(4)` call in PreviewPage's back handler tightly couples the two pages.

**Fix:** Remove `setStep` from PreviewPage entirely. Planning step state should only be mutated by the planning wizard itself.

---

## 7. Accessibility & Mobile UX

### 7.1 Confirmation Dialogs Missing `aria-describedby`

All alert/confirm dialogs should have `aria-describedby` pointing to the description text so screen readers read the full context, not just the title.

### 7.2 Small Tap Targets in Block Reorder

Up/down chevrons in `DayPresetEditor` are icon buttons without sufficient padding for reliable mobile tapping. Minimum tap target should be 44×44px per WCAG 2.1.

### 7.3 DayView Has Two Simultaneous Scroll Axes

The day view on PreviewPage has a horizontal scroll for the day selector and a vertical scroll for the timeline. On small screens, this creates a confusing scroll interaction. The day selector should be sticky tabs, not part of the scroll.

### 7.4 Form Inputs Have No Autocomplete Hints

Block title inputs and preset name inputs could benefit from `autocomplete="off"` (to suppress browser fill suggestions for time/block fields) or appropriate `autocomplete` values for name fields.

---

## Priority Matrix

| # | Issue | Area | Severity | Effort |
|---|-------|------|----------|--------|
| 1 | Implicit card-click navigation (steps 1–2) | Planning | High | Low |
| 2 | No confirmation before "Start over" | Planning | High | Low |
| 3 | No confirmation before publish | Preview | High | Low |
| 4 | "Back" in preview mutates planning store | Preview | High | Low |
| 5 | Planning state lost on refresh | Planning | High | Medium |
| 6 | Validation errors only on submit | Planning | Medium | Low |
| 7 | Token expiry warning not visible | Preview | Medium | Low |
| 8 | Week preset day assignments auto-apply with no save | Presets | Medium | Medium |
| 9 | No scroll-to-top on route change | Global | Medium | Low |
| 10 | Block reordering clunky on mobile | Presets | Medium | High |
| 11 | No pre-flight publish validation | Preview | Medium | Medium |
| 12 | No retry for partial publish failures | Preview | Medium | High |
| 13 | No loading overlay during publish | Preview | Medium | Low |
| 14 | Dead `layoutMode` in uiStore | Global | Low | Low |
| 15 | Step indicator not clickable | Planning | Low | Low |
| 16 | No empty state guidance in presets | Presets | Low | Low |
| 17 | No offline indicator | Global | Low | Medium |
| 18 | History expand/collapse jarring | History | Low | Low |
| 19 | No way to reuse past week as template | History | Low | High |
| 20 | No app-level error boundary | Global | Low | Low |
