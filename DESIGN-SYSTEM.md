# Warp Tools — Design System

This is the visual contract for all Warp Tools systems. Every app, every component, every screen must follow these rules. The goal is visual consistency across all systems — a user moving from Carrier Management to Invoice Tracker should feel like they're in the same product.

**If you're building or reviewing UI for Warp Tools, this is your reference.**

---

## Design Philosophy

1. **Dark-first, anti-enterprise** — This should feel like Linear or Raycast, not SAP or Oracle. Deep dark backgrounds, sharp accent colors, clean typography.
2. **Information-dense but not cluttered** — Show data, don't hide it. But use spacing, hierarchy, and grouping to prevent overwhelm.
3. **Obvious interactivity** — Every clickable thing must look clickable. Buttons look like buttons. Links look like links. No mystery meat navigation.
4. **Consistent feedback** — Every user action gets a response: toast for mutations, loading states for fetches, inline errors for validation.

---

## Color Palette

### Core Colors

| Token | Hex | CSS Variable | Tailwind | Usage |
|-------|-----|-------------|----------|-------|
| Background | `#040810` | `--bg` | `bg-warp-bg` | Page background |
| Card | `#080F1E` | `--card` | `bg-warp-card` | Cards, panels, modals, dropdowns |
| Card Hover | `#0C1528` | `--card-hover` | `bg-warp-card-hover` | Hovered cards, selected rows |
| Border | `#1A2235` | `--border` | `border-warp-border` | All borders, dividers, separators |
| Muted Text | `#8B95A5` | `--muted` | `text-warp-muted` | Secondary text, labels, timestamps |
| Body Text | `#E2E8F0` | — | `text-slate-200` | Primary body text |
| Heading Text | `#FFFFFF` | — | `text-white` | Headings, emphasis, important values |

### Semantic Colors

| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Accent / Success | `#00C650` | `--accent` | Primary actions, active states, success, positive metrics |
| Warning | `#FFAA00` | `--warning` | Expiring soon, caution states, medium-priority alerts |
| Danger | `#FF4444` | `--danger` | Errors, expired, destructive actions, critical alerts |
| Info | `#4B8EE8` | — | Informational toasts, help text, links |

### Color Usage Rules

- **Never use raw hex in components.** Use CSS variables (`var(--accent)`) or Tailwind tokens (`text-warp-accent`).
- **Semantic colors have a 10% opacity background variant** for badges: `bg-[#00C650]/10 text-[#00C650]`
- **Accent green is ONLY for**: primary buttons, active status, success states, positive metrics. Don't use it decoratively.
- **Red is ONLY for**: errors, expired states, destructive actions (delete). Not for emphasis or decoration.
- **Glow shadow** (`shadow-warp-glow`) is used sparingly — only on primary CTAs and hero elements.

---

## Typography

### Font Stack

- **Body**: Inter (weights: 300, 400, 500, 600, 700)
- **Monospace**: JetBrains Mono (weights: 400, 500) — for IDs, codes, technical values

### Type Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-2xl font-bold` | 24px / Bold | — | Page titles (h1) |
| `text-xl font-semibold` | 20px / Semibold | — | Section headings (h2) |
| `text-lg font-medium` | 18px / Medium | — | Card titles, modal titles |
| `text-sm` | 14px / Regular | — | **Default body text** — most UI text |
| `text-xs` | 12px / Regular | — | Labels, badges, timestamps, metadata |
| `text-xs font-medium uppercase tracking-wider` | 12px / Medium | — | Table column headers |

### Typography Rules

- **Default text size is `text-sm` (14px)**, not `text-base` (16px). This is denser than typical web — intentional.
- **Headings are white**, body text is `slate-200`, secondary text is `warp-muted`.
- **Monospace** for: MC numbers, DOT numbers, UUIDs, API endpoints, currency amounts.
- **Never use font-light (300)** for body text — only for large decorative numbers or hero stats.

---

## Spacing

### Base Unit: 4px

All spacing follows a 4px grid. Use Tailwind's built-in spacing scale:

