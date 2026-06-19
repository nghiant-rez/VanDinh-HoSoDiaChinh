---
name: ui-glassmorphism
description: Tailwind 4 glassmorphism and Figma tokens for this project
---

Design tokens in `src/app/globals.css`:
- `--color-primary` / `--color-bg-card` / `--color-border` etc.
- Use `@theme inline {}` in globals.css for Tailwind 4 compatibility

Glassmorphism pattern:
```tsx
className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 shadow-lg"
```

Dark mode: class-based (Tailwind 4 default)
- Light: `bg-white text-gray-900`
- Dark: `bg-gray-900 text-gray-100`

Figma: `docs/references.md`
