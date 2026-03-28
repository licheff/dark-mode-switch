# Dark Mode Switch — TODO

## Next: Iridescent Light Bulb Variant

A second toggle variant (`ThemeToggleBulb`) where the animation lives entirely on the button itself rather than the page.

### Concept

- The button looks like a light bulb icon at rest
- **Switching to dark:** the bulb "turns off" — filament dims, warm glow fades out
- **Switching to light:** the bulb "turns on" — filament lights up, iridescent glow pulses outward
- The iridescent effect uses shifting hues (rainbow/oil-slick quality) via CSS `hue-rotate` animation or conic-gradient

### Design decisions to make in brainstorming

- Does the bulb icon come from lucide-react (`Lightbulb`) or is it a custom SVG with animatable parts (filament, glass, glow)?
- Should the glow be a radial gradient behind the icon, or a CSS `filter: drop-shadow` with animated color?
- Iridescent = shifting hues — how subtle vs. dramatic? (gentle shimmer vs. full rainbow pulse)
- Does the page theme still change via the ripple, or does this variant use a different page transition (e.g. fade, or none)?

### File to create

`src/components/ThemeToggleBulb.tsx` — following the same copy-paste pattern as `ThemeToggleRipple.tsx`

### How to start

Open this project in a new chat and run `/brainstorm` — point it at this file for context.
