# UI/UX Improvement Plan

Animation-first, motion-driven redesign using **Motion** (formerly Framer Motion) and **Magic UI** primitives. Every section below calls out the exact component, the current problem, and the target fix.

---

## 0. Setup

| Package | Purpose |
|---|---|
| `motion` | Page/component animations, gestures, layout transitions |
| `magic-ui` components | Shimmer buttons, animated counters, number tickers, shine effects, text reveals |

Install: `npm install motion`  
Magic UI components are copy-paste from [magicui.design](https://magicui.design) — drop them into `src/components/ui/magic/`.

---

## 1. Theme Switcher

**Current:** No theme toggle. Dark mode is implied by CSS variables but has no user control.

**Fix:**
- Add `theme` (`'light' | 'dark' | 'system'`) to `uiStore.ts`
- Persist preference to `localStorage` via Zustand persist middleware
- On mount, apply class `dark` to `<html>` when theme resolves to dark
- Add `ThemeToggle` button to `AppShell` header — icon-only (`Sun` / `Moon` from lucide-react), 32×32px
- **Animation:** Use `motion` to crossfade the icon swap (Sun ↔ Moon) with a rotation + scale spring on toggle:
  ```tsx
  <motion.div
    key={theme}
    initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
    animate={{ rotate: 0, scale: 1, opacity: 1 }}
    exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  />
  ```
- Wrap icon swap in `<AnimatePresence mode="wait">` so exit plays before enter
- The `<html class="dark">` change triggers CSS variable re-cascade — no component re-render needed

---

## 2. Page / Route Transitions

**Current:** Hard-cut between routes. Nothing signals context change.

**Fix:**
- Wrap route `<Outlet />` in `AppShell` with `<AnimatePresence mode="wait">`
- Each page wraps its root element with:
  ```tsx
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  />
  ```
- Keep it subtle — 8px vertical shift + 180ms opacity. Not a full slide, just enough motion to register.
- **Note:** `key` must be set to `location.pathname` on the wrapper for `AnimatePresence` to detect route changes.

---

## 3. Planning Step Wizard

**Current:** Step change does a `scrollTo` and swaps content instantly. Step indicators use `transition-colors` only.

### 3a. Step Content Transition
- Wrap each `StepXxx` component in a shared `<motion.div>`:
  ```tsx
  <motion.div
    key={step}
    initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
  />
  ```
- Track `direction` (1 = forward, -1 = back) in `planningStore` or local state
- `<AnimatePresence mode="wait">` wraps the step render

### 3b. Step Indicator Progress Bar
- Replace static circles with an animated progress connector line:
  - The line between circles fills from 0% to 100% width using `motion.div` with `scaleX` spring as step advances
  - Each circle uses `layoutId` so it smoothly repositions if layout changes
  - Active step circle: spring-animated `scale(1.15)` + ring pulse (one-shot expand-and-fade ring using `animate` keyframes)

### 3c. "Start Over" Destructive Confirm
- The `AlertDialog` open state can animate with a spring scale from 0.95 → 1.0 (shadcn dialog supports custom animation via `data-[state=open]` + tailwind-animate, or wrap DialogContent in `motion.div`)

---

## 4. Bottom Navigation

**Current:** Color-only active state. No animation on tab press or switch. Activity dot appears/disappears instantly.

**Fix:**
- **Active indicator pill:** Render a `motion.div` with `layoutId="nav-pill"` behind the active tab. It slides between tabs using layout animation — zero manual transition code needed.
- **Icon tap feedback:** Wrap each icon in `<motion.div whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>` for physical press feel
- **Activity dot:** Animate in with `initial={{ scale: 0 }} animate={{ scale: 1 }}` spring when `sessionActive` becomes true; reverse on false. Wrap in `<AnimatePresence>`.

---

## 5. Block Cards

**Current:** Static cards. No hover feedback. No press interaction. Expand sub-tasks is instant.

**Fix:**
- **Hover:** `whileHover={{ y: -2 }}` with `transition={{ type: 'spring', stiffness: 400, damping: 25 }}` — subtle lift
- **Press:** `whileTap={{ scale: 0.98 }}` for tactile press
- **Sub-task expand/collapse:** Replace `hidden` toggle with `motion.div` height animation:
  ```tsx
  <motion.div
    initial={false}
    animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
    style={{ overflow: 'hidden' }}
  />
  ```
- **Color stripe:** On card mount, animate left stripe width from 0 → 4px with a spring. Subtle but polished.
- Use `motion.li` with `layoutId` per block so reordering in `DayPresetEditor` animates positions.

---

## 6. Preset Cards (Day & Week Lists)

**Current:** Cards render instantly. No stagger. Delete is an instant DOM removal.

**Fix:**
- **Staggered list mount:** Wrap list in `motion.ul` and each card in `motion.li`:
  ```tsx
  // container
  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
  initial="hidden" animate="show"
  
  // item
  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
  ```
- **Delete:** `<AnimatePresence>` on the list. Deleted card exits with `{ opacity: 0, x: -20, height: 0 }` over 200ms. Use `layout` prop on remaining items to animate the gap closing.
- **Create:** New card enters with `{ opacity: 0, scale: 0.95 }` → animate to full.
- **Edit button hover:** `whileHover={{ scale: 1.1 }}` on icon buttons.

---

## 7. History Page

**Current:** Expand/collapse uses CSS grid-template-rows transition (200ms). Week cards are instant-mount.

**Fix:**
- **Week card stagger:** Same stagger pattern as preset cards above
- **Expand/collapse:** CSS grid transition is fine but brittle. Replace with `motion.div` + `animate={{ height: 'auto' | 0 }}` — more reliable across browsers
- **"Load earlier" button:** Use Magic UI `ShimmerButton` to make it visually distinct and satisfying to press
- **Load more transition:** New cards entering the list animate in from below with `y: 20 → 0`
- **Event items inside expanded card:** Stagger entry with 30ms delay per item

---

## 8. Loading States

**Current:** Plain text ("Loading…") or spinning `Loader2` icon. No skeleton screens.

**Fix — Skeleton Screens:**
- Create `SkeletonCard` component: rounded rect with Magic UI `Shimmer` effect (pulse gradient)
- Replace "Loading…" in `DayPresetList`, `WeekPresetList`, `HistoryPage`, `StepPresetPicker` with 3 skeleton cards
- Skeleton matches the real card height so layout doesn't shift on load
- Animate skeleton exit with `opacity: 0` and real content enter with `opacity: 0 → 1` via `AnimatePresence`

**Fix — Publish Loading:**
- Current: `Loader2 animate-spin` overlay
- Replace with a full-screen animated overlay using `motion.div`:
  - Backdrop fades in
  - Center content animates up from y: 16 → 0
  - Add a Magic UI `AnimatedCircularProgress` or simple animated dot trail to give sense of progress
  - Success state: green checkmark draws in via SVG `pathLength` animation (0 → 1)
  - Error state: red X with same SVG draw-in

---

## 9. Empty States

**Current:** Static dashed border box with icon + text. Generic and dead.

**Fix:**
- **Icons:** Animate the empty state icon on mount — `initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}` with spring bounce (`stiffness: 200, damping: 12`)
- **Text:** Stagger the icon and text lines with 80ms delay between
- **CTA button:** Use Magic UI `ShimmerButton` or `PulsatingButton` to draw attention to the primary action
- Specific improvements:
  - "No day presets" — animate the `Layers` icon with a subtle `rotate: [0, -10, 10, 0]` shake after mount (1.2s delay)
  - "No week presets" — `CalendarDays` icon with same treatment
  - "No published weeks yet" — use a subtle `y: [0, -4, 0]` float loop on the icon

---

## 10. Forms & Validation

**Current:** Validation errors appear/disappear instantly. No animated feedback. Color picker is native HTML5 `<input type="color">`.

**Fix:**
- **Error messages:** Wrap error text in `<AnimatePresence>`. Entry: `{ opacity: 0, y: -4 } → { opacity: 1, y: 0 }` over 150ms. Exit: reverse.
- **Input shake on invalid submit:** When form is submitted with errors, add a `x: [0, -8, 8, -8, 8, 0]` keyframe animation to the invalid inputs (120ms, spring-like)
- **Color picker:** Replace native `<input type="color">` in `BlockForm` with a custom swatch grid of 12 preset colours + a custom input. The selected swatch animates a ring with `scale: 1 → 1.15` spring.
- **Variable toggle switch:** The shadcn `Switch` slides correctly but add `whileTap={{ scale: 0.9 }}` to the container for press feedback.
- **Sub-task add:** New sub-task item enters with `{ opacity: 0, height: 0 } → { opacity: 1, height: 'auto' }`. Delete with reverse.

---

## 11. Dialogs / Modals

**Current:** shadcn default fade-in (via Tailwind animate plugin). Functional but generic.

**Fix:**
- Override `DialogContent` animation for main modals (DayPresetEditor, WeekPresetEditor, EditBlockDialog) with a scale + fade:
  ```tsx
  // Wrap DialogContent inner div with motion.div
  initial={{ opacity: 0, scale: 0.96, y: 8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96, y: 8 }}
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
  ```
- `AlertDialog` (destructive confirms): Same spring entry but exit is faster (100ms) since it's blocking
- **Backdrop:** `motion.div` with `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` (blur-sm) — currently `fixed inset-0 bg-background/80 backdrop-blur-sm`, add motion to the wrapper

---

## 12. Preset Picker (Step 1)

**Current:** Preset cards render all at once. Radio-select is transition-colors only.

**Fix:**
- Stagger card entry (same pattern as §6)
- **Selected state:** When a card becomes selected, animate the `border-primary` change with a spring-driven outline expansion using `motion.div` with `layoutId="selected-ring"` behind the selected card — it jumps between cards like the nav pill indicator
- **"Blank week" button:** Distinct styling using Magic UI `BorderBeam` border effect on hover

---

## 13. Week Preview (PreviewPage)

**Current:** View mode buttons (day/week/list) are `transition-colors`. No transition between views. Publish is covered in §8.

**Fix:**
- **View mode active indicator:** Same `layoutId` pill pattern as bottom nav — a pill slides between Day/Week/List buttons
- **View switch transition:** When switching views, outgoing view fades/slides out, incoming fades/slides in via `AnimatePresence mode="wait"` with `key={viewMode}`
- **Day view block positioning:** On day selection change, blocks in timeline animate position with `layout` prop
- **Timeline hour labels:** Fade in on mount with 20ms stagger per label

---

## 14. Step Review (Step 3)

**Current:** Block list renders instantly. Warning box is static.

**Fix:**
- **Block list:** Stagger block cards on mount (50ms per item)
- **Unfilled warning box:** Animate entry with `scale: 0.98 → 1` + `opacity: 0 → 1`. Use an amber `PulsatingBorder` (Magic UI) around it to draw attention
- **"Empty week" state:** Icon float animation (same as §9)

---

## 15. Header (AppShell)

**Current:** Static header — just "Meridian" text + sign out button. No visual interest.

**Fix:**
- Add `ThemeToggle` button (§1) to right side of header, left of "Sign out"
- **Sign out button:** Compact text link style currently. Keep minimal but add `whileHover={{ x: -2 }}` with `LogOut` icon shifting slightly left on hover
- **"Meridian" wordmark:** On app first load, animate in with a text reveal: characters appear left-to-right via Magic UI `TextReveal` or individual `motion.span` with stagger. Only plays once per session.
- **Offline banner:** Slide down from behind header with `y: -100% → 0` when going offline, reverse when reconnecting. Currently appears/disappears instantly.

---

## 16. Sign-In Page

**Current:** Static card centered on screen. Button changes text on loading.

**Fix:**
- **Card entry:** `initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}` with spring (stiffness: 200, damping: 20)
- **"Meridian" title:** Magic UI `GradientText` or animated gradient cycling through 2-3 brand colors
- **Google button:** `whileTap={{ scale: 0.97 }}` + Magic UI `ShimmerButton` treatment for the CTA
- **Loading state:** Spinner inside button should use `AnimatePresence` to swap "Sign in" text → spinner smoothly

---

## 17. VariableBlockForm (Step 2 Fill Blocks)

**Current:** Forms are static. Sub-task section toggle is instant show/hide.

**Fix:**
- **Day section headers:** Stagger animate in on mount (each day section 60ms apart)
- **Form cards:** Each `VariableBlockForm` enters with `{ opacity: 0, y: 12 } → { opacity: 1, y: 0 }` stagger
- **Sub-task toggle:** `motion.div` height animation (same as BlockCard §5)
- **Sub-task add/remove:** AnimatePresence with height animation per item
- **Error border:** `border-destructive` transition + input shake (§10)

---

## 18. DayPresetEditor Block Reorder

**Current:** Move up/down buttons with instant DOM reorder.

**Fix:**
- Wrap block list in a `Reorder.Group` from motion (formerly `motion/dist/react`):
  ```tsx
  <Reorder.Group axis="y" values={blocks} onReorder={handleReorder}>
    {blocks.map(block => (
      <Reorder.Item key={block.id} value={block}>
        ...
      </Reorder.Item>
    ))}
  </Reorder.Group>
  ```
- This replaces the move up/down buttons with native drag-to-reorder
- Keep the move buttons as fallback for accessibility
- Drag cursor changes to `grab` / `grabbing`
- Dragged item gets `scale: 1.02` + shadow elevation via `whileDrag={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}`

---

## 19. Colour System & Typography

**Current:** Relies entirely on shadcn/ui CSS variable defaults. No brand identity beyond "Meridian" text. `#6366f1` (indigo) hardcoded as default block colour.

**Fix:**
- **Brand colour:** Define `--color-brand` and `--color-brand-foreground` in `index.css` for both light/dark. Use across active states, CTAs, and key UI chrome.
- **Dark mode palette:** Audit the shadcn defaults — the `background` and `card` should be subtly differentiated (`card` slightly lighter than `background`) so depth is perceivable in dark mode. Currently they may flatten.
- **Typography scale:** Add a `text-display` utility class (28px, font-weight 600, tracking -0.02em) for page headings that currently use `text-2xl font-semibold tracking-tight`. Consistent across all pages.
- **Hardcoded indigo:** Replace `#6366f1` default in `BlockForm.tsx` with `var(--color-brand)` or a token.

---

## 20. Micro-interactions & Polish

Loose items that don't belong to one component but matter for feel:

| Location | Current | Fix |
|---|---|---|
| All icon buttons (edit, delete, move) | Static hover color | `whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}` |
| "Next" / "Back" buttons in planning steps | `transition-colors` | `whileTap={{ scale: 0.97 }}` + text doesn't flash on step change |
| Copy/paste text (block titles etc) | N/A | N/A |
| Number counts (preset card "3 blocks") | Static | Magic UI `NumberTicker` — animates count up when preset is saved with new block count |
| Checkmark "Saved" in editors | Static green tick | Draw-in animation: SVG `pathLength: 0 → 1` over 300ms |
| Delete confirm dialogs | Generic alert | Destructive icon (Trash2) with `x: [0, -4, 4, -4, 0]` shake on open |
| Publish success dialog | Text message | Large animated checkmark (SVG draw-in) + confetti burst via `canvas-confetti` (1 call, 2kb) |
| BottomNav mount | Instant | Slide up from `y: 100%` on initial app load, one-shot |
| `AppShell` offline banner | Instant appear | Slide down from header with height animation |

---

## 21. Accessibility & Focus

**Current:** No visible focus rings beyond browser defaults. No skip-links. No motion preference consideration.

**Fix:**
- Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to all interactive elements where missing
- Wrap ALL motion animations in a `prefers-reduced-motion` check:
  ```tsx
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const transition = prefersReduced ? { duration: 0 } : { type: 'spring', ... }
  ```
  Or use motion's built-in: `useReducedMotion()` hook and conditionally set `initial` to the final state.
- Add `aria-live="polite"` to step indicator so screen readers announce step changes
- Ensure dialog trapping (`Dialog` from shadcn already handles this, verify `EditBlockDialog` and `DayPresetEditor`)

---

---

## 22. Touch Target Sizes

**Current:** Icon buttons in `DayPresetEditor` and `BlockCard` use `h-7 w-7` (28px). iOS minimum tap target is 44×44px. Android minimum is 48×48dp. These fail both.

**Affected:** Edit/delete/move buttons in `DayPresetEditor.tsx`, expand button in `BlockCard.tsx`, pencil edit in `DayView.tsx` / `WeekView.tsx`.

**Fix:**
- Wrap small icon buttons in a `<button className="flex h-11 w-11 items-center justify-center">` container — the visual icon stays small, the tap area is compliant
- Or use Tailwind's `-m-2 p-2` negative margin trick to expand the hit area without changing layout
- Test on actual mobile device — this is not visible in desktop browser DevTools

---

## 23. Block Colour — Underused Visual Signal

**Current:** Block colour shows as a 1px left stripe on cards. At that width it's decorative noise, not information. Colour is the primary way users identify blocks at a glance but is barely visible.

**Fix:**
- Increase left stripe to 4px (`w-1` → `w-[4px]`) — minimum perceivable at small sizes
- In `DayView.tsx` timeline: blocks already use colour as background (`colour + '1a'` = 10% opacity fill). Increase opacity to 18–20% in light mode, 25% in dark mode for better contrast
- In `WeekView.tsx` and `ListView.tsx`: cards currently use `border-input` (grey) — replace with `border-[colour]` at 60% opacity so the colour is the card identity, not a stripe
- `BlockCard` sub-task section border (`border-l-2 border-border`) should inherit block colour at 40% opacity for visual coherence

---

## 24. Information Architecture — Day vs Week Presets

**Current:** `PresetsPage` shows two tabs (Day Presets / Week Presets) with no explanation of how they relate. New users face a blank slate with no guidance on which to create first and why.

**Problems:**
- Day presets must exist before a week preset can reference them — but nothing communicates this dependency
- Tab label "Day Presets" and "Week Presets" are opaque without context
- No visual connection between a week preset and the day presets it references

**Fix:**
- Add a one-line context header below the page title: "Build day templates first, then compose them into week schedules."
- In the "Week Presets" tab, if no day presets exist, show an inline prompt: "Create at least one day preset first." with a direct link to the Day Presets tab
- In `WeekPresetEditor`, day preset options in the dropdowns should show the block count + a colour preview strip (the first 4 block colours as small dots) so users can identify presets without memorising names

---

## 25. First-Run / Onboarding

**Current:** New user logs in → blank Presets page and empty planning flow. No guidance anywhere.

**Fix:**
- First-time state: if `dayPresets.length === 0` and `weekPresets.length === 0`, show an onboarding banner (dismissible, stored in `user_settings`) that explains the 3-step mental model: Create day template → Build a week → Plan Sunday
- The banner should have two CTA buttons: "Create my first day preset" (navigates to Presets tab and opens create dialog) and "Dismiss"
- Planning page with no presets: currently shows empty picker. Show a specific message: "No week presets yet. Head to Presets to build your first one." with a direct navigation button — the current message exists but lacks action
- Don't over-engineer this — a single contextual banner handles 90% of the onboarding problem

---

## 26. Primary Action Hierarchy in Navigation

**Current:** Bottom nav has 3 equal-weight tabs: Plan / Presets / History. "Plan" is the core weekly action but looks identical to the others. The only distinction is an activity dot when a session is active.

**Fix:**
- "Plan" tab should be visually heavier than Presets and History — larger icon (20px vs 16px), bolder label, or a distinct background pill treatment on the tab itself (not just when active)
- Consider a `+` or `▶` treatment on the Plan icon to signal "this is the thing you do" rather than "this is a place you browse"
- Alternatively: make the bottom nav 2 tabs (Presets, History) and give Plan a floating action button (FAB) in the bottom-right — the conventional mobile pattern for a primary recurring action
- Current activity dot is `h-2 w-2` (8px), hard to notice. Increase to 10px and use a pulsing ring treatment when session is active (not just a static dot)

---

## 27. Week View Mobile UX

**Current:** `WeekView.tsx` uses `min-w-[560px]` forcing horizontal scroll on mobile. 7 columns on a 375px phone = ~53px per column. Block titles are truncated to near-nothing. This view is functionally unusable on mobile.

**Fix:**
- On mobile (`< md` breakpoint), default the view to **List view** (not Week view) — it's the most readable on small screens
- Persist this per-device default in `uiStore` keyed to viewport width bracket, or just default `viewMode` to `'list'`
- The view switcher in `PreviewPage` should hide the "Week" option on mobile, or show it with a tooltip/warning: "Best on wider screens"
- If Week view is accessed on mobile, wrap it in a horizontal scroll container with a subtle gradient fade-out on the right edge to signal scrollability (currently there's no affordance that more content exists off-screen)

---

## 28. Colour Picker — Native vs Custom

**Current:** `BlockForm.tsx` uses `<input type="color">` (native HTML5 colour picker). On mobile this opens the OS colour picker — wildly inconsistent between iOS (hue wheel), Android (grid), and desktop. The hex value displays next to it but the UX is disconnected.

**Fix:**
- Replace with a curated swatch grid: 16 preset colours covering common block categories (work/blue, exercise/green, personal/purple, admin/grey, social/orange, learning/teal, etc.)
- Below the swatches, an expandable "Custom colour" section with a hex input field
- Default block colour on create should be the first unused colour from the swatch set, not always indigo — prevents all blocks defaulting to the same colour
- The current `#6366f1` hardcoded default in `BlockForm.tsx:defaultValues` should be replaced with this logic

---

## 29. Variable vs Fixed Block Visual Distinction

**Current:** Variable blocks show a `"Variable"` badge in preset editors. In the planning flow's fill-blocks step (Step 2), variable blocks get form fields. In the review/preview, variable and fixed blocks look identical — same card layout, same visual weight.

**Problems:**
- In the review step (`StepReview.tsx`), unfilled variable blocks show an amber warning but the block card itself looks the same as a filled one
- After publishing, in `PreviewPage`, there's no way to tell which blocks were variable (and therefore might change week-to-week) vs fixed

**Fix:**
- Variable blocks get a distinct visual treatment in all views: a subtle pattern or icon indicator (e.g., a small pencil icon in the top-right corner of the colour stripe) that signals "this was customised this week"
- In `StepReview.tsx`, unfilled variable blocks should show the placeholder text "(not filled)" in muted italic inside the card — currently the card just renders empty/default title, making the amber warning confusing
- In `VariableBlockForm.tsx`, the block card should have a subtle `border-dashed` treatment before the title is filled, transitioning to `border-solid` once a title is entered — clear progress signal

---

## 30. Planning Flow — Step 4 Redundancy

**Current:** Step 4 (`StepReview`) shows a summary of blocks, then "Go to preview" navigates to a separate `PreviewPage` that shows the same blocks in a calendar view. Two consecutive summary screens is redundant.

**Problems:**
- Step 3 already validates that variable blocks are filled
- Step 4 review adds friction without adding new information the user couldn't see in preview
- User has to pass through 5 decisions (select preset → select week → fill blocks → review → preview → publish confirm → publish result) for a weekly action that should feel fast

**Fix — Option A:** Remove Step 4. After Step 3 (fill blocks), "Next" navigates directly to `PreviewPage`. The amber unfilled-blocks warning moves to `PreviewPage` as a dismissible banner.

**Fix — Option B:** Merge Step 3 + 4. Fill blocks step shows the variable block forms AND a live preview panel side-by-side (on wider screens) or as a toggle (mobile). User fills then navigates directly to preview.

Recommended: Option A. Fewer steps for a recurring weekly action is always better.

---

## 31. Error Recovery — Poor Remediation

**Current:** Errors display messages ("Failed to load", "Something went wrong") but provide no recovery path. The top-level `ErrorBoundary` shows a "Reload" button but nothing more specific.

**Specific problems:**
- `DayPresetList` / `WeekPresetList`: "Failed to load presets" with no retry button
- `HistoryPage`: "Failed to load history" — no retry
- `PreviewPage` publish error: shows count of failed events but no "retry failed events" option
- Token expiry amber banner: tells user the problem but the "fix" (re-authenticate) isn't a button — user has to figure it out

**Fix:**
- Every error state should have a `<button onClick={() => refetch()}>Try again</button>` — TanStack Query exposes `refetch` from every `useQuery` result
- Token expiry banner: add a "Re-authenticate" button that calls `supabase.auth.signInWithOAuth({ provider: 'google', scopes: 'calendar.events' })` inline — don't make the user sign out and back in
- Top-level error boundary: add "Go to home" link alongside "Reload" so users aren't stuck if reload doesn't resolve it
- Publish partial failure: show a list of which events failed with a "Retry failed" button

---

## 32. Confirmation Feedback — Non-Publish Actions

**Current:** Saving a preset name shows a static green "Saved ✓" text (`nameSaved` state). Creating a block shows nothing — the dialog closes and the block appears. Deleting a preset closes the confirm dialog and removes the card.

**Problems:**
- No toast/snackbar system means feedback is either baked into the UI (the "Saved" text hack) or silent
- User can't tell if an async operation succeeded or failed unless they notice the UI change

**Fix:**
- Add a lightweight toast system — shadcn/ui ships `Sonner` (via `sonner` package) which is already compatible with the stack
- Replace the `nameSaved` boolean pattern with `toast.success('Preset saved')`
- Use toasts for: preset created, preset deleted, block added, block deleted, block reordered
- Keep toasts brief (2s) and bottom-positioned (above bottom nav, so `bottom: 72px`)
- Don't toast on every keystroke — only on confirmed async success/failure

---

## 33. Preset Editor UX — Modals Inside Modals

**Current:** `DayPresetEditor` is a Dialog. Adding/editing a block inside it opens `BlockForm` as a nested Dialog. Two dialogs stacked — the outer editor loses context on mobile.

**Fix:**
- On mobile: replace the nested block dialog with an inline expandable form that slides down within the editor — collapses when saved/cancelled
- On desktop: the current nested dialog is acceptable
- Use a breakpoint check (`useMediaQuery('(max-width: 640px)')`) to switch between the two patterns
- Alternatively: make `DayPresetEditor` a bottom sheet (slides up from bottom) on mobile — more natural than a center dialog for an editor with scrollable content

---

## 34. Native Select in WeekPresetEditor

**Current:** `WeekPresetEditor.tsx` uses native `<select>` elements for day-to-preset assignment. These are the only native form elements in the app — everything else uses shadcn/ui components.

**Problems:**
- Inconsistent styling between `<select>` and all other inputs
- On iOS, native `<select>` opens a full-screen picker wheel — jarring compared to the rest of the app
- Preset names in the options list have no visual decoration (no colour dots, no block count)

**Fix:**
- Replace with shadcn/ui `Select` (already in the component library at `src/components/ui/select.tsx`)
- Each option item should show: colour dot strip (first 3 block colours) + preset name + block count
- "None" option should be visually distinct (muted, italicised)

---

## 35. History Page — Information Density

**Current:** History shows week cards with a published-on timestamp and a flat list of event titles grouped by day. No summary stats, no pattern insight, no visual density.

**Problems:**
- "Published 3 days ago" is the most prominent info on the card — not useful
- The week date range (what week was this?) is rendered smaller than the publish timestamp
- No way to see total hours scheduled that week, or which presets were used

**Fix:**
- Flip the card hierarchy: week date range (`Mon 23 Jun – Sun 29 Jun`) is the H1, publish date is secondary meta
- Add a compact summary row to each card: total event count + total scheduled hours derived from Google Calendar event times — both calculable client-side from the events already fetched
- Add a colour strip across the top of each week card showing the first 6 block colours from that week — gives instant visual recognition of "which kind of week was this"
- "Load earlier" button placement: move it above a `--` divider at the bottom of the list, not directly below the last card (the current placement makes it look like it belongs to the last card)

---

## 36. AppShell Header — Wasted Space

**Current:** Header: left = "Meridian" text, right = "Sign out" button. That's it. 56px of vertical space that does almost nothing.

**Fix:**
- Right side: `ThemeToggle` + "Sign out" (small icon button with tooltip, not text label — saves 60px width)
- "Sign out" as text label is too easy to accidentally tap. Change to `LogOut` icon with a tooltip (`title="Sign out"`) and move it to a less prominent position
- On pages with a nested context (e.g., when `step > 1` in planning), the header could show the current step context: "Planning — Step 2 of 4" replacing or supplementing the "Meridian" title
- This makes the header earn its 56px

---

## 37. Block Time Display

**Current:** Block cards show `startTime – endTime` in `text-xs text-muted-foreground`. For a time-blocking app, the time is the most critical piece of information — it's styled as metadata.

**Fix:**
- Increase time display to `text-sm` and use `text-foreground` (not muted) so time is co-equal with block title
- In `DayView.tsx` timeline blocks: start time is shown in the block body but end time is not — add end time in smaller text or show duration (`1h 30m`) instead
- In `BlockCard`, show duration alongside the time range — `08:00 – 09:30 · 1h 30m` gives the user instant cognitive load information
- Duration calculation is trivial from `"HH:MM"` strings via the utilities in `src/lib/date.ts`

---

## 38. Planning Session Persistence

**Current:** `planningStore` persists to `localStorage` via Zustand persist. If a user starts a session Monday, returns Sunday, and opens the app — the stale session state is loaded. No expiry, no staleness check.

**Problem:** User sees Step 2 (fill blocks) for a week they already planned 6 days ago.

**Fix:**
- Add `sessionStartedAt: number` (unix timestamp) to `planningStore`
- On app load, if `sessionStartedAt` is older than 48 hours, auto-clear the store and start fresh
- Show a toast: "Previous planning session expired. Starting fresh." so the user isn't confused by the silent reset
- The `targetWeekStart` date should also be validated against the current date — if it's in the past, clear the session

---

## 39. "Nothing to Fill In" — Step 2 Edge Case

**Current:** If a user selects a week preset where all blocks are fixed (no variable blocks), Step 2 (`StepFillBlocks`) renders: "Nothing to fill in — all blocks are already defined." Then they click "Next" to go to Step 3.

**Problem:** An entire step of the wizard does nothing. User thinks they've missed something.

**Fix:**
- Auto-advance from Step 2 to Step 3 when there are no variable blocks — skip the step entirely
- Show a toast: "No variable blocks — skipped to review." so the user understands what happened
- Update the step indicator to visually mark Step 2 as "skipped" (grey with a dash, not the muted/incomplete circle) — communicates that the flow has fewer steps this week

---

## 40. Amber Colour Overuse

**Current:** Amber is used for two distinct severity levels:
1. **Token expiry banner** (`PreviewPage`) — high urgency, blocks publishing
2. **Unfilled variable blocks warning** (`StepReview`, `PreviewPage`) — medium urgency, non-blocking

Same colour, different severity.

**Fix:**
- Token expiry → keep amber (it's a hard blocker)
- Unfilled blocks warning → use `blue` (informational, not blocking). `border-blue-200 bg-blue-50 text-blue-700` in light mode, `dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300` in dark
- This establishes a semantic colour system: amber = warning/action required, blue = informational, destructive/red = error/data loss

---

## 41. Sub-Tasks — Discoverability

**Current:** Sub-tasks exist in `VariableBlockForm` and `EditBlockDialog` but are hidden behind a "Sub-tasks" toggle button that starts collapsed. In `BlockCard` they're also collapsed by default. The feature is invisible until discovered.

**Problem:** Users don't know sub-tasks exist. The planning flow doesn't surface them.

**Fix:**
- In `VariableBlockForm`, if the block has no sub-tasks yet, show the toggle as "Add sub-tasks" with a `+` icon — reads as an additive action, not a section reveal
- In `BlockCard`, if sub-tasks exist, show the first sub-task as a preview line even when collapsed: `• Ukrainian vocab review +2 more` — communicates content without forcing expansion
- On first expand, animate a short "pop" on the sub-task input so the user knows what to type

---

## Priority Order (Full — Animation + General)

| Priority | Section | Category | Effort | Impact |
|---|---|---|---|---|
| 1 | §1 Theme switcher | Animation | Low | High |
| 2 | §22 Touch targets | General | Low | Critical on mobile |
| 3 | §30 Remove Step 4 | General | Low | High — core flow friction |
| 4 | §3 Planning step transitions | Animation | Medium | High |
| 5 | §32 Toast system | General | Low | High — feedback gap |
| 6 | §29 Variable block distinction | General | Low | High |
| 7 | §5 Block card hover/press/expand | Animation | Low | High |
| 8 | §23 Block colour prominence | General | Low | High |
| 9 | §27 Week view mobile default | General | Low | High on mobile |
| 10 | §31 Error recovery | General | Low | Medium |
| 11 | §8 Skeleton loading | Animation | Medium | High |
| 12 | §37 Block time display | General | Low | Medium |
| 13 | §2 Page route transitions | Animation | Low | Medium |
| 14 | §34 Native select replacement | General | Low | Medium |
| 15 | §38 Session staleness | General | Low | Medium |
| 16 | §26 Plan tab hierarchy | General | Low | Medium |
| 17 | §4 Bottom nav pill + tap | Animation | Low | Medium |
| 18 | §39 Auto-skip Step 2 | General | Low | Low |
| 19 | §40 Amber overuse | General | Low | Low |
| 20 | §6 Preset list stagger + delete | Animation | Low | Medium |
| 21 | §28 Colour picker | General | Medium | Medium |
| 22 | §35 History page density | General | Medium | Medium |
| 23 | §36 Header UX | General | Low | Low |
| 24 | §24 IA — day vs week presets | General | Low | Medium (new users) |
| 25 | §25 First-run onboarding | General | Medium | Medium (new users) |
| 26 | §33 Modal stacking | General | Medium | Medium on mobile |
| 27 | §7 Publish success animation | Animation | Medium | High |
| 28 | §11 Dialog spring animations | Animation | Low | Medium |
| 29 | §18 Drag reorder | Animation | Medium | Medium |
| 30 | §41 Sub-tasks discoverability | General | Low | Low |
| 31 | §9 Empty state animations | Animation | Low | Low |
| 32 | §19 Colour system audit | General | Medium | Medium — foundational |
| 33 | §21 Accessibility / reduced-motion | General | Low | Required |
