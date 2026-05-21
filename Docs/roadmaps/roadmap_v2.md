# v2.0 — Roadmap

> **Versión**: 2.0
> **Estado**: Planificado
> **Última revisión**: 2026-05-21
> **Fase 0**: ✅ Completada
> **Fase 1**: ✅ Completada
> **Fase 2**: ✅ Completada
> **Fase 3**: ✅ Completada
> **Fase 4**: ✅ Completada
> **Fase 5**: ✅ Completada
> **Fase 5.5**: ✅ Completada
> **Fase 5.6**: ✅ Completada
> **Fase 5.7**: ✅ Completada
> **Fase 5.8**: ✅ Completada
> **Fase de Estabilización**: 🟡 En curso — [`roadmap_v2_stabilization.md`](roadmap_v2_stabilization.md)
> **Fase 6**: 🚫 Omitida (Pospuesta a futuro)

## Visión General

v2.0 transforma el sistema multi-agente de v1 (construido dentro de este proyecto) en una **herramienta portable** (`tools_dynamic`) que puede analizar, diagnosticar y potenciar cualquier proyecto con capacidades de orquestación de agentes.

El objetivo es que cualquier proyecto —sin importar su plataforma (OpenCode, VS Code, Claude Code, Antigravity)— pueda beneficiarse de los workflows multi-agente, el background execution, el handoff protocol y las métricas de rendimiento desarrollados en v1.

## Estrategia

```
v1: Construir el ecosistema (skills, agentes, workflows, tools)
     │
     └── Problem: Orchestrator solo es router de entrada,
          nunca participa en los procesos que coordina
          (Handoff Protocol, synthesis, conflict resolution son código muerto)
     │
     ▼
v2 Phase 0: Revivir el Orchestrator ✅
     │
     ├── Synthesis step opcional en workflows ✓
     ├── Handoff Protocol se vuelve real ✓
     └── Resolución de conflictos con IA ✓
     │
     ▼
v2: Empaquetar el ecosistema para inyectarlo en otros proyectos
     │
     └── tools_dynamic/ CLI autónoma (interactiva)
          ├── analyze   → descubre plataforma, agentes, skills
          ├── report    → genera diagnóstico JSON/HTML
          ├── inject    → copia tools + procesos adaptados
          ├── init      → full bootstrap interactivo
          └── doctor    → diagnostica configuraciones existentes
```

## Phase 0 ✅ — Orchestrator Synthesis Enhancement

Revivir el Orchestrator dándole un rol real en los workflows. Actualmente tiene definido un `## Handoff Protocol` completo con Parallel Handoff Coordination, Distributing Handoffs, y Error Handling — pero nunca se ejecuta porque los workflows lo saltan.

### Problema
- [x] Orchestrator tiene Handoff Protocol definido pero no se usa
- [x] Workflows terminan en doc-agent (síntesis genérica) en lugar de un coordinador con criterio
- [x] No hay resolución de conflictos entre agentes (si code-reviewer y security-reviewer discrepan, no hay quien decida)

### Solución
- [x] Añadir campo `synthesizer` opcional en los workflow definitions JSON
- [x] `synthesizer.agent: "orchestrator"` — paso final que recibe todos los handoffs y produce síntesis
- [x] `synthesizer.input_from` — qué pasos alimentan la síntesis (por defecto: todos)
- [x] Nuevo comando `--synthesize <run-id>` en executor.mjs
- [x] Nuevo estado `synthesis_pending` — después de que todos los steps se completan, el run espera síntesis
- [x] `--simulate` auto-completa síntesis con mock data
- [x] `--handoff` muestra la síntesis como paso final en la cadena
- [x] Actualizar los 3 workflows existentes para incluir synthesizer donde tenga sentido
- [x] Actualizar `Docs/processes/agentes/agent-handoff.md` — documentar el paso de síntesis

### Workflows actualizados
| Workflow | Síntesis | Agente | Entrada |
|---|---|---|---|
| `docs-generation` | No necesita (doc-agent ya sintetiza) | — | — |
| `feature-pipeline` | Opcional (merge test + docs) | orchestrator | test_code, docs |
| `full-review-pipeline` | Sí (reemplaza doc-agent synthesis) | orchestrator | code_review, security_review, perf_review |

