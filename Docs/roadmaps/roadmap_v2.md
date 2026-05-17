# v2.0 — Roadmap

> **Versión**: 2.0
> **Estado**: Planificado
> **Última revisión**: 2026-05-17
> **Fase 0**: ✅ Completada
> **Fase 1**: ✅ Completada
> **Fase 2**: ✅ Completada
> **Fase 3**: ✅ Completada
> **Fase 4**: ✅ Completada
> **Fase 5**: ✅ Completada

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

## Phase 6 📦 — Distribution & Documentation (Hybrid pnpm + npm)

Empaquetar y distribuir la herramienta con una estrategia híbrida: **pnpm para desarrollo y testing** (seguridad por defecto contra supply chain attacks), **npm solo para el paso final de publicación OIDC** (mayor madurez en trusted publishing).

### Justificación

En 2025-2026 el ecosistema npm sufrió ataques masivos de supply chain (Shai-Hulud: 796+ packages comprometidos, worm autoreplicante vía preinstall scripts; 454,648 paquetes maliciosos publicados en 2025). pnpm v11 (abril 2026) mitigó estos vectores con:
- `strictDepBuilds: true` — scripts de lifecycle bloqueados por defecto
- `minimumReleaseAge: 1440` — paquetes nuevos no se resuelven hasta 24h después
- `blockExoticSubdeps: true` — transitivas no pueden usar fuentes no confiables
- `allowBuilds` — allowlist explícito de paquetes que pueden ejecutar build scripts

npm publish se mantiene para el paso final porque su integración OIDC (trusted publishing con GitHub Actions) es más madura que la de pnpm v11 (tuvo bugs con OIDC tokens hasta v11.0.8+).

- [ ] `package.json` con `packageManager: "pnpm@11.0.0"` + bin entry point
- [ ] `pnpm-workspace.yaml` con configuración de seguridad (`allowBuilds`, `strictDepBuilds`)
- [ ] `pnpm-lock.yaml` como lockfile (commiteado)
- [ ] README.md en inglés (instalación con npm y pnpm, uso rápido, ejemplos)
- [ ] Documentación en `Docs/processes/tools-dynamic/` en español
- [ ] Publicación en npm registry como `@opencode/tools-dynamic`
- [ ] skills.sh publishing (retomar desde v1 — omitido)
- [ ] CI/CD pipeline híbrido: pnpm install --frozen-lockfile para test, npm publish para release
- [ ] Changelog y migration guide desde v1

**Entregable**: Paquete npm publicado + documentación completa + CI/CD con seguridad supply chain

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
| Publicación y distribución | `Docs/processes/tools-dynamic/distribution.md` | 6 |

---

*Modelo: opencode/deepseek-v4-flash-free*
