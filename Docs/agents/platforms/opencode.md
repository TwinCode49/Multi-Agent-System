# Agents in OpenCode

## Agent File Format

```markdown
---
description: >
  TRIGGER KEYWORDS: review, PR, code-quality, lint, style.
  Reviews pull requests for code quality, security, and best practices.
  MUST be invoked proactively when reviewing code changes.
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
permission:
  edit: deny
  bash: deny
---
```

## Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `description` | Yes | Trigger description with keywords |
| `mode` | No | `primary`, `subagent`, or `all` (default: `all`) |
| `model` | No | Provider/model override |
| `variant` | No | Model variant |
| `permission` | No | Per-tool allow/deny/ask rules |
| `temperature` | No | Generation temperature |
| `top_p` | No | Top-p sampling |
| `disable` | No | `true` to disable built-in agent |
| `hidden` | No | Hide from agent selector |

## Auto-Dispatch (Subagent Triggering)

- Primary agents evaluate secondary agent descriptions to decide when to invoke
- The `description` field is the trigger — write it aggressively with keywords
- Manual invocation: `@agent-name` in chat
- Secondary agents can invoke other secondary agents if they have `task` permission

## File Locations

| Scope | Path |
|---|---|
| Project | `.opencode/agents/<name>.md` |
| Global | `~/.config/opencode/agents/<name>.md` |

Both singular (`agent/`) and plural (`agents/`) directory names are supported.

## Creating Agents

```bash
opencode agent create
```

Interactive CLI that generates the `.md` file with permissions.

---
*Model: opencode/deepseek-v4-flash-free*
