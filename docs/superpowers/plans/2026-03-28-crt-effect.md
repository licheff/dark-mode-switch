# CRT Effect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `ThemeToggleCRT` component that imitates a CRT monitor turning on/off — collapsing to a white horizontal line when going dark, expanding from that line when going light.

**Architecture:** A DOM-injected white overlay div is animated with CSS keyframes (`crt-off` / `crt-on`) using `scaleY` transforms anchored to `center center`. The component follows the exact same shape as `ThemeToggleBulb`: `resolvedTheme`, mounted guard, `matchMedia` reduced-motion check, `setTimeout`-based theme switch and overlay cleanup. No new dependencies.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, next-themes, lucide-react, Vitest, @testing-library/react

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/index.css` | Modify | Add `crt-off` and `crt-on` keyframe blocks |
| `src/components/ThemeToggleCRT.test.tsx` | Create | All tests for the CRT component (written before the component) |
| `src/components/ThemeToggleCRT.tsx` | Create | The CRT toggle component |
| `src/App.tsx` | Modify | Register `'crt'` in the variants map and `VariantKey` type |

---

## Task 1: Add CSS keyframes

**Files:** `src/index.css`

- [ ] **Step 1: Open `src/index.css` and add the two keyframe blocks**

Add this block near the other animation keyframes (after the `bulb-contract` block, before `@theme inline`):

```css
/* ThemeToggleCRT — off: collapses to a horizontal line; on: expands from a line */
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

`crt-off` collapses from full-screen to ~2px at 75%, then the line fades. `crt-on` expands from ~2px to full-screen at 75% (fully opaque throughout), then fades. The `forwards` fill mode set on the overlay element prevents flickering during the gap between animation end and `setTimeout` removal.

**Note:** The existing `@media (prefers-reduced-motion: reduce)` block in `index.css` suppresses View Transition animations — do not add `crt-off`/`crt-on` to it. The CRT component handles reduced motion in JS via `window.matchMedia`, which skips the overlay entirely.

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add crt-off and crt-on CSS keyframes"
```

---

## Task 2: Write failing tests

**Files:** `src/components/ThemeToggleCRT.test.tsx`

- [ ] **Step 1: Create the test file**

`src/components/ThemeToggleCRT.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTheme } from 'next-themes'
import { ThemeToggleCRT } from './ThemeToggleCRT'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

const mockSetTheme = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()

  vi.mocked(useTheme).mockReturnValue({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
    themes: ['light', 'dark'],
    systemTheme: 'light',
    forcedTheme: undefined,
  })

  // matchMedia is not implemented in jsdom — mock it to return no reduced motion by default
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  mockSetTheme.mockClear()
  // Clean up any overlay divs leaked by tests that don't advance timers to 500ms
  document.body.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove())
})

describe('ThemeToggleCRT', () => {
  it('renders nothing when resolvedTheme is undefined (mounted guard)', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: undefined,
      setTheme: mockSetTheme,
      resolvedTheme: undefined,
      themes: [],
      systemTheme: undefined,
      forcedTheme: undefined,
    })
    const { container } = render(<ThemeToggleCRT />)
    expect(container).toBeEmptyDOMElement()
  })

  it('has aria-label "Switch to dark mode" in light mode', () => {
    render(<ThemeToggleCRT />)
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })

  it('has aria-label "Switch to light mode" in dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleCRT />)
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('calls setTheme("dark") after 300ms when clicked in light mode', () => {
    render(<ThemeToggleCRT />)
    fireEvent.click(screen.getByRole('button'))
    // setTheme not called yet
    expect(mockSetTheme).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme("light") after 50ms when clicked in dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleCRT />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('injects an overlay div into document.body on click', () => {
    render(<ThemeToggleCRT />)
    const before = document.body.children.length
    fireEvent.click(screen.getByRole('button'))
    expect(document.body.children.length).toBe(before + 1)
  })

  it('removes the overlay after 500ms', () => {
    render(<ThemeToggleCRT />)
    fireEvent.click(screen.getByRole('button'))
    const before = document.body.children.length
    vi.advanceTimersByTime(500)
    expect(document.body.children.length).toBe(before - 1)
  })

  it('sets crt-off animation with ease-in when going dark', () => {
    render(<ThemeToggleCRT />)
    fireEvent.click(screen.getByRole('button'))
    const overlay = document.body.lastElementChild as HTMLElement
    expect(overlay.style.animation).toContain('crt-off')
    expect(overlay.style.animation).toContain('ease-in')
  })

  it('sets crt-on animation with ease-out when going light', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleCRT />)
    fireEvent.click(screen.getByRole('button'))
    const overlay = document.body.lastElementChild as HTMLElement
    expect(overlay.style.animation).toContain('crt-on')
    expect(overlay.style.animation).toContain('ease-out')
  })

  it('calls setTheme immediately and skips overlay when prefers-reduced-motion is set', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    render(<ThemeToggleCRT />)
    const before = document.body.children.length
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
    expect(document.body.children.length).toBe(before) // no overlay injected
  })

  it('uses resolvedTheme when theme is "system" (system preference set to dark)', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleCRT />)
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    vi.advanceTimersByTime(50)
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })
})
```

- [ ] **Step 2: Run tests — confirm they all fail**

```bash
cd /Users/licheff/Documents/dev/dark-mode-switch && npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: all 10 tests fail with `Cannot find module './ThemeToggleCRT'`. This is correct — the component doesn't exist yet.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/components/ThemeToggleCRT.test.tsx
git commit -m "test: add failing tests for ThemeToggleCRT"
```

---

## Task 3: Implement ThemeToggleCRT

**Files:** `src/components/ThemeToggleCRT.tsx`

- [ ] **Step 1: Create the component**

`src/components/ThemeToggleCRT.tsx`:

```tsx
import { useTheme } from 'next-themes'
import { Power } from 'lucide-react'

