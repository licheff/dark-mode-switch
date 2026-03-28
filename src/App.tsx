import { useState } from 'react'
import type { ComponentType } from 'react'
import { ThemeToggleRipple } from './components/ThemeToggleRipple'
import { ThemeToggleBulb } from './components/ThemeToggleBulb'
import { ThemeToggleCRT } from './components/ThemeToggleCRT'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'

type VariantKey = 'ripple' | 'bulb' | 'crt'

// Add new variants here — the Select and registry update automatically.
const variants: Record<VariantKey, { label: string; component: ComponentType<{ size?: 'sm' | 'md' | 'lg'; className?: string }> }> = {
  ripple: { label: 'Ripple', component: ThemeToggleRipple },
  bulb:   { label: 'Bulb',   component: ThemeToggleBulb },
  crt:    { label: 'CRT',    component: ThemeToggleCRT },
}

export default function App() {
  const [activeVariant, setActiveVariant] = useState<VariantKey>('ripple')
  const { component: ActiveToggle } = variants[activeVariant]

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex flex-col items-center justify-center gap-8">
      <ActiveToggle size="lg" />
      <Select value={activeVariant} onValueChange={(v) => setActiveVariant(v as VariantKey)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Variant" />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(variants) as [VariantKey, { label: string; component: unknown }][]).map(
            ([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
