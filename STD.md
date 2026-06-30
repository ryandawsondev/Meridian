# Software Test Document — Meridian

## TC-01 Authentication

**Precondition:** Logged out. App at `/`.

| # | Action | Expected |
|---|--------|----------|
| 1 | Open app | Redirected to sign-in page |
| 2 | Click "Sign in with Google" | Google OAuth popup / redirect opens |
| 3 | Authenticate with Google account | Redirected back to app, logged in |
| 4 | Verify | `calendar.events` scope granted (no second auth step) |

---

## TC-02 Create Day Preset

**Precondition:** Logged in. On Presets tab.

| # | Action | Expected |
|---|--------|----------|
| 1 | Click "New day preset" | Name input appears |
| 2 | Enter name "Work Day" → confirm | Preset appears in list |
| 3 | Add block: "Morning Focus", 09:00–12:00, colour #4F46E5 | Block saved and visible |
| 4 | Add block: "Lunch", 12:00–13:00, colour #10B981 | Block saved and visible |
| 5 | Add block: "Afternoon Project", 13:00–17:00, mark as **variable** | Block marked variable |
| 6 | Reload page | All blocks persist (Supabase round-trip confirmed) |

---

## TC-03 Create Week Preset

**Precondition:** "Work Day" day preset exists.

| # | Action | Expected |
|---|--------|----------|
| 1 | Click "New week preset" | Name input appears |
| 2 | Enter name "Standard Week" → confirm | Preset appears in list |
| 3 | Assign "Work Day" to Monday, Tuesday, Wednesday, Thursday, Friday | 5 day slots filled, day initials highlighted |
| 4 | Leave Saturday and Sunday unassigned | 2 day slots empty |
| 5 | Reload page | Assignments persist |

---

## TC-04 Plan — Step 1: Choose Preset

**Precondition:** "Standard Week" week preset exists. On Plan tab.

| # | Action | Expected |
|---|--------|----------|
| 1 | Open Plan tab | Step 1 shown, "Standard Week" card visible |
| 2 | Confirm card shows 5/7 days filled | Day initials M T W T F highlighted |
| 3 | Click "Standard Week" | Advances to Step 2 |

---

## TC-05 Plan — Step 2: Choose Week

| # | Action | Expected |
|---|--------|----------|
| 1 | Step 2 shown | Current week displayed (Mon 30 Jun – Sun 6 Jul 2026) |
| 2 | Select current week | Week highlighted/selected |
| 3 | Click Next | Advances to Step 3 |

---

## TC-06 Plan — Step 3: Fill Variable Blocks

| # | Action | Expected |
|---|--------|----------|
| 1 | Step 3 shown | "Afternoon Project" form appears for Mon–Fri (5 entries) |
| 2 | Leave one entry blank → click "Review week" | Validation error shown, cannot advance |
| 3 | Fill all 5 entries (e.g. "Feature work") | No error |
| 4 | Click "Review week" | Advances to Step 4 |

---

## TC-07 Plan — Step 4: Review & Publish

| # | Action | Expected |
|---|--------|----------|
| 1 | Step 4 shown | All blocks visible across Mon–Fri |
| 2 | Variable block titles show filled values ("Feature work") | Correct |
| 3 | Fixed blocks show original titles ("Morning Focus", "Lunch") | Correct |
| 4 | Click "Publish to Google Calendar" | Publish request fires |
| 5 | Success state shown | No error |

---

## TC-08 Google Calendar Verification

**Precondition:** TC-07 completed.

| # | Action | Expected |
|---|--------|----------|
| 1 | Open Google Calendar | Mon–Fri events present for current week |
| 2 | Check "Morning Focus" | 09:00–12:00, correct colour |
| 3 | Check "Lunch" | 12:00–13:00, correct colour |
| 4 | Check "Afternoon Project" (Mon) | 13:00–17:00, title "Feature work" |

---

## TC-09 History Tab

**Precondition:** TC-07 completed.

| # | Action | Expected |
|---|--------|----------|
| 1 | Open History tab | Published week (30 Jun) listed |
| 2 | Expand week | Blocks shown per day, derived from Google Calendar |

---

## TC-10 Start Over / Reset

| # | Action | Expected |
|---|--------|----------|
| 1 | On Plan tab mid-flow (any step) | "Start over" button visible |
| 2 | Click "Start over" | Returns to Step 1, all selections cleared |

---

## TC-11 No Variable Blocks (Skip Step)

**Precondition:** Week preset uses a day preset with **no variable blocks**.

| # | Action | Expected |
|---|--------|----------|
| 1 | Pick that week preset → choose week | Step 3 shows "No variable blocks" message |
| 2 | Click "Review week" | Skips to Step 4 directly |

---

## TC-12 Blank Week

| # | Action | Expected |
|---|--------|----------|
| 1 | On Step 1, click "Blank week" | Advances to Step 2 with no preset selected |
| 2 | Complete flow to Step 3 | "No variable blocks — Blank week" message shown |
| 3 | Advance to Step 4 | Empty review (no blocks) |

---

## Known Supabase Data Requirements

Before running TC-04 through TC-09, verify in Supabase:

- `blocks` table: target blocks have `is_variable = true`
- `week_preset_days` table: rows exist linking week preset → day preset for each day
- `day_presets` → `blocks` join returns rows (check RLS policies allow reads)
