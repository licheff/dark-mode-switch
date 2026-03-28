import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTheme } from 'next-themes'
import { ThemeToggleBulb } from './ThemeToggleBulb'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

const mockSetTheme = vi.fn()

beforeEach(() => {
  vi.mocked(useTheme).mockReturnValue({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
    themes: ['light', 'dark'],
    systemTheme: 'light',
    forcedTheme: undefined,
  })

  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 100, top: 50, width: 44, height: 44,
    right: 144, bottom: 94, x: 100, y: 50,
    toJSON: () => {},
  })

  Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  mockSetTheme.mockClear()
})

describe('ThemeToggleBulb', () => {
  it('renders nothing when resolvedTheme is undefined (mounted guard)', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: undefined,
      setTheme: mockSetTheme,
      resolvedTheme: undefined,
      themes: [],
      systemTheme: undefined,
      forcedTheme: undefined,
    })
    const { container } = render(<ThemeToggleBulb />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a button in light mode', () => {
    render(<ThemeToggleBulb />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders a button in dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleBulb />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has aria-label "Switch to dark mode" in light mode', () => {
    render(<ThemeToggleBulb />)
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
    render(<ThemeToggleBulb />)
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('calls setTheme("dark") when clicked in light mode', () => {
    render(<ThemeToggleBulb />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme("light") when clicked in dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleBulb />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('sets --bulb-x, --bulb-y, --bulb-radius CSS custom properties on click', () => {
    render(<ThemeToggleBulb />)
    fireEvent.click(screen.getByRole('button'))

    // Center of mocked rect: left(100) + width(44)/2 = 122px, top(50) + height(44)/2 = 72px
    expect(document.documentElement.style.getPropertyValue('--bulb-x')).toBe('122px')
    expect(document.documentElement.style.getPropertyValue('--bulb-y')).toBe('72px')
    const radius = parseInt(document.documentElement.style.getPropertyValue('--bulb-radius'))
    expect(radius).toBeGreaterThan(0)
  })

  it('calls setTheme via the try/catch fallback when startViewTransition throws on object arg', () => {
    // Simulate a browser that supports startViewTransition(fn) but not the typed object form
    Object.defineProperty(document, 'startViewTransition', {
      value: (arg: unknown) => {
        if (typeof arg !== 'function') throw new Error('Not supported')
        ;(arg as () => void)()
      },
      configurable: true,
    })

    render(<ThemeToggleBulb />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})
