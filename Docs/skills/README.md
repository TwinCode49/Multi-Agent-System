# Skills — Documentation

Skills are reusable capabilities for AI agents. They provide procedural knowledge that helps agents accomplish specific tasks more effectively.

## Universal Format

All platforms use the **open Agent Skills standard** — a directory with a `SKILL.md` file:

```
my-skill/
├── SKILL.md         # Required: YAML frontmatter + Markdown instructions
├── scripts/         # Optional: Python, Bash, Node scripts
├── references/      # Optional: Documentation, templates, configs
├── examples/        # Optional: Example input/output files
└── assets/          # Optional: Images, logos
```

## Supported Platforms

| Platform | Project Skills | Global Skills |
|---|---|---|
| OpenCode | `.opencode/skills/<name>/SKILL.md` | `~/.config/opencode/skills/<name>/SKILL.md` |
| Antigravity | `.agent/skills/<name>/SKILL.md` | `~/.gemini/antigravity/skills/<name>/SKILL.md` |
| VS Code | `.github/skills/<name>/SKILL.md` | `~/.copilot/skills/<name>/SKILL.md` |

## Estándar de Idioma

- **`SKILL.md`** (instrucciones para IA): debe estar en **Inglés** (frontmatter y cuerpo)
- **Documentación del proyecto** (`Docs/`): en **Español** (orientada a desarrolladores)

---
*Model: opencode/deepseek-v4-flash-free*
