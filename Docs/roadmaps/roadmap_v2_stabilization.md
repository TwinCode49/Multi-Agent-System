# v2.0 — Stabilization Roadmap

> **Versión**: 2.0
> **Estado**: 🟡 En curso
> **Última revisión**: 2026-05-21
> **Plan de implementación**: `Docs/Fase-Estabilizacion.md`

## Visión General

Transformar el flujo de escaneo, clasificación y orquestación de `tools_dynamic` para que agents, skills y workflows estén vinculados dinámicamente. El sistema debe poder escanear, clasificar por similitud, validar consistencia, actualizar definitions sin reinyectar, y reportar el estado de la relación agents↔skills.

---

## Fase 1 — Agent-Skill Binding Dinámico

Construir el grafo agente↔skill en los datos escaneados.

- [x] **1.1** Agregar `skills: string[]` a `AgentDef` y `agents: string[]` a `SkillDef` en `core/types.mjs`
- [x] **1.2** Agregar `role?: string` a `SkillDef` en `core/types.mjs`
- [x] **1.3** Modificar `parseSkillFromDir()` en `core/parser.mjs` para extraer `role` del frontmatter de SKILL.md
- [x] **1.4** Modificar `scanDotAgent()` en `core/parser.mjs` para extraer `skills.paths` del frontmatter y resolver a nombres de skill
- [x] **1.5** Actualizar `opencode-scanner.mjs` para construir índice reverso skill→agents post-merge
- [x] **1.6** Actualizar `vscode-scanner.mjs` para construir índice reverso skill→agents post-merge
- [x] **1.7** Actualizar `claude-scanner.mjs` para construir índice reverso skill→agents post-merge
- [x] **1.8** Actualizar `antigravity-scanner.mjs` para construir índice reverso skill→agents post-merge
- [x] **1.9** Actualizar `injector.mjs` — `plan()` para incluir metadatos agent↔skill en definitions JSON
- [x] **1.10** Tests: verificar `agent.skills` y `skill.agents` poblados post-scan

---

## Fase 2 — WorkflowGenerator Skill-Aware con Scoring por Similitud

Clasificar agents por skill usando Jaccard similarity en lugar de lookup table fija.

- [x] **2.1** Crear `core/role-profiles.mjs` con `ROLE_PROFILES` (reviewer, writer, tester, builder) y función `classifyBySkill()`
- [x] **2.2** Reescribir `classifyAgents()` en `workflow-generator.mjs` con lógica skill-aware:
  - [x] **2.2.1** Si skill tiene `role` field → usar ese rol (confianza 100%)
  - [x] **2.2.2** Si no → Jaccard similarity entre keywords del skill y cada perfil
  - [x] **2.2.3** Mejor score define el rol (mínimo 5% de solapamiento)
  - [x] **2.2.4** Fallback a keywords+name si ningún skill matchea
  - [x] **2.2.5** Incluir metadatos `{ role, confidence, method, classified }` por agente
- [x] **2.3** Actualizar `generate()` para incluir `step.skill` en cada step del workflow
- [x] **2.4** Tests: skill conocido → rol correcto con alta confianza
- [x] **2.5** Tests: skill con `role` field → override al rol indicado
- [x] **2.6** Tests: skill custom sin match → `classified: false`
- [x] **2.7** Tests: Jaccard similarity calcula correctamente

---

## Fase 3 — Scanner Post-Scan Feedback

Mostrar el estado de la relación agents↔skills después de cada operación.

- [x] **3.1** Agregar sección "📊 Agent-Skill Mapping" en `reporter.mjs` — `printAnalysis()`
- [x] **3.2** Agregar sección "⚡ Suggested Workflows" en `reporter.mjs` — `printAnalysis()`
- [x] **3.3** Agregar footer con sugerencia de `validate` cuando hay issues
- [x] **3.4** Agregar `unclassifiedAgents` count y `avgConfidence` a `_buildSummary()`
- [x] **3.5** Actualizar `analyze` command para mostrar post-scan feedback
- [x] **3.6** Actualizar `init` command para mostrar feedback post-inyección
- [x] **3.7** Actualizar `inject` command para mostrar feedback post-inyección

---

## Fase 4 — Comando `validate`

Verificar la consistencia entre agents, skills y workflows detectados.

- [x] **4.1** Crear `core/validator.mjs` con clase `Validator`
  - [x] **4.1.1** Check 1: Skills huérfanos (no referenciados por ningún agente) — 🟡 warning
  - [x] **4.1.2** Check 2: Referencias a skills rotas — 🔴 blocker
  - [x] **4.1.3** Check 3: Agentes subagent sin skills — 🟡 warning
  - [x] **4.1.4** Check 4: Workflow definitions con agentes inexistentes — 🟡 warning
  - [x] **4.1.5** Check 5: Keywords sin solapamiento con skill — ℹ️ info
  - [x] **4.1.6** Check 6: Agentes no clasificados — ℹ️ info
  - [x] **4.1.7** Check 7: Agentes con confianza < 30% — ℹ️ info
  - [x] **4.1.8** Check 8: Cross-platform drift en skills — 🟡 warning
- [x] **4.2** Crear `commands/validate.mjs` con lógica de orquestación
- [x] **4.3** Registrar `validate` command en `index.mjs`
- [x] **4.4** Tests: cada check produce el severity correcto
- [x] **4.5** Tests: output `--json` parseable

---

## Fase 5 — Comando `update`

Regenerar definitions de workflow y test cases desde el scan actual.

- [x] **5.1** Agregar método `regenerateWorkflows()` en `core/injector.mjs`
- [x] **5.2** Crear `commands/update.mjs` con lógica de orquestación
  - [x] **5.2.1** Scan actual → generate definitions + test cases
  - [x] **5.2.2** Diff contra archivos existentes
  - [x] **5.2.3** Backup antes de sobrescribir
  - [x] **5.2.4** Escribir solo archivos con cambios
- [x] **5.3** Registrar `update` command en `index.mjs`
- [x] **5.4** Tests: `regenerateWorkflows()` produce definitions correctas
- [x] **5.5** Tests: `--dry-run` no escribe archivos
- [x] **5.6** Tests: backup funciona antes de sobrescribir

---

## Verificación Final

- [x] **V.1** Ejecutar `node --test (Get-ChildItem tools_dynamic/tests/*.test.mjs).FullName` — todos los tests pasan
- [x] **V.2** Ejecutar `tools-dynamic validate .` en el propio proyecto — 0 blockers, 32 warnings (esperado: skills sin agent-ref en el proyecto mismo), 1 info
- [x] **V.3** Ejecutar `tools-dynamic update . --dry-run` — 10 archivos a modificar (1 definition + 9 test cases), 0 a crear
- [x] **V.4** Ejecutar `tools-dynamic analyze .` — muestra agent-skill mapping (0/9 agents con skills, 0/8 skills referenciadas), suggested workflows con confidence
- [x] **V.5** Verificar proyectos con solo `.agent/` — 57 tests pasan en los 4 scanners con fixtures .agent/

---

## Métricas de Éxito

| Métrica | Objetivo | Actual |
|---|---|---|---|
| Tests totales | ≥ 150 | 178 |
| Tests pasando | 100% | 100% |
| Agentes clasificables por skill | ≥ 80% | 100% (cuando tienen skills) |
| Comandos nuevos | 2 (validate, update) | 2 (validate, update) |
| Backward compatibility | Sin breaks | ✅ |

---

*Modelo: opencode/deepseek-v4-flash-free*
