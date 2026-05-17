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
context: fork
---

# Frontend Skill

## Goal
Build production-grade frontend interfaces with intentional design, clean architecture, and meticulous attention to detail.

## Design Thinking
1. Analyze context: purpose, audience, tone, constraints
2. Define design tokens: colors, typography, spacing, shadows
3. Commit to a bold aesthetic direction — avoid generic patterns

## Component Architecture
Follow atomic design: `atoms/` → `molecules/` → `organisms/` → `templates/` → `pages/`
Each component gets typed props, co-located tests, and a single responsibility.

## Core Rules
- TypeScript for all components
- Tailwind utility classes for styling (90%+), CSS variables for tokens
- Mobile-first responsive design
- Semantic HTML with ARIA support
- WCAG AA color contrast minimum
- Respect `prefers-reduced-motion`
- Code-split at route level
- Lazy-load heavy components and images
- CSS transforms/opacity for GPU-accelerated animations

## What to Avoid
- Overused fonts (Inter, Roboto, Arial) for display
- Purple-on-white gradient cliches
- Predictable centered layouts
- Inline styles over CSS variables
- Disabled accessibility for aesthetics
- Placeholder data in production components

## References
- `references/COMPONENT_EXAMPLES.md` — Example component patterns
- `references/DESIGN_TOKENS.md` — Design token template
