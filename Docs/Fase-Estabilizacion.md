# Fase de Estabilización v2.0 — Plan de Implementación

> **Última revisión:** 2026-05-21
> **Estado:** 🟡 En curso
> **Roadmap:** `Docs/roadmaps/roadmap_v2_stabilization.md`

## Visión General

Transformar el flujo de escaneo, clasificación y orquestación de `tools_dynamic` para que agents, skills y workflows estén vinculados dinámicamente. El sistema debe ser capaz de:

1. Escanear agents y skills construyendo un grafo agente↔skill
2. Clasificar agents por rol usando scoring por similitud de keywords (Jaccard similarity)
3. Validar la consistencia de la configuración detectada
4. Actualizar definitions de workflow y test cases sin reinyectar todo
5. Reportar al usuario el estado de la relación agents↔skills post-scan

---

## Gap 1 — Agent-Skill Binding Dinámico

**Objetivo:** Construir un grafo agente↔skill en los datos escaneados para que el sistema entienda qué skills pertenecen a cada agente y viceversa.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `tools_dynamic/core/types.mjs` | Agregar `skills: string[]` a `AgentDef`, `agents: string[]` a `SkillDef`, `role?: string` a `SkillDef` |
| `tools_dynamic/core/parser.mjs` — `scanDotAgent()` | Extraer `skills.paths` del frontmatter y resolver a nombres de skill |
| `tools_dynamic/core/parser.mjs` — `parseSkillFromDir()` | Parsear campo opcional `role` del frontmatter de SKILL.md |
| `tools_dynamic/scanners/*.mjs` (4) | Construir índice reverso skill→agents después del merge |
| `tools_dynamic/core/injector.mjs` — `plan()` | Incluir metadatos agent↔skill en definitions JSON |

### Tests

| Test | Descripción |
|---|---|
| `tests/scanner.test.mjs` | Verificar que `agent.skills` y `skill.agents` estén poblados post-scan |
| `tests/parser.test.mjs` | Verificar parseo de `skills.paths` y `role` field |

### Criterio de aceptación

- `AgentDef.skills` contiene nombres de skill resueltos desde `skills.paths`
- `SkillDef.agents` contiene nombres de agentes que referencian el skill
- `SkillDef.role` captura el campo opcional del frontmatter
- Definitions JSON incluyen metadatos agent↔skill

---

## Gap 2 — WorkflowGenerator Skill-Aware con Scoring por Similitud

**Objetivo:** Clasificar agents por skill usando scoring por similitud de keywords (Jaccard similarity) en lugar de lookup table fija o regex.

### Archivos a crear

| Archivo | Descripción |
|---|---|
| `tools_dynamic/core/role-profiles.mjs` | Perfiles de rol con keywords de referencia + función `classifyBySkill()` |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `tools_dynamic/core/workflow-generator.mjs` — `classifyAgents()` | Nueva lógica de clasificación skill-aware con scoring |

### Algoritmo de clasificación

1. Si el skill tiene campo `role` en frontmatter → usar ese rol con confianza 100%
2. Si no, calcular Jaccard similarity entre keywords del skill y cada perfil de rol
3. Mejor score define el rol (mínimo 5% de solapamiento)
4. Si ningún skill matchea → fallback a clasificación por keywords+name (método actual)
5. Cada agente recibe metadatos: `{ role, confidence, method, classified }`

### Perfiles de rol

```javascript
ROLE_PROFILES = {
  reviewer: {
    keywords: ["review", "security", "quality", "audit", "vulnerability",
               "code", "lint", "style", "performance", "threat", "owasp",
               "cve", "best-practices", "compliance", "standards"],
  },
  writer: {
    keywords: ["doc", "readme", "changelog", "apidoc", "migration",
               "tutorial", "write", "documentation", "swagger", "openapi",
               "jsdoc", "user-guide", "comment", "adr", "diagram"],
  },
  tester: {
    keywords: ["test", "spec", "coverage", "unittest", "jest", "pytest",
               "assert", "tdd", "bdd", "integration", "e2e", "mock",
               "stub", "fixture", "snapshot", "vitest", "playwright"],
  },
  builder: {
    keywords: ["database", "api", "rest", "graphql", "backend", "server",
               "frontend", "ui", "component", "docker", "deploy", "devops",
               "schema", "migration", "container", "kubernetes", "infra",
               "middleware", "endpoint", "service", "repository"],
  },
};
```

### Tests

| Test | Descripción |
|---|---|
| `tests/workflow-generator.test.mjs` | Skill conocido → rol correcto con alta confianza |
| `tests/workflow-generator.test.mjs` | Skill con `role` field → override al rol indicado |
| `tests/workflow-generator.test.mjs` | Skill custom sin match → `classified: false` |
| `tests/role-profiles.test.mjs` | Jaccard similarity calcula correctamente |

### Criterio de aceptación

- WorkflowGenerator.classifyAgents() usa skill como primera fuente
- Confidence score se calcula y reporta
- `classified: false` para skills sin match
- Backward compatibility: agents sin skills usan fallback de keywords

---

## Gap 3 — Nuevo Comando `validate`

**Objetivo:** Verificar la consistencia entre agents, skills y workflows detectados.

### Archivos a crear

| Archivo | Descripción |
|---|---|
| `tools_dynamic/commands/validate.mjs` | Orquestación del comando validate |
| `tools_dynamic/core/validator.mjs` | Clase Validator con métodos por check |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `tools_dynamic/index.mjs` | Registrar `validate` command |