| Token | Value | Common Usage |
|-------|-------|-------------|
| `p-1` / `gap-1` | 4px | Icon padding, tight inline gaps |
| `p-1.5` / `gap-1.5` | 6px | Badge padding, small component internal |
| `p-2` / `gap-2` | 8px | Between inline elements, small card padding |
| `p-3` / `gap-3` | 12px | List item padding, form field gaps |
| `p-4` / `gap-4` | 16px | **Default card padding**, section gaps |
| `p-6` / `gap-6` | 24px | Page section margins, large card padding |
| `p-8` / `gap-8` | 32px | Page-level vertical spacing |

### Spacing Rules

- **Card internal padding: `p-4`** (16px) — consistent everywhere.
- **Gap between cards/sections: `gap-4`** (16px) or `gap-6` (24px).
- **Form field gap: `gap-3`** (12px) between label-input pairs, `gap-4` (16px) between field groups.
- **Table cell padding: `px-4 py-3`** — horizontal 16px, vertical 12px.
- **Page padding: `p-6`** (24px) on desktop, `p-4` (16px) on mobile.

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 6px | Buttons, inputs, badges, small elements |
| `rounded-lg` | 8px | Dropdowns, tooltips |
| `rounded-xl` | 12px | Cards, modals, toasts — `rounded-warp` alias |
| `rounded-full` | 999px | Avatars, circular indicators |

**Rule:** Cards and modals use `rounded-xl`. Buttons and inputs use `rounded-md`. Don't mix.

---

## Shadows

| Token | Usage |
|-------|-------|
| `shadow-warp-card` | Default card elevation: `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` |
| `shadow-warp-glow` | Accent glow for primary CTAs: `0 0 20px rgba(0,198,80,0.15)` |
| `shadow-2xl` | Modals, toasts, floating elements |

---

## Component Patterns

### Layout

Every app uses the same shell:

```
┌──────────────────────────────────────────┐
│  Sidebar (240px)  │  Main Content        │
│                   │                      │
│  [Logo/Name]      │  Page Title    [CTA] │
│  [Nav Item 1] ●   │                      │
│  [Nav Item 2]     │  ┌────────────────┐  │
│  [Nav Item 3]     │  │  Content Area  │  │
│  [Nav Item 4]     │  │                │  │
│                   │  │                │  │
│                   │  └────────────────┘  │
└──────────────────────────────────────────┘
```

- **Sidebar**: Fixed left, `w-60`, `bg-warp-card`, `border-r border-warp-border`. Collapsible on mobile.
- **Main content**: Fills remaining width. Page padding `p-6`. Max-width optional.
- **Page header**: Title left, primary action button right. `mb-6` below header.

### Cards

```html
<div class="bg-warp-card border border-warp-border rounded-xl p-4">
  <!-- Card content -->
</div>
```

- Hover state: `hover:bg-warp-card-hover` and/or `hover:border-warp-accent/30`
- Clickable cards: Add `cursor-pointer transition-colors`
- Card sections: Separated by `border-t border-warp-border` with `pt-4 mt-4`

### Tables

- Header: `bg-warp-card` sticky, `text-xs font-medium uppercase tracking-wider text-warp-muted`
- Rows: `hover:bg-warp-card-hover transition-colors`
- Cell padding: `px-4 py-3`
- Clickable rows: `cursor-pointer`
- Borders: `border-b border-warp-border` between rows (no vertical borders)

### Buttons

| Type | Classes | When to use |
|------|---------|-------------|
| Primary | `bg-warp-accent text-white hover:bg-warp-accent/90 rounded-md px-4 py-2 text-sm font-medium` | One per page. The main action. |
| Secondary | `bg-warp-card border border-warp-border hover:bg-warp-card-hover rounded-md px-4 py-2 text-sm` | Supporting actions, filters, cancel |
| Danger | `bg-warp-danger/10 text-warp-danger border border-warp-danger/20 hover:bg-warp-danger/20 rounded-md px-3 py-1.5 text-sm` | Delete, remove, destructive actions |
| Ghost | `text-warp-muted hover:text-white transition-colors` | Icon buttons, dismiss, subtle actions |

