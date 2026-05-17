# Agents — Documentation

Agents are specialized AI assistants that handle specific tasks. They can be **primary** (user-facing, orchestrators) or **secondary** (specialists invoked by primaries).

## Supported Platforms

| Platform | Primary Agents | Secondary Agents |
|---|---|---|
| OpenCode | `.opencode/agents/<name>.md` — mode: `primary` | `.opencode/agents/<name>.md` — mode: `subagent` |
| Antigravity | `~/.gemini/antigravity/agents/<name>.md` | `~/.gemini/antigravity/agents/<name>.md` |
| VS Code | `.github/agents/<name>.agent.md` | `.github/agents/<name>.agent.md` (via handoffs/subagents) |

## Estándar de Idioma

- **`agent.md`** (instrucciones para IA): debe estar en **Inglés** (frontmatter y cuerpo)
- **Documentación del proyecto** (`Docs/`): en **Español** (orientada a desarrolladores)

## Orchestration

Secondary agents auto-dispatch based on `description` keywords. See `classification.md` for details.

---
*Model: opencode/deepseek-v4-flash-free*