**Entregable**: Executor con síntesis por Orchestrator + 3 workflows actualizados + documentación ✅

---

## Phase 1 ✅ — Platform Adaptation & Scanner

Diseñar e implementar los detectores multi-plataforma que son la base de todo el sistema.

- [x] Definir interfaz unificada `PlatformScanner` y `PlatformScanResult`
- [x] Implementar `opencode-scanner.mjs` — detecta `.opencode/`, `AGENTS.md`, `opencode.json`
- [x] Implementar `vscode-scanner.mjs` — detecta `.github/copilot-instructions.md`, `.github/agents/`
- [x] Implementar `claude-scanner.mjs` — detecta `CLAUDE.md`, `.claude/` (skills, agents, rules, settings.json, hooks, mcp.json)
- [x] Implementar `antigravity-scanner.mjs` — detecta `antigravity.yaml/json`
- [x] Implementar `scanner.mjs` (orquestador de todos los scanners)
- [x] `nativeCapabilities` detection: subagentes nativos, Agent Teams, hooks, MCP, ejecución paralela
- [x] Tests unitarios para cada scanner con fixtures de proyectos mock
- [x] Documentar estructura esperada de cada plataforma

**Entregable**: 4 scanners funcionales + interfaz unificada + tests ✅

## Phase 2 ✅ — Core Engine

Construir el núcleo de la CLI y los procesadores de datos.

- [x] CLI framework con `commander` (subcomandos: analyze, report, inject, init, doctor, list-platforms)
- [x] `parser.mjs` — parseo unificado de frontmatter YAML, tablas markdown, JSON, YAML
- [x] `workflow-generator.mjs` — genera definiciones de workflow basadas en agentes descubiertos y `nativeCapabilities`
  - Si el target tiene Agent Teams nativos → generar config para Agent Teams
  - Si no → generar workflows JSON para `executor.mjs`
- [x] `test-generator.mjs` — genera casos de test para `tools/agent-testing/cases/`
- [x] `differ.mjs` — muestra diff preview antes de cualquier modificación
- [x] `reporter.mjs` — genera output en formato JSON, HTML y texto plano
- [x] Template system base (carga de archivos desde `templates/`)

**Entregable**: CLI funcional con todos los subcomandos esqueleto + sistema de templates ✅

## Phase 3 ✅ — Analysis & Report

Implementar los comandos de análisis y diagnóstico.

- [x] `analyze` command: fingerprinteo completo (plataforma → agentes → skills → workflows → tools existentes)
- [x] `report` command: output JSON estructurado con recomendaciones por agente/skill + HTML con semáforo visual (🟢🟡🔴)
- [x] `doctor` command: diagnóstico con 3 severidades (🔴 bloqueante, 🟡 warning, ℹ️ info) y checks expandidos
- [x] `list-platforms` command: muestra plataformas detectables y sus indicadores
- [x] Workflow recommender: basado en agentes descubiertos y tipo de proyecto, sugiere 2-3 workflows
- [x] Modo interactivo: init con inquirer (checkbox, confirm), diff preview, colores, iconos
- [x] Vanilla detector: detecta proyecto Node.js, Python, Rust, Go, .NET sin agent-platform
- [x] Tests de integración: 91 tests total (7 vanilla-detector + 10 reporter-phase3)

**Entregable**: Análisis completo de cualquier proyecto + reporte visual + recomendaciones ✅

## Phase 4 ✅ — Injection & Bootstrap

Implementar la inyección de tools y procesos en el proyecto objetivo.