**Rules:**
- **One primary button per visible area.** If there are two green buttons, one should be secondary.
- **Destructive buttons use danger variant**, never primary green.
- **All buttons have hover states.** No button should feel dead on hover.
- **Loading state**: Replace text with spinner, disable button, prevent double-click.

### Forms

- **Labels**: `text-xs font-medium text-warp-muted uppercase tracking-wider mb-1`
- **Inputs**: `bg-warp-bg border border-warp-border rounded-md px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:border-warp-accent focus:ring-1 focus:ring-warp-accent`
- **Error state**: `border-warp-danger` on input, `text-warp-danger text-xs mt-1` for message
- **Required fields**: Marked with `*` after label
- **Field layout**: Stack vertically with `gap-3`, use grid for related fields (city + state)

### Badges (StatusBadge)

Pattern: `bg-{color}/10 text-{color} border border-{color}/20 rounded-md px-2 py-0.5 text-xs font-medium`

| State | Color |
|-------|-------|
| Active, Satisfactory, Compliant | Green (`#00C650`) |
| Expiring Soon, Conditional, Warning | Yellow (`#FFAA00`) |
| Expired, Blacklisted, Unsatisfactory, Revoked | Red (`#FF4444`) |
| Inactive, Unknown, Not Rated | Muted (`#8B95A5`) |

### Modals

- Overlay: `bg-black/60 backdrop-blur-sm`
- Modal: `bg-warp-card border border-warp-border rounded-xl shadow-2xl max-w-lg w-full mx-4`
- Header: Title + close button (X icon, top-right)
- Footer: Cancel (secondary) left, Submit (primary) right
- Animation: Fade in overlay, scale up modal

### Toasts

- Position: Fixed `bottom-4 right-4`
- Style: `bg-warp-card border border-warp-border rounded-xl` with colored left accent bar
- Types: Success (green), Error (red), Info (blue)
- Auto-dismiss: 3 seconds
- Animation: Slide in from right

---

## Interaction Patterns

### CRUD Operations

| Operation | UI Pattern | Feedback |
|-----------|-----------|----------|
| **Create** | Navigate to `/new` page OR open modal from list/detail | Toast "Created successfully", redirect to detail |
| **Read** | List page with table/cards, detail page with tabs | Loading skeleton while fetching |
| **Update** | Navigate to `/edit` page OR open pre-filled modal | Toast "Updated successfully", stay on page |
| **Delete** | Click delete icon → Confirmation dialog ("Are you sure?") | Toast "Deleted", redirect to list |

### Sub-entity CRUD (contacts, insurance, rates on a detail page)

| Operation | UI Pattern |
|-----------|-----------|
| **Add** | "Add [entity]" button in tab → Modal with form |
| **Edit** | Edit icon on row/card → Pre-filled modal |
| **Delete** | Delete icon on row/card → Confirmation dialog |

**Rule:** Sub-entities are ALWAYS managed via modals on the detail page. Never navigate away from the detail page to manage a sub-entity.

### Empty States

Every list/table MUST have an empty state:

```html
<div class="text-center py-12">
  <IconPlaceholder class="mx-auto h-12 w-12 text-warp-muted/30 mb-4" />
  <h3 class="text-sm font-medium text-white mb-1">No carriers yet</h3>
  <p class="text-sm text-warp-muted mb-4">Add your first carrier to get started.</p>
  <button class="[primary button styles]">Add Carrier</button>
</div>
```

### Loading States

- **Page load**: Skeleton shimmer (not spinners). Match the layout of the loaded state.
- **Button submit**: Replace text with small spinner, disable button.
- **Table/list fetch**: Skeleton rows matching table structure.
- **Never show a blank white/dark page while loading.**

### Error States

- **Form validation**: Inline below the field, red text, `text-xs text-warp-danger mt-1`
- **API errors**: Toast with error type, or inline error banner at top of form
- **Page-level errors**: Full-width error card with retry button
- **Network errors**: "Something went wrong. Please try again." with Retry button

### Confirmation Dialogs

Required before any **destructive** action (delete, remove, blacklist):

