# Agents in VS Code (GitHub Copilot)

## Agent File Format (`.agent.md`)

```markdown
---
name: code-reviewer
description: >
  TRIGGER KEYWORDS: review, PR, code-quality, lint.
  Reviews code for quality, security, and best practices without modifying files.
mode: subagent
tools:
  - read
  - grep
model:
  - GPT-5 (copilot)
  - Claude Sonnet 4.5 (copilot)
---
```

## Frontmatter Fields

| Field | Description |
|---|---|
| `name` | Agent name (defaults to filename) |
| `description` | Shown as placeholder in chat input |
| `tools` | List of available tools (read, grep, edit, bash, etc.) |
| `agents` | List of subagents available (use `*` for all) |
| `model` | Prioritized list of models |
| `target` | `vscode` or `github-copilot` |
| `handoffs` | Suggested next actions / agent transitions |
| `hooks` | Lifecycle hooks (preview) |

## File Locations

| Scope | Path |
|---|---|
| Project agents | `.github/agents/<name>.agent.md` |
| User agents | User profile directory |

## Creating Agents

Use `/create-agent` in Copilot Chat to generate interactively.

## VS Code Customizations Hierarchy

1. `.github/copilot-instructions.md` — always-on
2. `.github/instructions/*.instructions.md` — path-specific
3. `.github/agents/*.agent.md` — custom agents
4. `.github/skills/*/SKILL.md` — agent skills
5. `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` — cross-platform instructions

---
*Model: opencode/deepseek-v4-flash-free*
