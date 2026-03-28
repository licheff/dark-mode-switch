# Dark Mode Switch — Design Spec

**Date:** 2026-03-27
**Status:** Draft

---

## Overview

A reusable React component that toggles between light and dark themes with a full-screen ripple animation. The ripple originates from the toggle button's position and expands to reveal the new theme. Built as a standalone Vite project for development and preview, with the component designed to be copied into other projects (initially `apartment-expenses`).

The project will eventually contain multiple toggle variants; this spec covers the first: the **ripple** variant.

---

## Stack

- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Build tool:** Vite
- **Theme management:** next-themes (confirmed working in Vite — already used in `apartment-expenses`)
- **Icons:** lucide-react

---

## Project Structure

```
dark-mode-switch/
├── src/
│   ├── components/
│   │   └── ThemeToggleRipple.tsx  # First variant — ripple effect
│   ├── App.tsx                    # Demo page
│   ├── main.tsx
│   └── index.css                  # View Transitions CSS + Tailwind
├── index.html
├── package.json
└── vite.config.ts
```

Future variants are separate files (e.g. `ThemeToggleBulb.tsx`). No `variant` prop — each animation is its own named component.

---

## Component: ThemeToggleRipple

### Props

| Prop        | Type                    | Default | Description                              |
|-------------|-------------------------|---------|------------------------------------------|
| `size`      | `'sm' \| 'md' \| 'lg'` | `'md'`  | Controls icon and button size (see below)|
| `className` | `string`                | `''`    | Applied to the `<button>` element        |

**Size breakdown:**

| Size | Icon  | Button (touch target) |
|------|-------|-----------------------|
| sm   | 16px  | 32×32px (desktop-only contexts) |
| md   | 20px  | 44×44px (WCAG minimum) |
| lg   | 24px  | 48×48px               |

`sm` intentionally drops below the WCAG touch target minimum — use `md` or `lg` for any touch-accessible UI.

### Behavior

1. Reads current theme via `useTheme()` from `next-themes`
2. **Mounted guard:** `next-themes` initializes asynchronously — `theme` is `undefined` on the first render tick. Guard against rendering the wrong icon by tracking a `mounted` boolean via `useEffect`, and rendering nothing (or a neutral placeholder) until it is `true`.
3. Displays **Moon icon** in light mode, **Sun icon** in dark mode
4. On click:
   - Gets the button's `getBoundingClientRect()` to find its center coordinates in pixels
   - Sets `--ripple-x` and `--ripple-y` as **pixel values** (e.g. `"540px"`, `"120px"`) on `document.documentElement`
   - Computes `--ripple-radius` as the pixel distance from the button center to the farthest viewport corner (see formula below), also set as a pixel value
   - **If `startViewTransition` is supported:** calls `document.startViewTransition(() => { setTheme(nextTheme) })`. The callback must be synchronous — `setTheme` from `next-themes` is synchronous, so this is satisfied. Both the page colors and the icon are captured in the transition snapshot together.
   - **Fallback (unsupported):** calls `setTheme(nextTheme)` directly. The icon swaps via a CSS transition (200ms fade + 180° rotate) on the icon element.

### Accessibility

- `aria-label` is dynamic: `"Switch to dark mode"` in light mode, `"Switch to light mode"` in dark mode
- `prefers-reduced-motion`: `startViewTransition` is still called (theme switches correctly), but the ripple CSS animation is suppressed via a media query — the theme changes instantly

---

## Animation: View Transitions Ripple

Add this CSS block to `index.css`:

```css
/*
  The rule on ::view-transition-new(root) itself defines the START state of the animation
  (circle at 0px radius). The @keyframes only needs `to {}` because the from state
  is already set by the clip-path property on the pseudo-element.
*/
::view-transition-new(root) {
  clip-path: circle(0px at var(--ripple-x, 50%) var(--ripple-y, 50%));
  animation: ripple-expand 0.5s ease-in-out;
}

::view-transition-old(root) {
  animation: none;
}

@keyframes ripple-expand {
  to {
    clip-path: circle(var(--ripple-radius, 100vmax) at var(--ripple-x, 50%) var(--ripple-y, 50%));
  }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root),
  ::view-transition-old(root) {
    animation: none;
  }
}
```

**JS — computing and setting the ripple variables:**

```ts
const rect = buttonRef.current.getBoundingClientRect();
const x = rect.left + rect.width / 2;   // pixels from viewport left
const y = rect.top + rect.height / 2;   // pixels from viewport top

const dx = Math.max(x, window.innerWidth - x);
const dy = Math.max(y, window.innerHeight - y);
const radius = Math.ceil(Math.sqrt(dx * dx + dy * dy));

document.documentElement.style.setProperty('--ripple-x', `${x}px`);
document.documentElement.style.setProperty('--ripple-y', `${y}px`);
document.documentElement.style.setProperty('--ripple-radius', `${radius}px`);
```

All three variables use pixel values consistently. The `clip-path: circle(r at x y)` syntax accepts pixel values directly.

**Browser support:** Chrome 111+, Edge 111+, Safari 18+, Firefox 130+ (~90% global coverage). Fallback: instant theme switch.

---

## ThemeProvider Setup

`next-themes` requires the app to be wrapped in a `ThemeProvider`. In `main.tsx`:

```tsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <App />
</ThemeProvider>
```

- `attribute="class"` — applies `class="dark"` to `<html>`, which Tailwind's `dark:` variants depend on
- `defaultTheme="system"` — respects OS preference on first load
- `enableSystem` — allows system preference to be used

This is a client-side Vite SPA — there is no SSR and no hydration. `suppressHydrationWarning` is not needed.

When copying the component to another project, verify `ThemeProvider` is already configured this way (it is in `apartment-expenses`).

---

## Demo Page (App.tsx)

A minimal page that makes the transition visually obvious:
- `ThemeProvider` wrapping the whole app
- `ThemeToggleRipple` in the top-right corner
- A heading, body text paragraph, and a card element
- Tailwind `dark:` variants applied to background, text, and card colors — enough contrast between light/dark to clearly see the ripple expand

---

## Reusability (Copy-Paste Guide)

To use `ThemeToggleRipple` in another project:

1. Copy `ThemeToggleRipple.tsx` into the target project's components folder
2. Ensure `next-themes` and `lucide-react` are installed
3. Add the View Transitions CSS block above to the project's global stylesheet
4. Confirm `ThemeProvider` wraps the app with `attribute="class"` (already done in `apartment-expenses`)
