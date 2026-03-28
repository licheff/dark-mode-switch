import { useRef } from 'react'
import { useTheme } from 'next-themes'
import { Lightbulb } from 'lucide-react'

interface ThemeToggleBulbProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { iconSize: 16, buttonClass: 'w-8 h-8' },
  md: { iconSize: 20, buttonClass: 'w-11 h-11' },
  lg: { iconSize: 24, buttonClass: 'w-12 h-12' },
}

export function ThemeToggleBulb({ size = 'md', className = '' }: ThemeToggleBulbProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Mounted guard: next-themes resolves theme asynchronously.
  if (!resolvedTheme) return null

  const isDark = resolvedTheme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  const { iconSize, buttonClass } = sizeConfig[size]

  const handleClick = () => {
    if (!buttonRef.current) return

    // Skip animation for users who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme)
      return
    }

    const rect = buttonRef.current.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // Warm amber overlay that floods from the bulb position, peaks, then fades
    // as the new theme settles underneath.
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      background: radial-gradient(circle at ${x}px ${y}px, rgb(251 191 36 / 0.55) 0%, transparent 65%);
      opacity: 0;
      transition: opacity 280ms ease-out;
    `
    document.body.appendChild(overlay)

    // Force reflow so the transition fires from opacity 0
    overlay.getBoundingClientRect()
    overlay.style.opacity = '1'

    setTimeout(() => {
      setTheme(nextTheme)
      overlay.style.opacity = '0'
      overlay.style.transition = 'opacity 320ms ease-in'
      setTimeout(() => overlay.remove(), 320)
    }, 280)
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={[
        buttonClass,
        'flex items-center justify-center rounded-full cursor-pointer',
        'hover:scale-110 transition-transform duration-200 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Icon with drop-shadow glow in light mode, dimmed in dark mode */}
      <span
        className={isDark ? 'text-zinc-400' : 'text-amber-400'}
        style={{
          filter: isDark
            ? 'none'
            : 'drop-shadow(0 0 5px rgb(251 191 36 / 0.9)) drop-shadow(0 0 14px rgb(251 191 36 / 0.4))',
          transition: 'filter 300ms ease, color 300ms ease',
        }}
      >
        <Lightbulb size={iconSize} />
      </span>
    </button>
  )
}
