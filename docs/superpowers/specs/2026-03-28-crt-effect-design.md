# CRT Monitor Effect — Design Spec

**Date:** 2026-03-28
**Status:** Draft

---

## Overview

A new theme toggle variant (`ThemeToggleCRT`) that imitates a CRT monitor turning on and off. Switching to dark mode collapses the screen to a horizontal white line at center; switching to light mode expands from that line. Built as a self-contained component following the same pattern as `ThemeToggleBulb`.

---

## Stack

Same as existing project:

- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + inline styles for the overlay
- **Icons:** `Power` from lucide-react
- **Theme management:** next-themes (`resolvedTheme`)

No new dependencies.

---

## Component: ThemeToggleCRT

**File:** `src/components/ThemeToggleCRT.tsx`

### Props

| Prop        | Type                    | Default | Description                        |
|-------------|-------------------------|---------|------------------------------------|
| `size`      | `'sm' \| 'md' \| 'lg'` | `'md'`  | Controls icon and button size      |
| `className` | `string`                | `''`    | Applied to the `<button>` element  |

Same size breakdown as existing variants:

| Size | Icon  | Button        |
|------|-------|---------------|
| sm   | 16px  | 32×32px       |
| md   | 20px  | 44×44px       |
| lg   | 24px  | 48×48px       |

### Behavior

1. Reads `resolvedTheme` via `useTheme()` — handles system theme correctly (same as `ThemeToggleBulb`)
2. **Mounted guard:** returns `null` until `resolvedTheme` is defined
3. **No `useRef` needed:** unlike `ThemeToggleBulb`, the CRT overlay is always screen-centered — no button position is needed, so no `buttonRef` is required
4. **Icon:** `Power` from lucide-react
   - Light mode: dark/slate color (`text-zinc-700`)
   - Dark mode: white (`text-white`)
4. On click:
   - If `prefers-reduced-motion` is set: calls `setTheme(nextTheme)` directly, no animation
   - Otherwise: injects a DOM overlay and runs the CRT animation (see below)

### Accessibility

- `aria-label`: `"Switch to dark mode"` in light mode, `"Switch to light mode"` in dark mode
- `prefers-reduced-motion`: animation skipped entirely; theme switches instantly

---

## Animation: CRT Overlay

A `<div>` is injected into `document.body` with the following fixed inline styles:

```
position: fixed
inset: 0
background: white
transform-origin: center center
box-shadow: 0 0 60px 30px white   ← the CRT phosphor bloom glow
z-index: 9999
pointer-events: none
```

The animation name (`crt-off` or `crt-on`) and duration are set via the `animation` inline style property.

### Going dark (`crt-off`, 500ms total)

```
setTimeout(() => setTheme('dark'), 300)   ← switches as the line forms
setTimeout(() => overlay.remove(), 500)
```

The overlay collapses vertically from full-screen to a ~2px line (via `scaleY`), holds briefly as the line, then fades out. The theme switches at 300ms — at the moment vertical collapse completes — so dark mode "appears" behind the vanishing line.

### Going light (`crt-on`, 500ms total)

```
setTimeout(() => setTheme('light'), 50)   ← switches almost immediately
setTimeout(() => overlay.remove(), 500)
```

The overlay starts as a ~2px line and expands vertically to full-screen while fading. The theme switches at 50ms while the line is tiny, so the expansion "reveals" light mode underneath.

---

## CSS Keyframes

Added to `src/index.css`:

```css
@keyframes crt-off {
  0%   { transform: scaleY(1);     opacity: 1; }
  75%  { transform: scaleY(0.002); opacity: 1; }
  100% { transform: scaleY(0.002); opacity: 0; }
}

@keyframes crt-on {
  0%   { transform: scaleY(0.002); opacity: 1; }
  75%  { transform: scaleY(1);     opacity: 1; }
  100% { transform: scaleY(1);     opacity: 0; }
}
```

`crt-on` holds `opacity: 1` through the full expansion so the white screen properly fills before fading — without this, the overlay fades while growing and the effect reads as a weak shimmer rather than a screen powering on.

`transform-origin: center center` ensures the collapse/expansion is always from the vertical midpoint of the screen.

The overlay `animation` inline style includes `forwards` fill mode (`animation: crt-off 500ms ease-in forwards`) to prevent any visible state between the animation end and the `setTimeout` removal.

**Easing:** `ease-in` for `crt-off` (abrupt collapse feels mechanical, like power cut), `ease-out` for `crt-on` (expansion decelerates as the phosphor fills).

**Overlay color:** `background: white` is used for both directions. For `crt-off` this is a white flash that collapses on a light background. For `crt-on` it starts as a white line on a dark background — intentional, as the phosphor line is the brightest part of a CRT powering on.

**Reduced motion:** the existing `@media (prefers-reduced-motion: reduce)` block in `index.css` does not need updating — the component checks `window.matchMedia` directly and skips the overlay entirely.

---

## Integration: App.tsx

Add one entry to the `variants` map:

```ts
crt: { label: 'CRT', component: ThemeToggleCRT },
```

And update `VariantKey`:

```ts
type VariantKey = 'ripple' | 'bulb' | 'crt'
```

The Select dropdown and rendering logic update automatically.

---

## File Changes

| File | Action | Change |
|------|--------|--------|
| `src/components/ThemeToggleCRT.tsx` | Create | New component |
| `src/components/ThemeToggleCRT.test.tsx` | Create | Component tests — follow `ThemeToggleBulb.test.tsx` as reference: mounted guard renders null, correct aria-label per theme, overlay injected on click, `setTheme` called with correct value, reduced-motion skips overlay |
| `src/index.css` | Edit | Add `crt-off` and `crt-on` keyframes |
| `src/App.tsx` | Edit | Register `crt` variant |
