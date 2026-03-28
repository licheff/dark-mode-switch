import { useRef } from 'react'
import { useTheme } from 'next-themes'
import { Lightbulb } from 'lucide-react'

interface ThemeToggleBulbProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { iconSize: 16, buttonClass: 'w-8 h-8',   haloClass: 'w-16 h-16' },
  md: { iconSize: 20, buttonClass: 'w-11 h-11',  haloClass: 'w-20 h-20' },
  lg: { iconSize: 24, buttonClass: 'w-12 h-12',  haloClass: 'w-24 h-24' },
}

export function ThemeToggleBulb({ size = 'md', className = '' }: ThemeToggleBulbProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Mounted guard: next-themes resolves theme asynchronously.
  if (!resolvedTheme) return null

  const isDark = resolvedTheme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  const { iconSize, buttonClass, haloClass } = sizeConfig[size]

  const handleClick = () => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const dx = Math.max(x, window.innerWidth - x)
    const dy = Math.max(y, window.innerHeight - y)
    const radius = Math.ceil(Math.sqrt(dx * dx + dy * dy))

    document.documentElement.style.setProperty('--bulb-x', `${x}px`)
    document.documentElement.style.setProperty('--bulb-y', `${y}px`)
    document.documentElement.style.setProperty('--bulb-radius', `${radius}px`)

    // Feature-detect typed startViewTransition (Chrome 125+).
    // Older browsers that only accept a function will throw on the object form.
    const svt = (document as Document & {
      startViewTransition?: (arg: (() => void) | { update: () => void; types: string[] }) => unknown
    }).startViewTransition

    if (svt) {
      try {
        svt.call(document, { update: () => setTheme(nextTheme), types: ['bulb-transition'] })
      } catch {
        // Fallback: browser supports startViewTransition but not the typed object form
        svt.call(document, () => setTheme(nextTheme))
      }
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
      className={[
        buttonClass,
        // overflow-visible is intentional: the halo span is larger than the button
        // and must bleed outside its bounds. Do not change to overflow-hidden.
        'relative flex items-center justify-center rounded-full cursor-pointer overflow-visible',
        'group transition-all duration-200 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
        !isDark && 'hover:scale-110',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Warm halo — blooms in light mode, contracts in dark mode */}
      <span
        className={[
          'absolute inset-0 m-auto rounded-full transition-all duration-300',
          haloClass,
          isDark
            ? 'opacity-0 scale-75 group-hover:opacity-40 group-hover:scale-90'
            : 'opacity-100 scale-100',
        ].join(' ')}
        style={{ background: 'radial-gradient(circle, rgb(252 211 77 / 0.8), transparent 70%)' }}
      />
      {/* Icon — warms in light mode, cools in dark mode */}
      <span
        className={[
          'relative transition-all duration-300',
          isDark
            ? 'text-zinc-400 group-hover:text-zinc-300'
            : 'text-amber-400 group-hover:opacity-80',
        ].join(' ')}
      >
        <Lightbulb size={iconSize} />
      </span>
    </button>
  )
}
