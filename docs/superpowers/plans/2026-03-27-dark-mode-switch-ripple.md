# Dark Mode Switch — Ripple Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Vite + React project with a reusable `ThemeToggleRipple` component that switches light/dark themes via a View Transitions API ripple animation expanding from the button's position.

**Architecture:** A single-file React component reads theme state from `next-themes`, computes ripple coordinates on click, sets three CSS custom properties on `document.documentElement`, then calls `document.startViewTransition()` to animate the theme switch. The View Transitions CSS handles the expanding circle. The demo page wraps the app in `ThemeProvider` and provides enough visual content to make the ripple obvious.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS v4, next-themes, lucide-react, Vitest, @testing-library/react

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Create | Project config and all dependencies |
| `vite.config.ts` | Create | Vite plugins (React, Tailwind) + Vitest config |
| `tsconfig.json` | Create | TypeScript project references |
| `tsconfig.app.json` | Create | App TypeScript config |
| `tsconfig.node.json` | Create | Node/Vite TypeScript config |
| `index.html` | Create | HTML entry point |
| `src/main.tsx` | Create | App entry — mounts React, wraps in `ThemeProvider` |
| `src/index.css` | Create | Tailwind import + View Transitions ripple CSS |
| `src/App.tsx` | Create | Demo page — shows toggle + themed content |
| `src/components/ThemeToggleRipple.tsx` | Create | The reusable toggle component |
| `src/test/setup.ts` | Create | Vitest global setup (jest-dom matchers) |
| `src/components/ThemeToggleRipple.test.tsx` | Create | Component tests |

---

## Task 1: Scaffold the Vite project

**Files:** `package.json`, `index.html`, `tsconfig*.json`

- [ ] **Step 1: Initialize the project**

From `~/Documents/dev/dark-mode-switch`, run:

```bash
npm create vite@latest . -- --template react-ts
```

When prompted about non-empty directory, choose to continue (the `docs/` folder already exists).

- [ ] **Step 2: Verify scaffold**

```bash
ls src/
```

Expected output: `App.css  App.tsx  assets  index.css  main.tsx  vite-env.d.ts`

---

## Task 2: Install all dependencies

**Files:** `node_modules/`, `package-lock.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install next-themes lucide-react
```

- [ ] **Step 2: Install Tailwind CSS v4 and Vite plugin**

```bash
npm install tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Install test dependencies**

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 4: Verify install**

```bash
npm ls next-themes lucide-react tailwindcss vitest --depth=0
```

Expected: all four packages listed with versions, no errors.

---

## Task 3: Configure Vite

**Files:** `vite.config.ts`

- [ ] **Step 1: Replace `vite.config.ts` entirely**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 2: Add test types to `tsconfig.app.json`**

Open `tsconfig.app.json` and add `"types": ["vitest/globals"]` inside `compilerOptions`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

(Merge with existing `compilerOptions` — don't replace the whole file.)

---

## Task 4: Set up global styles and ThemeProvider

**Files:** `src/index.css`, `src/main.tsx`

- [ ] **Step 1: Replace `src/index.css`**

Delete everything in the file and replace with:

```css
@import "tailwindcss";