### Uso

```
tools-dynamic validate [path] [--json]
```

### Checks de validación

| # | Check | Severidad | Método |
|---|---|---|---|
| 1 | Skills huérfanos (no referenciados por ningún agente) | 🟡 warning | `skill.agents.length === 0` |
| 2 | Referencias a skills rotas (agent.skills apunta a skill inexistente) | 🔴 blocker | `agent.skills` contiene nombre no encontrado en `scanResult.skills` |
| 3 | Agentes subagent sin skills asignados | 🟡 warning | `agent.skills.length === 0 && agent.mode === 'subagent'` |
| 4 | Workflow definitions refieren a agentes que ya no existen | 🟡 warning | Workflow step.agent no está en scan actual |
| 5 | Keywords del agent sin solapamiento con keywords del skill | ℹ️ info | `classifyBySkill()` confidence < 0.1 |
| 6 | Agentes no clasificados en ningún rol | ℹ️ info | `classification.classified === false` |
| 7 | Agentes clasificados con confianza < 30% | ℹ️ info | `classification.confidence < 0.3` |
| 8 | Mismo skill en diferentes plataformas con contenido distinto | 🟡 warning | Hash de contenido de SKILL.md difiere entre plataformas |

### Tests

| Archivo | Descripción |
|---|---|
| `tests/validator.test.mjs` | Tests para cada check con fixtures específicos |

### Criterio de aceptación

- Cada check produce el severity correcto
- Output legible con secciones por severidad
- `--json` output parseable programáticamente
- Exit code ≠ 0 si hay blockers

---

## Gap 4 — Nuevo Comando `update`

**Objetivo:** Regenerar definitions de workflow y test cases desde el scan actual sin reinyectar templates.

### Archivos a crear

| Archivo | Descripción |
|---|---|
| `tools_dynamic/commands/update.mjs` | Orquestación del comando update |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `tools_dynamic/index.mjs` | Registrar `update` command |
| `tools_dynamic/core/injector.mjs` | Nuevo método `regenerateWorkflows(scanResults, targetPath)` |

### Uso

```
tools-dynamic update [path] [--dry-run]
```

### Flujo

1. `Scanner.scanAll(targetPath)` → resultados frescos
2. `WorkflowGenerator.generate()` con clasificación skill-aware → nuevas definitions
3. `TestGenerator.generate()` → nuevos test cases
4. `Differ.diff()` contra definitions/cases existentes en `tools/agent-workflows/definitions/` y `tools/agent-testing/cases/`
5. Si `--dry-run`: mostrar diff y salir
6. Backup de definitions/cases existentes (`.bak.<timestamp>`)
7. Escribir solo archivos con cambios
8. Reportar: "N actualizados, M creados, 0 eliminados"

### Consideraciones

- Agentes no clasificados se incluyen como pasos genéricos con `unclassified: true`
- No toca agents `.md` ni skills `SKILL.md`
- Corre `validate` internamente y muestra resumen

### Tests

| Archivo | Descripción |
|---|---|
| `tests/injector.test.mjs` | Test para `regenerateWorkflows()` |
| `tests/update.test.mjs` | Test de integración del comando update |

### Criterio de aceptación

- Regenera solo definitions/cases, no toca agents ni skills
- Backup antes de sobrescribir
- `--dry-run` no escribe nada
- Detecta y reporta cambios reales

---

## Gap 5 — Scanner Post-Scan Feedback

**Objetivo:** Que `analyze`, `init` e `inject` muestren el estado de la relación agents↔skills después de cada operación.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `tools_dynamic/core/reporter.mjs` — `printAnalysis()` | Nueva sección "📊 Agent-Skill Mapping" con agents con skills, skills referenciados, ratio, agentes no clasificados |
| `tools_dynamic/core/reporter.mjs` — `printAnalysis()` | Nueva sección "⚡ Suggested Workflows" con roles detectados y confianza |
| `tools_dynamic/core/reporter.mjs` — `printAnalysis()` | Footer: "💡 Run `tools-dynamic validate .` for detailed diagnostics" |
| `tools_dynamic/core/reporter.mjs` — `_buildSummary()` | Agregar `unclassifiedAgents` count, `avgConfidence` |
| `tools_dynamic/index.mjs` — `analyze`, `init`, `inject` | Post-scan feedback con sugerencias |

### Criterio de aceptación

- `analyze` muestra agent-skill mapping
- `init` e `inject` muestran feedback post-operación
- Sugiere `validate` cuando hay issues detectados

---

## Orden de Implementación

```
Fase 1: types + parser + scanners (Gap 1)
Fase 2: role-profiles.mjs + workflow-generator skill-aware (Gap 2)
Fase 3: reporter feedback (Gap 5 — consume datos de Fases 1-2)
Fase 4: validator + validate command (Gap 3)
Fase 5: update command (Gap 4)
```

Cada paso se testea antes de pasar al siguiente. Los 137 tests existentes deben seguir pasando en cada paso — los cambios son aditivos y no rompen backward compatibility.

---

## Verificación

```powershell
# Unit tests
node --test (Get-ChildItem tools_dynamic/tests/*.test.mjs).FullName

# Validate en proyecto propio
node tools_dynamic/index.mjs validate .

# Update dry-run
node tools_dynamic/index.mjs update . --dry-run
```

---

*Modelo: opencode/deepseek-v4-flash-free*
