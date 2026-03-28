# dark-mode-switch

Animated dark/light mode toggle components for React. Three variants — each with its own distinct animation effect.

## Variants

| Component | Animation |
|---|---|
| `ThemeToggleRipple` | Full-screen ripple that expands from the button's position using the View Transitions API |
| `ThemeToggleBulb` | A circle expands out (switching to light) or contracts in (switching to dark) from the button |
| `ThemeToggleCRT` | The page collapses to a horizontal line like an old CRT monitor turning off, then snaps back |

## Requirements

- React 18+
- [next-themes](https://github.com/pacocoursey/next-themes) for theme context
- [Tailwind CSS v4](https://tailwindcss.com) in the consuming project
- [lucide-react](https://lucide.dev) for icons

## Installation

```bash
npm install @licheff/dark-mode-switch
```

## Setup

### 1. Wrap your app with ThemeProvider

In your `main.tsx` (or equivalent entry point):

```tsx
import { ThemeProvider } from 'next-themes'
import '@licheff/dark-mode-switch/style.css'

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <App />
</ThemeProvider>
```

The `attribute="class"` setting tells next-themes to apply a `dark` class to `<html>`, which Tailwind's `dark:` variants depend on.

### 2. Add the dark variant to your CSS

In your global stylesheet:

```css
@custom-variant dark (&:is(.dark *));
```

### 3. Scan the package with Tailwind

So Tailwind picks up the utility classes used inside the components:

```css
@source "../../node_modules/@licheff/dark-mode-switch/dist";
```

## Usage

```tsx
import { ThemeToggleRipple } from '@licheff/dark-mode-switch'
// or: ThemeToggleBulb, ThemeToggleCRT

export function MyNav() {
  return <ThemeToggleRipple />
}
```

## Props

All three components share the same props:

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Controls icon and button size |
| `className` | `string` | `''` | Applied to the button element |

**Size reference:**

| Size | Icon | Button |
|---|---|---|
| `sm` | 16px | 32×32px |
| `md` | 20px | 44×44px (WCAG minimum) |
| `lg` | 24px | 48×48px |

## Browser support

The ripple animation uses the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) (Chrome 111+, Edge 111+, Safari 18+, Firefox 130+). All variants fall back gracefully — the theme still switches, just without the animation.

`prefers-reduced-motion` is respected: animations are suppressed, but theme switching still works.