- [x] Templates para `tools/agent-testing/` (run.mjs + cases adaptados + README) 
- [x] Templates para `tools/agent-metrics/` (report.mjs + README)
- [x] Templates para `tools/agent-workflows/` (executor.mjs + run.mjs + definitions + README)
- [x] Templates para `Docs/processes/` (README + 4 procesos de agentes en español)
- [x] `core/injector.mjs` — carga templates, sustitución {{variables}}, backup, dry-run
- [x] `commands/inject.mjs` — CLI con --dry-run, --tools, --processes, --all
- [x] `init` command actualizado: analyze → inyecta (sin stub Phase 4)
- [x] `--yes` mode: non-interactive full bootstrap
- [x] Backup automático: `.bak.<timestamp>` antes de modificar existentes
- [x] Tests: 25 tests (substitute, loadTemplate, resolveVariables, plan, execute, backup)
- [x] Templates para `.opencode/agents/*.md` (9 agentes: orchestrator, code-reviewer, security-reviewer, test-engineer, doc-agent, database-specialist, ui-specialist, devops-agent, perf-engineer)
- [x] Templates para `.opencode/skills/*/SKILL.md` (9 skills: testing, documentation, frontend, backend, database, containerization, prompt-optimization, terminal, customize-opencode)
- [x] Template para `AGENTS.md` (dispatch matrix con 8 keywords-to-agent mappings)
- [x] Template para `.opencode/opencode.json` (config con todos los agentes registrados)
- [x] `vanilla-detector.suggestSkills()` y `vanilla-detector.suggestAgents()` — recomiendan skills/agentes según framework detectado
- [x] `injector.plan()` actualizado: genera agentes, skills, AGENTS.md, opencode.json cuando se incluye `config` en componentes
- [x] Framework-to-skills mapping: React → frontend, Express → backend+database+containerization, etc.
- [x] Prueba real en proyecto vanilla Node.js+React: agents y skills creados correctamente
- [x] `init` interactivo: cuando no detecta plataforma, pregunta al usuario qué plataforma(s) configurar (OpenCode, VS Code, Claude Code, Antigravity)
- [x] `init --platform <name> --yes`: permite especificar plataforma target en modo no interactivo
- [x] `inject --config`: flag para inyectar solo configuración de agentes/skills
- [x] `doctor` ahora muestra vanilla detection info cuando no hay plataforma
- [x] Fix: `init --yes` ahora inyecta en proyectos vanilla (antes saltaba)
- [x] Fix: `init` interactivo ahora incluye `config` en opciones de componentes
- [x] Fix: `inject` ahora soporta proyectos vanilla
- [x] Multi-platform config: `plan()` genera config para cada plataforma detectada

**Entregable**: Proyecto target completamente boostrapeado con tools + procesos + agentes + skills + configuración ✅

## Phase 5 📊 — Nexus Dashboard: Live Agent Metrics

Transformar el dashboard demo (datos fake con `Random`) en un **panel de métricas reales** que consume los datos generados por las tools de agentes (`agent-metrics`, `agent-testing`, `agent-workflows`). El dashboard vive en `dashboard/` y sirve como herramienta de monitoreo local para cualquier proyecto boostrapeado.

### Problema
- [x] `dashboard/` actualmente mostraba datos de negocio ficticios (usuarios, órdenes, revenue) sin relación con el ecosistema de agentes
- [x] Las tools generan datos valiosos (métricas de agents, resultados de tests, runs de workflows) pero no había UI que los visualice
- [x] No había forma de ver el health del sistema multi-agente sin correr `report.mjs --save` y abrir el JSON manualmente

### Solución

**API Backend** (ASP.NET Core — `Dashboard.Api`):
- [x] `GET /api/metrics/summary` — health general (🟢🟡🔴), structural pass rate, test pass rate, cross-platform sync rate, agent/skill counts
- [x] `GET /api/metrics/agents` — lista de agentes con su metadata: keywords count, mode, sections completeness, handoff presence, alerts
- [x] `GET /api/metrics/skills` — lista de skills con metadata: keywords count, cross-platform sync status, frontmatter validity
- [x] `GET /api/metrics/alerts` — todos los alerts (red + yellow) del último reporte
- [x] `GET /api/metrics/workflows/runs` — últimos workflow runs con status, progreso, steps
- [x] `GET /api/metrics/workflows/definitions` — definiciones de workflow disponibles

**DashboardService** reescrito:
- [x] Lee `tools/agent-metrics/reports/latest.json` para datos de agents/skills/alerts
- [x] Escanea `tools/agent-workflows/runs/` para workflow runs activos/completados
- [x] Escanea `tools/agent-workflows/definitions/` para definiciones disponibles
- [x] Fallback graceful si los archivos no existen (retorna `[]` o `"no-data"` en lugar de error)