interface ThemeToggleCRTProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { iconSize: 16, buttonClass: 'w-8 h-8' },
  md: { iconSize: 20, buttonClass: 'w-11 h-11' },
  lg: { iconSize: 24, buttonClass: 'w-12 h-12' },
}

export function ThemeToggleCRT({ size = 'md', className = '' }: ThemeToggleCRTProps) {
  const { resolvedTheme, setTheme } = useTheme()

  // Mounted guard: next-themes resolves theme asynchronously.
  if (!resolvedTheme) return null

  const isDark = resolvedTheme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  const { iconSize, buttonClass } = sizeConfig[size]

  const handleClick = () => {
    // Skip animation for users who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme)
      return
    }

    const isGoingDark = nextTheme === 'dark'

    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: white;
      transform-origin: center center;
      box-shadow: 0 0 60px 30px white;
      z-index: 9999;
      pointer-events: none;
      animation: ${isGoingDark
        ? 'crt-off 500ms ease-in forwards'
        : 'crt-on 500ms ease-out forwards'
      };
    `

    // Going dark: start as full-screen, collapse to a line — theme switches as the line forms
    // Going light: start as a line, expand to full-screen — theme switches early so expansion reveals light mode
    setTimeout(() => setTheme(nextTheme), isGoingDark ? 300 : 50)
    setTimeout(() => overlay.remove(), 500)

    document.body.appendChild(overlay)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={[
        buttonClass,
        'flex items-center justify-center rounded-full cursor-pointer',
        'hover:scale-110 transition-transform duration-200 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
        className,
      ].filter(Boolean).join(' ')}
    >
      <Power
        size={iconSize}
        className={isDark ? 'text-white' : 'text-zinc-700'}
      />
    </button>
  )
}
```

- [ ] **Step 2: Run tests — confirm all 8 pass**

```bash
cd /Users/licheff/Documents/dev/dark-mode-switch && npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: `10 tests passed`, no failures.

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeToggleCRT.tsx
git commit -m "feat: implement ThemeToggleCRT component"
```

---

## Task 4: Register in App.tsx

**Files:** `src/App.tsx`

- [ ] **Step 1: Add the import**

At the top of `src/App.tsx`, add:

```tsx
import { ThemeToggleCRT } from './components/ThemeToggleCRT'
```

- [ ] **Step 2: Update `VariantKey` and `variants`**

Change:
```ts
type VariantKey = 'ripple' | 'bulb'
```
To:
```ts
type VariantKey = 'ripple' | 'bulb' | 'crt'
```

Add to the `variants` object (after the `bulb` entry):
```ts
crt: { label: 'CRT', component: ThemeToggleCRT },
```

- [ ] **Step 3: Run the full test suite to confirm nothing is broken**

```bash
cd /Users/licheff/Documents/dev/dark-mode-switch && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 4: Start the dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- The dropdown now shows a "CRT" option
- Selecting CRT shows a Power icon
- Clicking it when in light mode: full-screen white flash collapses to a horizontal line at center, then fades — dark mode appears behind it
- Clicking it when in dark mode: a white line appears at center, expands to full-screen, then fades — light mode is visible underneath
- The collapse/expansion is always vertically centered

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: register ThemeToggleCRT variant in App"
```

---

## Done

The project should now have:
- `crt-off` and `crt-on` CSS keyframes in `index.css`
- `ThemeToggleCRT` as a self-contained copy-paste component
- 10 passing tests
- CRT effect working and registered in the demo app
