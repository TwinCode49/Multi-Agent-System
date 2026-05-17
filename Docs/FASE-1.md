# Fase 1 — Base: Estructura de Skills y Agentes

**Fecha:** 2026-05-16
**Estado:** Completada

## Objetivos

1. Generar documentación del proyecto dentro de `Docs/`
2. Inicializar configuración global de agentes con `/init`
3. Crear estructura de carpetas de skills para OpenCode, Antigravity y VS Code
4. Crear estructura de carpetas de agentes para OpenCode, Antigravity y VS Code
5. Documentar fuentes de skills (skills.sh, Agent Skills Hub, etc.)
6. Documentar fuentes de agentes y su clasificación (primarios vs secundarios)
7. Implementar reglas de orquestación con matriz keyword-to-agent
8. Establecer estándar de idioma: **Español** para documentación de desarrollo (`Docs/`), **Inglés** para instrucciones a la IA (skills, agentes)

## Entregables

| Ítem | Estado | Ubicación |
|---|---|---|
| Estructura Docs/ | Completado | `Docs/` |
| AGENTS.md (orquestación) | Completado | `./AGENTS.md` |
| opencode.json | Completado | `.opencode/opencode.json` |
| Templates de skills (x3) | Completado | `skills/{opencode,antigravity,vscode}/_template/` |
| Definiciones de agentes (primarios + secundarios) | Completado | `agents/{opencode,antigravity,vscode}/{primary,secondary}/` |
| LOG.md | Completado | `Docs/LOG.md` |

## Decisiones de Arquitectura

- **Orquestación**: Doble nivel — matriz de dispatch en `AGENTS.md` + `description` con TRIGGER KEYWORDS por agente
- **Idioma**: Skills/agentes → **Inglés** (instrucciones para IA); Documentación → **Español** (orientada a desarrolladores)
- **Templates**: Estructura completa con subdirectorios (`scripts/`, `references/`, `examples/`, `assets/`)
- **Ejecución paralela**: No nativa en OpenCode; requiere plugins (oh-my-openagent, opencode-council)

---
*Modelo: opencode/deepseek-v4-flash-free*
