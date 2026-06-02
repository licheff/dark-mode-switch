import { useState, useRef, useEffect } from 'react'
import type { ComponentType } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { ThemeToggleRipple } from './components/ThemeToggleRipple'
import { ThemeToggleBulb } from './components/ThemeToggleBulb'
import { ThemeToggleCRT } from './components/ThemeToggleCRT'
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group'
import { Input } from './components/ui/input'

type VariantKey = 'ripple' | 'bulb' | 'crt'

// Add new variants here — the segmented control renders from this map automatically.
const variants: Record<VariantKey, { label: string; component: ComponentType<{ size?: 'sm' | 'md' | 'lg'; className?: string }> }> = {
  ripple: { label: 'Ripple', component: ThemeToggleRipple },
  bulb:   { label: 'Bulb',   component: ThemeToggleBulb },
  crt:    { label: 'CRT',    component: ThemeToggleCRT },
}

const INSTALL_CMD = 'npm install @licheff/dark-mode-switch'
const NPM_URL = 'https://www.npmjs.com/package/@licheff/dark-mode-switch'
const GITHUB_URL = 'https://github.com/licheff/dark-mode-switch'

export default function App() {
  const [activeVariant, setActiveVariant] = useState<VariantKey>('ripple')
  const { component: ActiveToggle } = variants[activeVariant]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-12">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Dark mode switch</h1>
        <p className="text-muted-foreground text-sm">Animated theme toggles for React</p>
      </header>

      {/* flex-1 fills the space between header and footer so the toggle sits centered */}
      <main className="flex flex-1 flex-col items-center justify-center gap-10">
        <ActiveToggle size="lg" />

        <ToggleGroup
          variant="outline"
          value={[activeVariant]}
          // Base UI returns an array; ignore the empty case so a variant is always selected.
          onValueChange={(groupValue) => {
            const next = groupValue[0] as VariantKey | undefined
            if (next) setActiveVariant(next)
          }}
        >
          {(Object.entries(variants) as [VariantKey, { label: string }][]).map(([key, { label }]) => (
            <ToggleGroupItem key={key} value={key} aria-label={`${label} variant`}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </main>

      <footer className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          {/* size = char count so the field is exactly wide enough for the full command */}
          <Input
            readOnly
            value={INSTALL_CMD}
            size={INSTALL_CMD.length}
            className="h-9 w-auto font-mono text-xs"
            aria-label="Install command"
          />
          <CopyButton text={INSTALL_CMD} />
        </div>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href={NPM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            npm <ExternalLink size={14} />
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            GitHub <ExternalLink size={14} />
          </a>
        </nav>
      </footer>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  // Track the timer so a quick second click doesn't leave a stale reset pending.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy install command'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input hover:bg-accent transition-colors cursor-pointer"
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
    </button>
  )
}