```
┌────────────────────────────────┐
│  Delete Carrier?               │
│                                │
│  This will permanently delete  │
│  "Swift Transport LLC" and     │
│  all associated data.          │
│                                │
│  [Cancel]        [Delete]      │
└────────────────────────────────┘
```

- Cancel = secondary button (left)
- Destructive action = danger button (right)
- Describe exactly what will happen

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | `< 768px` | Single column, cards instead of tables, bottom nav or hamburger menu |
| Tablet | `768px – 1024px` | Sidebar collapsed by default, tables with fewer columns |
| Desktop | `> 1024px` | Full sidebar, full tables, all columns visible |

### What Changes on Mobile

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | Fixed left, always visible | Hidden, hamburger menu toggle |
| Tables | Full table with all columns | Cards with key info, expandable |
| Page header | Title + CTA on same row | Title stacked above CTA |
| Form layout | 2-3 column grid | Single column stack |
| Modals | Centered with max-width | Full-width, bottom sheet style |
| Pagination | Full page numbers | Prev/Next only |

### Responsive Rules

- **Test every screen at 375px, 768px, and 1440px.**
- **Tables → Cards on mobile**: Don't just hide columns. Transform the data into a card layout.
- **Touch targets: minimum 44px × 44px** on mobile for all interactive elements.
- **No horizontal scroll** at any breakpoint. Ever.

---

## Animations & Transitions

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Hover states | Color/background transition | `150ms` | `ease` |
| Modals | Fade in + scale up | `200ms` | `ease-out` |
| Toasts | Slide in from right | `250ms` | `ease-out` |
| Page elements | Fade in + slide up 4px | `200ms` | `ease-out` |
| Sidebar collapse | Width transition | `200ms` | `ease-in-out` |

**Rules:**
- **Every interactive element has a transition.** No instant state changes.
- **Animations are subtle.** 200ms max duration. No bouncing, no rotating, no dramatic entrances.
- **Reduce motion**: Respect `prefers-reduced-motion` — disable animations when set.

---

## Accessibility

- **Contrast**: All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Our palette passes.
- **Focus rings**: `outline: 2px solid var(--accent)` with `outline-offset: 2px`. Visible on all interactive elements.
- **Keyboard navigation**: Every interactive element reachable via Tab. Modals trap focus.
- **ARIA labels**: Icon-only buttons must have `aria-label`. Status badges should have `role="status"`.
- **Screen readers**: Toasts use `aria-live="polite"`. Error messages linked to inputs via `aria-describedby`.

---

## UX Heuristics Checklist

Run this against every screen during the audit phase. Based on Nielsen's heuristics, adapted for Warp Tools.

```
Visual Hierarchy:
[ ] Most important element is visually dominant (largest, highest contrast, most prominent position)
[ ] Primary action (CTA) is immediately obvious — one green button, visually distinct
[ ] Information flows top-to-bottom, left-to-right in logical priority
[ ] Related items are grouped together, unrelated items are separated by whitespace

Consistency:
[ ] Same component used for same purpose everywhere (same badge style, same button style)
[ ] Same spacing between same types of elements
[ ] Color usage is consistent (green = positive, red = negative, yellow = warning)
[ ] Same interaction pattern for same type of action (modals for sub-entity CRUD)

Feedback:
[ ] Every click on a button produces visible feedback (loading state, toast, navigation)
[ ] Form submission shows success or error within 200ms (or loading state)
[ ] Destructive actions require confirmation
[ ] Hovering interactive elements changes their appearance

Error Prevention:
[ ] Required fields are marked
[ ] Validation happens before submission (client-side) and on submit (server-side)
[ ] Delete shows what will be deleted in the confirmation dialog
[ ] Form doesn't lose data on navigation (or warns user)

Clarity:
[ ] No jargon without explanation
[ ] Placeholder text in inputs shows expected format
[ ] Empty states explain what to do, not just "no data"
[ ] Labels are descriptive ("Add Carrier" not just "+")

Polish:
[ ] No placeholder text (Lorem ipsum, TODO, etc.)
[ ] No broken images or missing icons
[ ] No layout overflow or clipping at any viewport width
[ ] Scrollbar styled to match dark theme
[ ] No flash of unstyled content on page load
```
