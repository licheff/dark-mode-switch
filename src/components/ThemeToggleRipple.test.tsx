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
    // Radius must be a positive number
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

  it('shows Sun icon and targets light mode when theme is "system" but resolvedTheme is "dark"', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    })
    render(<ThemeToggleRipple />)
    // resolvedTheme is 'dark' so should show Sun (switch to light) label
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })
})
