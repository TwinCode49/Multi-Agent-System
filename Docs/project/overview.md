# Project Overview

## Purpose

Create a structured, maintainable system for generating and managing custom AI agent skills and agents across multiple platforms (OpenCode, Antigravity, VS Code).

## Key Principles

1. **Cross-platform compatibility** — skills and agents should work on any platform with minimal adaptation
2. **Orchestration-first** — agents auto-dispatch based on keyword matching, not manual invocation
3. **Documentation-driven** — every decision, structure, and template is documented in `Docs/`
4. **Idioma estándar** — instrucciones para la IA en **Inglés** (`SKILL.md`, `agent.md`); documentación para desarrolladores en **Español** (`Docs/`)

## Stack

| Component | Technology |
|---|---|
| Skills format | Open Agent Skills standard (`SKILL.md`) |
| Orchestration | `AGENTS.md` dispatch matrix |
| Primary platform | OpenCode (with cross-platform templates) |

## Repository Structure

```
/
├── Docs/           # Project documentation and roadmaps
├── .opencode/      # Active OpenCode config, agents, and skills
├── .github/        # Active VS Code skills
├── dashboard/      # Test project (Nexus Dashboard)
└── tools/          # Validation, metrics, and workflow tools
```

---
*Model: opencode/deepseek-v4-flash-free*
