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
  const { resolvedTheme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Mounted guard: next-themes resolves theme asynchronously.
  // Render nothing until theme is known to avoid showing the wrong icon.
  if (!resolvedTheme) return null

  const isDark = resolvedTheme === 'dark'
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
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`${buttonClass} flex items-center justify-center rounded-full cursor-pointer hover:scale-110 hover:opacity-80 transition-all duration-200 ${className}`}
    >
      {/* view-transition-name isolates the icon from the ripple so it can animate separately */}
      <span style={{ viewTransitionName: 'theme-icon' }} className="inline-flex">
        {isDark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
      </span>
    </button>
  )
}
