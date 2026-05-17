# Skills in VS Code (GitHub Copilot)

## Skill Locations

| Type | Path |
|---|---|
| Project skills | `.github/skills/<name>/SKILL.md` |
| Project skills (alt) | `.claude/skills/<name>/SKILL.md` |
| Project skills (alt) | `.agents/skills/<name>/SKILL.md` |
| Personal skills | `~/.copilot/skills/<name>/SKILL.md` |
| Personal skills (alt) | `~/.claude/skills/<name>/SKILL.md` |
| Personal skills (alt) | `~/.agents/skills/<name>/SKILL.md` |

## Custom Instructions (not skills)

VS Code also supports layered instructions:

| File | Purpose |
|---|---|
| `.github/copilot-instructions.md` | Project-wide coding standards (always-on) |
| `.github/instructions/*.instructions.md` | Path-specific instructions (applyTo glob) |
| `.github/prompts/*.prompt.md` | Reusable prompt snippets (manual invoke) |

## SKILL.md Frontmatter (VS Code specifics)

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Lowercase, hyphens, max 64 chars. Must match parent directory name. |
| `description` | Yes | Max 1024 chars. What it does and when to use it. |
| `context` | No | `inline` (default) or `fork` (dedicated subagent context) |

## Creating Skills

Use `/create-skill` in Copilot Chat to generate a new skill interactively.

## VS Code Custom Agents

Agents use `.agent.md` files in `.github/agents/<name>.agent.md`.

Frontmatter fields: `name`, `description`, `tools`, `agents` (subagent list), `model`, `target`, `handoffs`, `hooks`.

---
*Model: opencode/deepseek-v4-flash-free*
