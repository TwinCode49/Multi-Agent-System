# Agents in Google Antigravity

## Agent File Format

```markdown
---
description: >
  TRIGGER KEYWORDS: database, SQL, query, schema.
  Database specialist for schema design and query optimization.
  MUST be invoked for any database-related work.
mode: subagent
---
```

## File Locations

| Scope | Path |
|---|---|
| Global agents | `~/.gemini/antigravity/agents/<name>.md` |
| Workflows | `~/.gemini/antigravity/global_workflows/<name>.md` |

## Agent-Specific Support

- Antigravity agents are defined as plain Markdown files
- Frontmatter includes `description` and `mode`
- Agents can be invoked via `@mention`
- Workflows are slash commands (`/command`) stored in `global_workflows/`

## GEMINI.md Bootstrap

The `~/.gemini/GEMINI.md` file acts as the global instruction block, telling the agent to check skills before acting. This is how SuperAntigravity and similar frameworks enable always-on behavior.

---
*Model: opencode/deepseek-v4-flash-free*
