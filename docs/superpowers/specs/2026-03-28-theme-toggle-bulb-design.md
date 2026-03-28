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

| Size | Icon  | Button      | Halo `w`/`h` (Tailwind) |
|------|-------|-------------|-------------------------|
| sm   | 16px  | 32×32px     | `w-16 h-16` (64px)      |
| md   | 20px  | 44×44px     | `w-20 h-20` (80px)      |
| lg   | 24px  | 48×48px     | `w-24 h-24` (96px)      |

The halo `span` uses `position: absolute`, `rounded-full`, explicit `w`/`h` from the table above, and is centered on the button via `inset-0 m-auto`. No `scale` transforms for sizing — just fixed dimensions.

---

## Button Visual Design

The button has `position: relative` and `overflow: visible` so the halo can bleed outside its bounds. It contains two stacked layers:

1. **Halo span** — `absolute inset-0 m-auto rounded-full` with explicit `w`/`h` per size config. Background is a radial gradient from `amber-300` to `transparent` (inline style or a Tailwind v4 arbitrary value). Animates `opacity` and `scale` on theme change.
2. **Lightbulb icon** — from lucide-react, rendered in a `relative` `span` so it sits above the halo in stacking order. Color transitions between lit (`text-amber-400`) and unlit (`text-zinc-400`).

### `isDark` derivation

Use `resolvedTheme` (not `theme`) from `useTheme()`. `theme` may be `"system"` while the actual resolved value is `"dark"` — using `theme` directly would render the wrong state for system-preference users.

```ts
const { resolvedTheme, setTheme } = useTheme()
if (!resolvedTheme) return null  // mounted guard
const isDark = resolvedTheme === 'dark'
```

### Lit state (light mode)

- Halo: `opacity-100 scale-100`
- Icon: `text-amber-400`

### Unlit state (dark mode)

- Halo: `opacity-0 scale-75`
- Icon: `text-zinc-400`

### Transitions

All driven by Tailwind utility classes — no JS animation. The `isDark` boolean determines which classes apply; Tailwind's `transition-all duration-300` handles the interpolation.

- Turning **on** (→ light): ease-out, ~300ms. Halo blooms, icon warms.
- Turning **off** (→ dark): ease-in, ~300ms. Halo contracts, icon cools.

### Hover state

Hover behavior differs by theme. Class breakdown:

**Button element:**
- Both modes: `group` (enables `group-hover:` on children)
- Lit mode only: `hover:scale-110` — add this conditionally in JSX when `!isDark`

**Halo span:**
- Dark mode only: `group-hover:opacity-40 group-hover:scale-90` — hints the bulb can turn on
- Lit mode: no additional hover class needed (opacity/scale are already at max)

**Icon span:**
- Dark mode only: `group-hover:text-zinc-300`
- Lit mode: `group-hover:opacity-80`

Apply all hover classes conditionally in JSX based on `isDark` to avoid conflicts between the two systems. Do not combine self-hover (`hover:`) and `group-hover:` on the same element for the same property.

### Focus state

The button uses `focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:outline-none`. This ensures a visible amber ring on keyboard navigation, consistent with the warm color palette. The default browser outline is removed (`outline-none`) only in combination with the explicit `focus-visible` ring.

### `prefers-reduced-motion`

The halo/icon color animation (`transition-all`) is kept even under `prefers-reduced-motion`. This is a deliberate choice: the transition is a color/opacity fade with no spatial movement, which is generally considered non-disorienting. WCAG 2.3 AAA targets may need to reconsider this.

---

## Page Transition: Soft Bloom Ripple

Uses the View Transitions API with `types` to scope its CSS separately from the ripple variant, so both coexist in `index.css` without conflict.

### JS (`handleClick`)

Structure mirrors `ThemeToggleRipple.handleClick`. The bulb component uses its own CSS custom properties (`--bulb-x`, `--bulb-y`, `--bulb-radius`) rather than the shared ripple variables. Both components render simultaneously on the demo page — sharing variables would create a race condition where clicking one mid-transition overwrites the other's animation coordinates.

