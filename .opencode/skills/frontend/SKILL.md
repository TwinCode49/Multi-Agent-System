---
name: frontend
description: >
  TRIGGER KEYWORDS: frontend, UI, component, React, Vue, Svelte, Angular,
  page, layout, styling, CSS, Tailwind, animation, responsive, design-system,
  landing-page, dashboard, interface, widget, interactive, UX, accessibility,
  a11y, HTML, JSX, TypeScript, typography, color-theme, design, aesthetic.
  MUST be used when building or modifying frontend interfaces, components,
  pages, or styling. Covers design thinking, component architecture, atomic
  design patterns, accessibility, responsive layouts, performance, and
  production-grade code that avoids generic AI aesthetics.
---

# Frontend Skill

## Goal
Build production-grade frontend interfaces with intentional design, clean architecture, and meticulous attention to detail. Every component must be functional, accessible, performant, and visually cohesive.

## Design Thinking Process

Before writing any code, establish a clear design direction:

### 1. Context Analysis
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Choose a strong direction — minimal, maximalist, retro, organic, luxury, playful, editorial, brutalist, industrial, etc.
- **Constraints**: Framework, browser support, performance budget, accessibility requirements
- **Differentiation**: What makes this interface memorable?

### 2. Design System Foundation
Define before building:
- Color palette (primary, accent, neutral, semantic) as CSS custom properties
- Typography scale (display, heading, body, small) with distinctive font pairing
- Spacing scale (4/8/12/16/24/32/48/64px)
- Border radius, shadow, and transition tokens

## Component Architecture

### Atomic Design
```
atoms/        — Button, Input, Icon, Badge, Tag
molecules/    — SearchBar, Card, FormField, Dropdown
organisms/    — Header, Sidebar, DataTable, Modal
templates/    — Page layouts, content shells
pages/        — Route-level components
```

### Component Rules
1. Every component gets a single responsibility
2. Props are explicitly typed (TypeScript interfaces)
3. Default exports for pages, named exports for everything else
4. Co-locate styles, tests, and stories with the component
5. Use composition over props drilling
6. Lift state up; keep components pure when possible

### File Structure per Component
```
Button/
├── Button.tsx          — Component implementation
├── Button.types.ts     — Props interface
├── Button.test.tsx     — Unit tests
├── Button.stories.tsx  — Storybook stories
└── index.ts            — Re-export
```

## Styling Conventions

### Tailwind (Primary)
- Use Tailwind utility classes for 90% of styling
- Extract repeated patterns into `@apply` or shared components
- Use `cn()` or `clsx` for conditional classes
- Follow mobile-first responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### CSS Custom Properties
```css
:root {
  --color-primary: #...
  --color-primary-hover: #...
  --font-display: 'Distinctive Font', serif;
  --font-body: 'Refined Font', sans-serif;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
}
```

### Avoid
- Overused system fonts (Inter, Roboto, Arial) for display roles
- Purple-on-white gradient cliches
- Predictable centered layouts with no negative space
- Generic cookie-cutter component patterns

## Accessibility (A11Y)

| Requirement | Implementation |
|---|---|
| Semantic HTML | Use `<nav>`, `<main>`, `<aside>`, `<section>`, `<article>` |
| ARIA labels | `aria-label`, `aria-describedby`, `role` attributes |
| Keyboard nav | All interactive elements reachable and operable via keyboard |
| Focus visible | Visible focus ring, never `outline: none` without replacement |
| Color contrast | WCAG AA minimum (4.5:1 text, 3:1 large text) |
| Reduced motion | Respect `prefers-reduced-motion` media query |
| Screen reader | `sr-only` utility for visually hidden labels |

## Performance

| Practice | Details |
|---|---|
| Bundle size | Code-split at route level, lazy-load heavy components |
| Images | Next.js `Image` or `loading="lazy"`, responsive `srcSet`, WebP/AVIF |
| Fonts | `font-display: swap`, subset fonts, preload critical fonts |
| Animations | Prefer CSS transforms/opacity (GPU-accelerated) over layout-triggering props |
| Re-renders | `React.memo`, `useMemo`, `useCallback` only when profiling shows benefit |
| Tree shaking | Import directly from library subpaths, not barrel files |

## Responsive Design
- **Mobile first**: Base styles are mobile, override at larger breakpoints
- **Breakpoints**: sm=640, md=768, lg=1024, xl=1280, 2xl=1536
- Test at every breakpoint; don't assume desktop
- Use CSS Grid for page layouts, Flexbox for component layouts

## Animation Guidelines
- One high-impact animation sequence beats many small micro-interactions
- Staggered reveals (`animation-delay`) for page load / section entry
- Scroll-triggered animations for long-scrolling pages
- Hover effects that surprise (scale, color shift, background morph)
- Use `Motion` / `framer-motion` for React, CSS animations for vanilla

## Constraints
- Do NOT use placeholder text or dummy data in production components
- Do NOT disable accessibility features for aesthetic reasons
- Do NOT import entire libraries when tree-shakeable subpaths exist
- Do NOT create components without TypeScript interfaces
- Do NOT use inline styles over CSS variables or utility classes
- Every component must handle loading, empty, error, and edge case states

## References
- `references/COMPONENT_EXAMPLES.md` — Example component patterns
- `references/DESIGN_TOKENS.md` — Design token template
