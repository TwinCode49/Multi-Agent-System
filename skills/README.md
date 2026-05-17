# skills/ — Template Reference (Deprecated)

> **⚠️ Deprecated**: Los skills activos están en `.opencode/skills/` (OpenCode) y `.github/skills/` (VS Code).
>
> Esta carpeta raíz `skills/` contiene solo los templates `_template/` que se usaron como modelo inicial. Las implementaciones reales de los skills están en las ubicaciones runtime.

## Propósito Original

Esta carpeta se creó como repositorio unificado de templates de skills para 3 plataformas. Durante la Fase 2, todos los skills se implementaron directamente en las ubicaciones runtime:

| Plataforma | Ubicación Runtime |
|---|---|
| OpenCode | `.opencode/skills/<name>/SKILL.md` |
| VS Code | `.github/skills/<name>/SKILL.md` |
| Antigravity | No implementado aún (usar `.opencode/skills/` como referencia) |

## Skills Implementados (Fase 2)

| Skill | OpenCode | VS Code |
|---|---|---|
| Documentation | `.opencode/skills/documentation/SKILL.md` | `.github/skills/documentation/SKILL.md` |
| Frontend | `.opencode/skills/frontend/SKILL.md` | `.github/skills/frontend/SKILL.md` |
| Backend | `.opencode/skills/backend/SKILL.md` | `.github/skills/backend/SKILL.md` |
| Testing | `.opencode/skills/testing/SKILL.md` | `.github/skills/testing/SKILL.md` |
| Database | `.opencode/skills/database/SKILL.md` | `.github/skills/database/SKILL.md` |
| Containerization | `.opencode/skills/containerization/SKILL.md` | `.github/skills/containerization/SKILL.md` |
| Terminal | `.opencode/skills/terminal/SKILL.md` | `.github/skills/terminal/SKILL.md` |
| Prompt Optimization | `.opencode/skills/prompt-optimization/SKILL.md` | `.github/skills/prompt-optimization/SKILL.md` |

Para crear nuevos skills, usar `opencode.json` skills.paths o colocar los archivos directamente en `.opencode/skills/<name>/`.