**Frontend** (HTML+CSS+JS vanilla con Chart.js):
- [x] **Agent Health Cards** — tarjetas por agente con semáforo, keywords count, handoff presence, mode
- [x] **Overall Health Banner** — indicador grande 🟢🟡🔴 con pass rates
- [x] **Skill Sync Panel** — tabla de skills con estado de sync cross-platform
- [x] **Alerts Timeline** — lista cronológica de alerts con severity color
- [x] **Workflow Runs Panel** — tabla de runs recientes con status badge y progreso
- [x] **Tests Summary** — donut chart pass/fail con counts
- [x] Auto-refresh cada 30s con botón manual
- [x] Chart.js integrado para visualizaciones (health donut + tests donut)

**Entregable**: Nexus Dashboard conectado a datos reales de agents/skills/tests/workflows ✅

---

## Phase 5.5 🧠 — Context Manager: Token Estimation & Auto-Compaction

Implementar un sistema multi-capa de gestión de contexto LLM que monitorea la utilización de tokens, dispara compactación automática antes de ejecutar prompts, y funciona en todas las plataformas (OpenCode, VS Code, Claude Code, Antigravity).

### Problema
- [x] No existía forma de estimar el uso de contexto del LLM en plataformas que no lo exponen nativamente
- [x] OpenCode compacta automáticamente, pero VS Code, Claude Code y Antigravity no tienen este mecanismo
- [x] No había un agente dedicado a la gestión de contexto ni un skill que documente las estrategias
- [x] Los workflows no verificaban contexto antes de ejecutar pasos multi-agente

### Solución (Arquitectura Multi-Capa)

**Tool** (`tools/context-manager/estimate.mjs`):
- [x] Escanea agentes y skills, estima tokens (ratio ~4 chars/token)
- [x] `--check`: chequeo rápido, exit code 1 si > 95%
- [x] `--save`: guarda reporte JSON en `reports/`
- [x] `--model`: especificar modelo para límite de contexto
- [x] `--json`: salida JSON para integración programática
- [x] Modelos soportados: GPT-4, Claude 3/3.5/4, Gemini 1.5/2.0, DeepSeek, Llama, Mistral, Qwen

**Agent** (`context-steward.md`):
- [x] Nuevo agente: `@context-steward` — monitorea, estima y compacta
- [x] Frontmatter: TRIGGER KEYWORDS (context, token, compact, summarize, window, limit, ...)
- [x] Core Responsibilities: estimación, monitoreo de umbrales, ejecución de compactación
- [x] Behavior Rules: chequeo pre-ejecución, umbrales 80%/95%, priorización de pruning
- [x] Handoff Protocol: reporta % de contexto, acciones tomadas, headroom restante

**Skill** (`context-management`):
- [x] Tabla de límites de contexto por familia de modelos
- [x] Umbrales: Safe (<50%), Elevated (50-80%), Warning (80-95%), Critical (>95%)
- [x] Estrategias de compactación: Summarization, Pruning, Consolidation
- [x] Notas por plataforma: qué plataformas tienen auto-compact nativo
- [x] Referencia: `references/platform-limits.md`

**Orquestador actualizado**:
- [x] Context-Aware Dispatch: paso 2 del workflow del orquestador
- [x] Si contexto > 95% → stall hasta compactar
- [x] Si contexto > 80% → compactar antes de tareas largas
- [x] Siempre verificar contexto antes de workflows multi-agente

**Dispatch Matrix actualizada** (4 plataformas):
- [x] OpenCode AGENTS.md: nueva fila `context, token, compact... → @context-steward`
- [x] Antigravity AGENTS.md: ídem
- [x] VS Code AGENTS.md: ídem
- [x] Claude Code AGENTS.md: ídem

**Workflows con pre-step de contexto**:
- [x] `executor.mjs`: `checkContextBeforeSubmit()` antes de aceptar un workflow
- [x] `run.mjs`: muestra estado de contexto al inicio de la validación
- [x] Context check stalla submission si headroom insuficiente

