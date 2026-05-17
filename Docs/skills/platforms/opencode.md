# Skills in OpenCode

## Skill Locations

| Scope | Path |
|---|---|
| Project | `.opencode/skills/<name>/SKILL.md` |
| Global | `~/.config/opencode/skills/<name>/SKILL.md` |
| Auto-loaded | `~/.claude/skills/<name>/SKILL.md` |
| Auto-loaded | `~/.agents/skills/<name>/SKILL.md` |

## Configuration

In `opencode.json`, register custom skill paths:

```json
{
  "skills": {
    "paths": [".opencode/skills", "~/.config/opencode/skills"]
  }
}
```

## How It Works

1. OpenCode scans skill directories for `**/SKILL.md`
2. At session start, the model sees a list of available skills (name + description)
3. If a skill's description matches the task, the model loads the full `SKILL.md`
4. The model follows the skill's instructions

## Important

- Skills are NOT loaded automatically on every session — they are discovered on demand
- The `description` field determines when a skill is activated
- Use `SKILL.md` (uppercase) exactly — OpenCode won't find `skill.md` or `SKILL.MD`

---
*Model: opencode/deepseek-v4-flash-free*
