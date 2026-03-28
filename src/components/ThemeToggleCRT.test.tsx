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
