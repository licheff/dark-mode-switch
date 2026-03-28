import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTheme } from 'next-themes'
import { ThemeToggleBulb } from './ThemeToggleBulb'

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

  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 100, top: 50, width: 44, height: 44,
    right: 144, bottom: 94, x: 100, y: 50,
    toJSON: () => {},
  })

  Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

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
    vi.advanceTimersByTime(280)
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
    vi.advanceTimersByTime(280)
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('calls setTheme immediately when prefers-reduced-motion is set', () => {
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

    render(<ThemeToggleBulb />)
    fireEvent.click(screen.getByRole('button'))
    // setTheme is called synchronously when reduced motion is active — no timer needed
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
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
    render(<ThemeToggleBulb />)
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    vi.advanceTimersByTime(280)
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

})
