# Proceso de Testing de Agentes y Skills

> **Estado**: Implementado
> **Herramienta**: `tools/agent-testing/run.mjs`
> **Pruebas**: ~144 tests automatizados sobre 9 agentes + 8 skills + sync multiplataforma

## 1. Objetivo

Garantizar que todos los agentes y skills del proyecto mantienen una estructura consistente, cumplen con los estándares definidos, y están sincronizados entre plataformas (`.opencode/` y `.github/`).

## 2. Cobertura de Pruebas

### 2.1 Agentes (`.opencode/agents/`)

| Agente | Checks | Read-only | Modelo |
|---|---|---|---|
| orchestrator | 10 | No | default |
| database-specialist | 10 | No | claude |
| test-engineer | 10 | No | default |
| doc-agent | 10 | No | default |
| security-reviewer | 11 | Sí | claude |
| perf-engineer | 10 | No | default |
| devops-agent | 10 | No | default |
| code-reviewer | 11 | Sí | claude |
| ui-specialist | 10 | No | default |

### 2.2 Skills (`.opencode/skills/` + `.github/skills/`)

| Skill | Checks + Cross-platform |
|---|---|
| documentation | 7 |
| frontend | 7 |
| backend | 7 |
| testing | 7 |
| database | 7 |
| containerization | 7 |
| terminal | 7 |
| prompt-optimization | 7 |

## 3. Flujo de Trabajo

### 3.1 Desarrollo Normal

```bash
# 1. Hacer cambios en agentes o skills (editar .md)
# 2. Ejecutar pruebas
node tools/agent-testing/run.mjs

# 3. Si falla, revisar errores y corregir
# 4. Repetir hasta que PASS = total
```

### 3.2 Nuevo Agente

1. Crear `<name>.md` en `.opencode/agents/`
2. Asegurar frontmatter con: `description` (TRIGGER KEYWORDS:), `mode`, `permission`
3. Incluir secciones: Core Responsibilities, Behavior Rules, Response Format, Constraints, Handoff Protocol
4. Registrar en `opencode.json` si aplica
5. Crear `tools/agent-testing/cases/<name>.json`
6. Ejecutar `node tools/agent-testing/run.mjs`
7. Si pasa, actualizar Docs/LOG.md

### 3.3 Nuevo Skill

1. Crear `SKILL.md` en `.opencode/skills/<name>/` y `.github/skills/<name>/`
2. Asegurar frontmatter con: `name`, `description` (TRIGGER KEYWORDS:)
3. Incluir secciones: Goal, Constraints, References
4. Crear `references/` con al menos un archivo `.md`
5. Ejecutar `node tools/agent-testing/run.mjs`
6. Verificar cross-platform sync
7. Si pasa, actualizar Docs/LOG.md

### 3.4 Modificar un Agente/Skill

1. Editar el archivo `.md`
2. Ejecutar pruebas
3. Si falla:
   - ¿El cambio rompió una sección esperada? → Actualizar el caso de prueba si el cambio fue intencional
   - ¿El cambio introdujo un error? → Corregir
4. Si pasa, commit normal

## 4. Interpretación de Resultados

```
PASS:  144  ← Todos los checks pasaron
FAIL:  0    ← Hay problemas que REQUIEREN corrección
SKIP:  0    ← Pruebas no aplicables (ej: cross-platform si no existe en .github)
```

### Errores Comunes

| Error | Causa | Solución |
|---|---|---|
| `frontmatter.description: Should start with TRIGGER KEYWORDS:` | El frontmatter no tiene `TRIGGER KEYWORDS:` al inicio | Añadirlo (con dos puntos y espacio) |
| `keywords: Only N keywords, expected at least 5` | Muy pocas keywords | Expandir lista de triggers |
| `section.XXX: Section "XXX" not found` | Falta una sección `##` requerida | Añadir la sección al archivo |
| `cross-platform: missing in .github: ...` | Reference file no copiado a `.github/` | Copiar archivo faltante |
| `frontmatter.mode: Should include "subagent"` | Modo incorrecto | Cambiar a `subagent` (secundarios) o `primary` (orquestador) |

## 5. Troubleshooting

### El runner no encuentra archivos
- Verificar que los archivos existen en `.opencode/agents/` y `.opencode/skills/`
- Verificar permisos de lectura

### Tests lentos
- El runner es instantáneo (solo lectura de archivos, sin IO de red)
- Si hay demora, puede ser por muchos archivos en references/

### Falso positivo en cross-platform
- El check solo compara nombres de archivo, no contenido
- Si un archivo tiene contenido diferente pero mismo nombre, pasa igual
- Para verificar contenido, usar `diff` manualmente

## 6. Referencias

- `tools/agent-testing/run.mjs` — Test runner
- `tools/agent-testing/cases/` — Casos de prueba
- `Docs/processes/skill-review.md` — Proceso de revisión de skills
- `Docs/processes/SKILL_REVIEW_CHECKLIST.md` — Checklist de revisión

---
*Modelo: opencode/deepseek-v4-flash-free*
