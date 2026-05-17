# Skills in Google Antigravity

## Skill Locations

| Scope | Path |
|---|---|
| Workspace | `.agent/skills/<name>/SKILL.md` |
| Workspace (alt) | `.agents/skills/<name>/SKILL.md` |
| Global | `~/.gemini/antigravity/skills/<name>/SKILL.md` |

## Folder Structure

```
<project>/
└── .agent/
    └── skills/
        ├── my-skill/
        │   ├── SKILL.md
        │   ├── scripts/
        │   ├── references/
        │   └── examples/
        └── another-skill/
            └── SKILL.md
```

Global location:

```
~/.gemini/antigravity/skills/
├── my-skill/
│   └── SKILL.md
└── another-skill/
    └── SKILL.md
```

## Extras

Antigravity also supports:

- **Global workflows**: `~/.gemini/antigravity/global_workflows/<name>.md`
- **Agents**: `~/.gemini/antigravity/agents/<name>.md`
- **GEMINI.md**: Bootstrap instructions at `~/.gemini/GEMINI.md`

## Key Notes

- Workspace skills override global skills with the same name
- Antigravity uses progressive disclosure: Discovery → Activation → Execution
- Use `{{SKILL_PATH}}` and `{{WORKSPACE_PATH}}` for portable relative paths
- The `description` field is the most important trigger — write it semantically

---
*Model: opencode/deepseek-v4-flash-free*
