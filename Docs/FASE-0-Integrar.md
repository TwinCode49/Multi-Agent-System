# FASE-0 — Integrar tools_dynamic en el Propio Proyecto

> **Propósito**: Hacer que `tools_dynamic` funcione correctamente sobre este proyecto, tanto para la configuración `.opencode/` existente como para la convención `.agents/` (vanilla).
>
> **Pre-requisito** para los Fixes 1-5 del roadmap `roadmap_v2_Fixes.md`.

---

## Diagnóstico

### Problema raíz

Los 4 scanners (`opencode`, `vscode`, `claude`, `antigravity`) parsean agentes desde sus directorios nativos usando código inline, y **ninguno extrae `skills.paths` del frontmatter**. Ejemplo del `opencode-scanner.mjs` (líneas 61-73):

```js
result.agents.push({
    name, role, keywords, mode, filePath, permissions, sections, hasHandoff
    // ❌ skills: [], _skillRefs  — AUSENTES
});
```

Mientras que `parseAgentFromMd()` en `parser.mjs` SÍ lo hace:

```js
const rawSkills = Array.isArray(frontmatter.skills)
  ? frontmatter.skills
  : (Array.isArray(frontmatter.paths) ? frontmatter.paths : []);
// _skillRefs = [".opencode/skills/testing"]
```

Pero `scanDotAgent()` (único que usa `parseAgentFromMd()`) solo revisa `.agents/` y `.agent/`, no los directorios nativos como `.opencode/agents/`. Y el merge salta agentes ya existentes por nombre.

### Consecuencia

```
Agentes en .opencode/agents/ → scanner inline (sin _skillRefs) → buildCrossIndex con agent.skills = []
                                                                     ↓
                                                           Clasificación cae a keyword fallback (50%)
                                                                     ↓
                                                           Agent-Skill Mapping: 0/9 agents con skills
```

### Alcance

El bug está en los 4 scanners, pero la prioridad es `opencode-scanner` (el que usa este proyecto). Los otros 3 se corrigen por consistencia.

---

## Cambios Realizados

### Paso 0 — Agregar `role` explícito a los skills del proyecto

Se agregó `role:` en el frontmatter de cada skill en `.opencode/skills/*/SKILL.md` para clasificación explícita (100% confianza).

### Paso 1-4 — Extraer `_skillRefs` en los 4 scanners

Se agregó en cada scanner:
1. Extracción de `frontmatter.paths` como `_skillRefs` en el push inline de agente
2. Llamada a `resolveSkillRefs()` antes de `buildCrossIndex()`

### Paso 5 — Ejecutar `update .`

Se regeneraron `tools/agent-workflows/definitions/*.json` y `tools/agent-testing/cases/*.json` con `step.skill` poblado.

### Paso 6 — Verificar con analyze + validate

Se confirmó que `analyze .` muestra Agent-Skill Mapping correcto y `validate .` reporta skills referenciadas.

### Paso 7 — Tests

178 tests pasan.

---

## Archivos Modificados

| Archivo | Cambio |
|---|---|
| `.opencode/skills/testing/SKILL.md` | +`role: tester` |
| `.opencode/skills/documentation/SKILL.md` | +`role: writer` |
| `.opencode/skills/frontend/SKILL.md` | +`role: builder` |
| `.opencode/skills/backend/SKILL.md` | +`role: builder` |
| `.opencode/skills/database/SKILL.md` | +`role: builder` |
| `.opencode/skills/containerization/SKILL.md` | +`role: builder` |
| `.opencode/skills/terminal/SKILL.md` | +`role: builder` |
| `.opencode/skills/prompt-optimization/SKILL.md` | +`role: writer` |
| `tools_dynamic/scanners/opencode-scanner.mjs` | Extraer `_skillRefs` + `resolveSkillRefs()` |
| `tools_dynamic/scanners/vscode-scanner.mjs` | Extraer `_skillRefs` + `resolveSkillRefs()` |
| `tools_dynamic/scanners/claude-scanner.mjs` | Extraer `_skillRefs` + `resolveSkillRefs()` |
| `tools_dynamic/scanners/antigravity-scanner.mjs` | Extraer `_skillRefs` + `resolveSkillRefs()` |

---

*Modelo: opencode/deepseek-v4-flash-free*