**Injection**:
- [x] Nuevo componente `context` en `injector.mjs`
- [x] `--context` flag en `inject` command
- [x] `context` incluido por defecto en `init --yes` y en interactivo (checked)
- [x] Templates de context-manager tool inyectados como `tools/context-manager/estimate.mjs`

**Documentación**:
- [x] `Docs/processes/tools-dynamic/context-management.md` — descripción, componentes, arquitectura, umbrales, uso, plataformas

**Entregable**: Sistema multi-capa de gestión de contexto con tool, agente, skill, orquestador actualizado, dispatch matrix expandida, workflows conscientes de contexto, y documentación completa. ✅

---

## Phase 5.6 🔄 — Cross-Platform `.agent/` Convention

Implementar el directorio `.agent/` como convención transversal detectada por todos los scanners, unificando la discovery de agents y skills bajo una estructura común independientemente de la plataforma.

### Problema
- [x] Solo `AntigravityScanner` detectaba `.agent/rules/`; OpenCode, VSCode y Claude ignoraban esta estructura
- [x] Proyectos que migraban entre plataformas (ej: Antigravity → OpenCode) perdían la visibilidad de sus agents/skills existentes
- [x] No había una convención compartida para depositar agents/skills independiente de la plataforma

### Solución

**Función compartida** `scanDotAgent(basePath)` en `core/parser.mjs`:
- [x] Escanea `.agent/rules/*.md` → agents (parsea frontmatter YAML con name, description, mode, permissions)
- [x] Escanea `.agent/agents/*.md` → agents (con dedup por nombre contra rules/ y platform native)
- [x] Escanea `.agent/rules/*/SKILL.md` y `.agent/skills/*/SKILL.md` → skills (con referencias)
- [x] Retorna `{ agents: [], skills: [] }`, no toca nada si no existe `.agent/`

**Scanners actualizados** (los 4):
- [x] `OpenCodeScanner` — importa y llama `scanDotAgent()` al final de `scan()`
- [x] `VSCodeScanner` — ídem
- [x] `ClaudeScanner` — ídem
- [x] `AntigravityScanner` — reemplazadas funciones custom `scanAgentsFromRules`/`scanSkillsFromRules` por `scanDotAgent()`
- [x] `detect()` de Antigravity expandido: ahora también detecta `.agent/agents/` y `.agent/skills/`

**Tests** (19 nuevos, total 135):
- [x] Fixtures: `.agent/` con rules, agents, skills y referencias en opencode, vscode, claude, antigravity-rules-project
- [x] Vanilla fixture permanece sin `.agent/` (no interfiere)
- [x] `scanner.test.mjs` actualizado: opencode-project ahora es multi-plataforma (opencode + antigravity)

**Entregable**: `.agent/` como convención cross-platform detectada por todos los scanners, con tests que verifican agents desde 3 fuentes (rules/, agents/, skills/) en las 4 plataformas. ✅

---

## Phase 5.7 🔀 — Multi-Platform AGENTS.md Combining & Phase 6 Postponement

Unificar la generación de `AGENTS.md` para que combine dinámicamente las plataformas activas en lugar de procesarlo repetitivamente dentro del bucle de plataformas.

### Problema
- [x] `AGENTS.md` se procesaba dentro del bucle de plataformas, generando contenido duplicado o incompleto
- [x] No había un método centralizado para construir el archivo combinado con las plataformas activas

### Solución
- [x] Nuevo método `generateCombinedAgentsMd(projectName, activePlatforms)` en `Injector` — construye `AGENTS.md` programáticamente listando los archivos AI-facing según plataformas activas
- [x] Matriz de despacho incluye las 9 reglas core actualizadas (con `@context-steward`)
- [x] Test de integración multi-plataforma en `injector.test.mjs`
- [x] **Fase 6 marcada como omitida** para priorizar estabilización del core antes de publicación npm

**Entregable**: AGENTS.md generado dinámicamente para combinaciones multi-plataforma, con test de integración. ✅

---

## Phase 5.8 📁 — Establishing `.agents/` Plural Convention & Hybrid Scanning