```ts
const handleClick = () => {
  if (!buttonRef.current) return

  const rect = buttonRef.current.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const dx = Math.max(x, window.innerWidth - x)
  const dy = Math.max(y, window.innerHeight - y)
  const radius = Math.ceil(Math.sqrt(dx * dx + dy * dy))

  document.documentElement.style.setProperty('--bulb-x', `${x}px`)
  document.documentElement.style.setProperty('--bulb-y', `${y}px`)
  document.documentElement.style.setProperty('--bulb-radius', `${radius}px`)

  // Feature-detect typed startViewTransition (Chrome 125+)
  // The types option causes a DOMException in older implementations that
  // only accept a function. Wrap in try/catch and fall back to function form.
  // startViewTransition returns a ViewTransition object, but we don't use it — void cast is intentional.
  const svt = (document as Document & {
    startViewTransition?: (arg: (() => void) | { update: () => void; types: string[] }) => unknown
  }).startViewTransition

  if (svt) {
    try {
      svt.call(document, { update: () => setTheme(nextTheme), types: ['bulb-transition'] })
    } catch {
      // Browser supports startViewTransition but not the typed object form
      svt.call(document, () => setTheme(nextTheme))
    }
  } else {
    setTheme(nextTheme)
  }
}
```

`svt.call(document, ...)` is used because `svt` is stored as a detached reference — calling `svt(...)` without binding would lose the `document` `this` context and throw.

### CSS

The `active-view-transition-type` pseudo-class is Chrome 125+ only. In older browsers (Chrome 111–124, Safari 18+, Firefox 130+), this selector is silently ignored — the bulb transition falls back to the standard ripple animation from `ThemeToggleRipple`'s CSS. This is intentional and acceptable.

```css
::view-transition-new(root):active-view-transition-type(bulb-transition) {
  clip-path: circle(0px at var(--bulb-x, 50%) var(--bulb-y, 50%));
  filter: blur(40px);
  animation: bulb-bloom 0.6s ease-in-out forwards;
}

::view-transition-old(root):active-view-transition-type(bulb-transition) {
  animation: none;
}

@keyframes bulb-bloom {
  to {
    clip-path: circle(var(--bulb-radius, 100vmax) at var(--bulb-x, 50%) var(--bulb-y, 50%));
    filter: blur(0px);
  }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root):active-view-transition-type(bulb-transition),
  ::view-transition-old(root):active-view-transition-type(bulb-transition) {
    animation: none;
    filter: none;
  }
}
```

The blur starts at 40px and animates to 0px as the circle expands — a warm bloom that sharpens as it fills the viewport.

### Browser support / fallback chain

1. **Chrome 125+ / Edge 125+** — full typed transition with soft bloom
2. **Chrome 111–124 / Safari 18+ / Firefox 130+** — `startViewTransition` without types; `active-view-transition-type` selector is ignored, standard ripple CSS applies (hard edge). Acceptable degradation.
3. **No View Transitions** — instant theme swap; button halo/icon animation still plays

---

## Accessibility

- `aria-label`: `"Switch to dark mode"` in light mode, `"Switch to light mode"` in dark mode
- Touch targets: `md` = 44×44px (WCAG 2.1 AA minimum); `sm` is intentionally below this — document at usage site
- Focus: `focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2` (see Button Visual Design)
- `prefers-reduced-motion`: page transition animation suppressed; button color/opacity fade retained (see Button Visual Design)

---

## Testing

Create `src/components/ThemeToggleBulb.test.tsx` mirroring the structure of `ThemeToggleRipple.test.tsx`. Cover:

1. Renders nothing when `resolvedTheme` is undefined (mounted guard)
2. Renders `Lightbulb` icon in both light and dark mode
3. Correct `aria-label` in light mode (`"Switch to dark mode"`)
4. Correct `aria-label` in dark mode (`"Switch to light mode"`)
5. Calls `setTheme('dark')` when clicked in light mode
6. Calls `setTheme('light')` when clicked in dark mode
7. **Try/catch fallback path**: mock `document.startViewTransition` as a function that throws when given an object — verify `setTheme` is still called (the fallback branch runs)

Item 7 is new logic with no equivalent in `ThemeToggleRipple` and must be explicitly tested.

---

## Demo Page

Update `App.tsx` to render both `ThemeToggleRipple` and `ThemeToggleBulb` side by side so they can be compared visually.

---

## Reusability

To copy `ThemeToggleBulb` into another project:

1. Copy `ThemeToggleBulb.tsx` into the target project's components folder
2. Ensure `lucide-react` and `next-themes` are installed
3. Add the bulb-transition CSS block to the project's global stylesheet
4. Ensure the CSS custom properties `--ripple-x`, `--ripple-y`, and `--ripple-radius` are set on `:root` at runtime — this is handled inside the component's `handleClick`, no external setup needed
5. Confirm `ThemeProvider` wraps the app with `attribute="class"`
