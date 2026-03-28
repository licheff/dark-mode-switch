# ThemeToggleBulb — Design Spec

**Date:** 2026-03-28
**Status:** Draft

---

## Overview

A second theme toggle variant (`ThemeToggleBulb`) for the `dark-mode-switch` project. The animation lives entirely on the button itself rather than the page — the button looks and behaves like a light bulb, glowing warm amber in light mode and dimming in dark mode. The page theme still changes, with a soft warm-bloom page transition (a blurred ripple) to complement the bulb aesthetic.

Follows the same copy-paste pattern as `ThemeToggleRipple`.

---

## Stack

No new dependencies. Same as the existing project:

- React 19 + TypeScript
- Tailwind CSS v4
- next-themes (`useTheme`)
- lucide-react (`Lightbulb` icon)
- View Transitions API (with graceful fallback)

---

## File

`src/components/ThemeToggleBulb.tsx`

CSS additions go into the existing `src/index.css`.

---

## Component: ThemeToggleBulb

### Props

Same interface as `ThemeToggleRipple`:

| Prop        | Type                    | Default | Description                       |
|-------------|-------------------------|---------|-----------------------------------|
| `size`      | `'sm' \| 'md' \| 'lg'` | `'md'`  | Controls icon, button, and halo size |
| `className` | `string`                | `''`    | Applied to the `<button>` element |

### Size config

| Size | Icon  | Button      | Halo diameter |
|------|-------|-------------|---------------|
| sm   | 16px  | 32×32px     | ~64px         |
| md   | 20px  | 44×44px     | ~88px         |
| lg   | 24px  | 48×48px     | ~96px         |

Halo is roughly 2× the button diameter so it scales proportionally.

---

## Button Visual Design

The button contains two stacked layers:

1. **Halo span** — absolutely positioned behind the icon. A circular radial gradient from `amber-300` to `transparent`. Animates in/out on theme change.
2. **Lightbulb icon** — from lucide-react. Color transitions between lit (`text-amber-400`) and unlit (`text-zinc-400`).

### Lit state (light mode)

- Halo: `opacity-100 scale-100`
- Icon: `text-amber-400`

### Unlit state (dark mode)

- Halo: `opacity-0 scale-75`
- Icon: `text-zinc-400`

### Transitions

All driven by Tailwind utility classes — no JS animation. The `isDark` boolean determines which classes apply; React re-renders on theme change and Tailwind's `transition-all duration-300` handles the interpolation.

- Turning **on** (→ light): ease-out, ~300ms. Halo blooms outward, icon warms up.
- Turning **off** (→ dark): ease-in, ~300ms. Halo contracts, icon cools.

---

## Page Transition: Soft Bloom Ripple

Uses the View Transitions API with `types` to scope its CSS separately from the ripple variant, so both can coexist in `index.css` without conflict.

### JS (in `handleClick`)

```ts
const vt = (document as Document & {
  startViewTransition?: (options: { update: () => void; types?: string[] }) => void
}).startViewTransition

if (vt) {
  vt.call(document, { update: () => setTheme(nextTheme), types: ['bulb-transition'] })
} else {
  setTheme(nextTheme)
}
```

`types` is a Chrome 125+ feature. Browsers that support `startViewTransition` but not `types` will call it without the object form — this needs a feature-detect: if `startViewTransition` accepts an object, use the typed form; otherwise fall back to the callback form (which uses the standard ripple CSS, acceptable degradation).

### CSS

```css
::view-transition-new(root):active-view-transition-type(bulb-transition) {
  clip-path: circle(0px at var(--ripple-x, 50%) var(--ripple-y, 50%));
  filter: blur(40px);
  animation: bulb-bloom 0.6s ease-in-out forwards;
}

::view-transition-old(root):active-view-transition-type(bulb-transition) {
  animation: none;
}

@keyframes bulb-bloom {
  to {
    clip-path: circle(var(--ripple-radius, 100vmax) at var(--ripple-x, 50%) var(--ripple-y, 50%));
    filter: blur(0px);
  }
}
```

The blur starts at 40px and animates to 0px as the circle expands — giving a warm, soft-edged bloom that sharpens as it fills the viewport.

### Ripple variable setup

Identical to `ThemeToggleRipple` — set `--ripple-x`, `--ripple-y`, `--ripple-radius` from `getBoundingClientRect()` before calling `startViewTransition`.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root):active-view-transition-type(bulb-transition),
  ::view-transition-old(root):active-view-transition-type(bulb-transition) {
    animation: none;
    filter: none;
  }
}
```

### Browser support / fallback chain

1. Chrome 125+ / Edge 125+: full typed transition with soft bloom
2. Chrome 111–124 / Safari 18+ / Firefox 130+: `startViewTransition` without types — uses standard ripple CSS (hard edge), acceptable degradation
3. No View Transitions support: instant theme swap, button animation still plays

---

## Accessibility

- `aria-label`: `"Switch to dark mode"` in light mode, `"Switch to light mode"` in dark mode
- Touch targets: same as `ThemeToggleRipple` (`md` = 44×44px WCAG minimum)
- `prefers-reduced-motion`: page transition animation suppressed; button animation (halo/icon color) still plays since it's not disorienting

---

## Demo Page

Update `App.tsx` to render both variants side by side so they can be compared visually.

---

## Reusability

To copy `ThemeToggleBulb` into another project:

1. Copy `ThemeToggleBulb.tsx` into the target project's components folder
2. Ensure `lucide-react` and `next-themes` are installed
3. Add the bulb-transition CSS block to the project's global stylesheet
4. Confirm `ThemeProvider` wraps the app with `attribute="class"`