Establecer `.agents/` como el directorio primario (plural) para agentes y skills, alineado con el estándar **[agentskills.io](https://agentskills.io)**, manteniendo compatibilidad total hacia atrás con `.agent/`.

### Problema
- [x] Phase 5.6 introdujo `scanDotAgent()` escaneando `.agent/` como convención cross-platform
- [x] El estándar emergente agentskills.io usa `.agents/` (plural), creando incertidumbre sobre cuál convención seguir
- [x] Los scanners reportaban `.agent/` en `configPaths` en lugar de la ruta unificada `.agents/`

### Solución
- [x] `scanDotAgent()` ya escaneaba `.agents/` primero y `.agent/` como fallback (heredado de Phase 5.6)
- [x] `opencode-scanner.mjs` y `vscode-scanner.mjs` ahora reportan `.agents/` en `configPaths` en lugar de `.agent/`
- [x] `antigravity-scanner.mjs` y `claude-scanner.mjs` ya usaban `.agents/` correctamente
- [x] Fixture híbrido creado en `antigravity-rules-project` con ambos directorios coexistiendo
- [x] Nuevo test `scan hybrid merges agents/skills from both .agent and .agents` con verificación de:
  - Merge correcto de ambas fuentes
  - Precedencia plural (`.agents` gana en duplicados)
  - Deduplicación por nombre
  - `configPaths` unificado en `.agents`

**Entregable**: Convención `.agents/` como estándar primario, scanners unificados, tests de hybrid scanning, compatibilidad hacia atrás garantizada con 137/137 tests pasando. ✅

---

## Phase 6 📦 — Distribution & Documentation (Hybrid pnpm + npm) — 🚫 Omitida (Pospuesta a futuro)

*Esta fase ha sido movida a [`Docs/project/proposed-changes.md`](../project/proposed-changes.md#13-v2--distribución--publicación-npm) para centralizar todos los cambios omitidos y propuestas futuras. Consultar ese documento para detalles completos.*

---

## Proyectos Objetivo Soportados

| Plataforma | Indicador | Skills | Agentes | Orquestación |
|---|---|---|---|---|
| **OpenCode** | `.opencode/`, `AGENTS.md` | `.opencode/skills/*/SKILL.md` | `.opencode/agents/*.md` | Custom (`executor.mjs`) |
| **VS Code / GitHub Copilot** | `.github/copilot-instructions.md` | `.github/skills/*/SKILL.md` | `.github/agents/*.md` | Custom (adaptada) |
| **Claude Code** | `CLAUDE.md`, `.claude/` | `.claude/skills/*/SKILL.md` | `.claude/agents/*.md` | Nativa (Subagents + Agent Teams) + Custom |
| **Antigravity** | `antigravity.yaml` | TBD | TBD | TBD |

## Métricas de Éxito de v2.0

| Métrica | Objetivo |
|---|---|
| Plataformas detectables | ≥ 4 (OpenCode, VS Code, Claude Code, Antigravity) |
| Precisión de detección | ≥ 95% en proyectos con estructura estándar |
| Tests de tools_dynamic | ≥ 50 tests, 100% pass rate |
| Tiempo de análisis | < 2s para proyectos de tamaño medio |
| Tiempo de inyección completa | < 10s (sin incluir npm install) |
| Proyectos boostrapeados sin error | 100% en tests de integración |

---

## Procesos a Documentar en v2.0

Cada fase genera procesos en `Docs/processes/`:

| Proceso | Archivo | Fase |
|---|---|---|
| Escaneo multi-plataforma | `Docs/processes/tools-dynamic/scanner.md` | 1 |
| Generación de workflows adaptativos | `Docs/processes/tools-dynamic/workflow-generation.md` | 2 |
| Análisis y reporte | `Docs/processes/tools-dynamic/analysis-report.md` | 3 |
| Inyección de tools | `Docs/processes/tools-dynamic/injection.md` | 4 |
| Dashboard de métricas de agentes | `Docs/processes/tools-dynamic/dashboard.md` | 5 |
| Fase de Estabilización (plan) | `Docs/Fase-Estabilizacion.md` | Estabilización |
| Fase de Estabilización (roadmap) | `Docs/roadmaps/roadmap_v2_stabilization.md` | Estabilización |
| Propuestas y cambios omitidos | `Docs/project/proposed-changes.md` | — |

---

*Modelo: opencode/deepseek-v4-flash-free*