/*
  View Transitions ripple animation.
  --ripple-x, --ripple-y, --ripple-radius are set in px by ThemeToggleRipple on click.
  The clip-path on ::view-transition-new(root) is the START state (0px circle).
  The @keyframes only needs `to` because the start state is already defined here.
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

- [ ] **Step 2: Replace `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
```

- `attribute="class"` — `next-themes` adds `class="dark"` to `<html>`, which Tailwind's `dark:` variants need.
- `defaultTheme="system"` — respects the OS preference on first load.

---

## Task 5: Set up test infrastructure

**Files:** `src/test/setup.ts`

- [ ] **Step 1: Create test setup file**

Create the directory and file:

```bash
mkdir -p src/test
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 2: Add test script to `package.json`**

Open `package.json` and add to the `scripts` object:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Run the (empty) test suite to confirm setup works**

```bash
npm test
```

Expected: `No test files found` or `0 tests passed` — not an error.

---

## Task 6: Write failing tests for ThemeToggleRipple

**Files:** `src/components/ThemeToggleRipple.test.tsx`

- [ ] **Step 1: Create the test file**

`src/components/ThemeToggleRipple.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTheme } from 'next-themes'
import { ThemeToggleRipple } from './ThemeToggleRipple'

// Mock next-themes so we control the theme value in each test
vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

const mockSetTheme = vi.fn()

beforeEach(() => {
  // Default: light mode
  vi.mocked(useTheme).mockReturnValue({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
    themes: ['light', 'dark'],
    systemTheme: 'light',
    forcedTheme: undefined,
  })

  // Mock getBoundingClientRect so the ripple coords are predictable
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 100, top: 50, width: 44, height: 44,
    right: 144, bottom: 94, x: 100, y: 50,
    toJSON: () => {},
  })

  // Define window dimensions
  Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  mockSetTheme.mockClear()
})

describe('ThemeToggleRipple', () => {
  it('renders a button with accessible label in light mode', () => {
    render(<ThemeToggleRipple />)
    const button = screen.getByRole('button', { name: 'Switch to dark mode' })
    expect(button).toBeInTheDocument()
  })

  it('renders with "Switch to light mode" label in dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleRipple />)
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('calls setTheme with "dark" when clicked in light mode', () => {
    render(<ThemeToggleRipple />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme with "light" when clicked in dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleRipple />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('sets ripple CSS custom properties on click', () => {
    render(<ThemeToggleRipple />)
    fireEvent.click(screen.getByRole('button'))

    // Center of mocked rect: left(100) + width(44)/2 = 122px, top(50) + height(44)/2 = 72px
    expect(document.documentElement.style.getPropertyValue('--ripple-x')).toBe('122px')
    expect(document.documentElement.style.getPropertyValue('--ripple-y')).toBe('72px')
    // Radius: dx = max(122, 1280-122) = 1158, dy = max(72, 800-72) = 728
    // radius = ceil(sqrt(1158² + 728²)) = ceil(sqrt(1341164 + 529984)) = ceil(sqrt(1871148)) ≈ 1368
    const radius = parseInt(document.documentElement.style.getPropertyValue('--ripple-radius'))
    expect(radius).toBeGreaterThan(0)
  })

  it('renders nothing when theme is undefined (mounted guard)', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: undefined,
      setTheme: mockSetTheme,
      resolvedTheme: undefined,
      themes: [],
      systemTheme: undefined,
      forcedTheme: undefined,
    })
    const { container } = render(<ThemeToggleRipple />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run tests — confirm all fail**

```bash
npm test
```

Expected: 5 tests fail with `Cannot find module './ThemeToggleRipple'` (or similar). This is correct — the component doesn't exist yet.

---

## Task 7: Implement ThemeToggleRipple

**Files:** `src/components/ThemeToggleRipple.tsx`

- [ ] **Step 1: Create the component file**

`src/components/ThemeToggleRipple.tsx`:

```tsx
import { useRef } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleRippleProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { iconSize: 16, buttonClass: 'w-8 h-8' },
  md: { iconSize: 20, buttonClass: 'w-11 h-11' },
  lg: { iconSize: 24, buttonClass: 'w-12 h-12' },
}

export function ThemeToggleRipple({ size = 'md', className = '' }: ThemeToggleRippleProps) {
  const { theme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Mounted guard: next-themes resolves theme asynchronously.
  // Render nothing until theme is known to avoid showing the wrong icon.
  if (!theme) return null

  const isDark = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  const { iconSize, buttonClass } = sizeConfig[size]

  const handleClick = () => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    const dx = Math.max(x, window.innerWidth - x)
    const dy = Math.max(y, window.innerHeight - y)
    const radius = Math.ceil(Math.sqrt(dx * dx + dy * dy))

    document.documentElement.style.setProperty('--ripple-x', `${x}px`)
    document.documentElement.style.setProperty('--ripple-y', `${y}px`)
    document.documentElement.style.setProperty('--ripple-radius', `${radius}px`)

    // startViewTransition is not yet in all TypeScript lib definitions
    const vt = (document as Document & {
      startViewTransition?: (cb: () => void) => void
    }).startViewTransition

    if (vt) {
      vt.call(document, () => setTheme(nextTheme))
    } else {
      setTheme(nextTheme)
    }
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      aria-label={label}
      className={`${buttonClass} flex items-center justify-center rounded-full cursor-pointer
        hover:scale-110 hover:opacity-80 transition-all duration-200 ${className}`}
    >
      {isDark ? (
        <Sun size={iconSize} />
      ) : (
        <Moon size={iconSize} />
      )}
    </button>
  )
}
```

- [ ] **Step 2: Run tests — confirm all pass**

```bash
npm test
```

Expected: `5 tests passed`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeToggleRipple.tsx src/components/ThemeToggleRipple.test.tsx src/test/setup.ts
git commit -m "feat: add ThemeToggleRipple component with tests"
```

---

## Task 8: Build the demo page

**Files:** `src/App.tsx`, `src/index.css`, `src/main.tsx`

- [ ] **Step 1: Delete the scaffolded CSS**

Delete `src/App.css` (the Vite scaffold creates it; we don't need it):

```bash
rm src/App.css
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { ThemeToggleRipple } from './components/ThemeToggleRipple'

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <header className="flex justify-end p-4">
        <ThemeToggleRipple />
      </header>
      <main className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Dark Mode Switch
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          A reusable React component with a ripple transition. Click the icon in the top right to see it in action.
        </p>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-6 space-y-2">
          <h2 className="text-xl font-semibold">Card component</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            The ripple expands outward from the toggle button, revealing the new theme underneath.
          </p>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Start the dev server and verify visually**

```bash
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

Verify:
- The page renders in light or dark mode based on your OS setting
- The Moon/Sun icon is visible in the top-right corner
- Clicking the icon triggers the ripple animation and switches the theme
- The ripple originates from the button's position
- Clicking again switches back

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/index.css src/main.tsx
git commit -m "feat: add demo page and global styles"
```

---

## Task 9: Clean up scaffold artifacts and final commit

**Files:** Various scaffold files

- [ ] **Step 1: Remove unused scaffold files**

The Vite template creates files we don't need:

```bash
rm src/assets/react.svg public/vite.svg
```

- [ ] **Step 2: Run full test suite one final time**

```bash
npm test
```

Expected: `5 tests passed`, no errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: remove unused scaffold assets"
```

---

## Done

The project should now have:
- A working dev server with a demo page
- `ThemeToggleRipple` as a single copy-paste file
- 5 passing tests
- The ripple animation working in Chrome, Edge, Safari 18+, Firefox 130+
- Instant fallback for older browsers
