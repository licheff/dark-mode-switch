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
    overlay.setAttribute('data-crt-overlay', '')
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.background = 'white'
    overlay.style.transformOrigin = 'center center'
    overlay.style.boxShadow = '0 0 60px 30px white'
    overlay.style.zIndex = '9999'
    overlay.style.pointerEvents = 'none'
    overlay.style.animation = isGoingDark
      ? 'crt-off 500ms ease-in forwards'
      : 'crt-on 500ms ease-out forwards'

    // Going dark: start as full-screen, collapse to a line — theme switches as the line forms
    // Going light: start as a line, expand to full-screen — theme switches early so expansion reveals light mode

    // Cancel any in-progress animation before starting a new one
    const existing = document.querySelector('[data-crt-overlay]') as HTMLElement | null
    if (existing) {
      clearTimeout(Number(existing.dataset.themeTimer))
      clearTimeout(Number(existing.dataset.removeTimer))
      existing.remove()
    }

    const themeTimer = setTimeout(() => setTheme(nextTheme), isGoingDark ? 300 : 50)
    const removeTimer = setTimeout(() => overlay.remove(), 500)
    overlay.dataset.themeTimer = String(themeTimer)
    overlay.dataset.removeTimer = String(removeTimer)

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
