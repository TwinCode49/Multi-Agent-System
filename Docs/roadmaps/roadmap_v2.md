# v2.0 — Roadmap

> **Versión**: 2.0
> **Estado**: Planificado
> **Última revisión**: 2026-05-17
> **Fase 0**: ✅ Completada
> **Fase 1**: ✅ Completada
> **Fase 2**: ✅ Completada

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

## Phase 3 🔬 — Analysis & Report

Implementar los comandos de análisis y diagnóstico.

- [ ] `analyze` command: fingerprinteo completo (plataforma → agentes → skills → workflows → tools existentes)
- [ ] `report` command: output JSON estructurado + HTML con semáforo visual (🟢🟡🔴)
- [ ] `doctor` command: diagnóstico de configuraciones existentes y sugerencias de mejora
- [ ] `list-platforms` command: muestra plataformas detectables y sus indicadores
- [ ] Workflow recommender: basado en agentes descubiertos y tipo de proyecto, sugiere 2-3 workflows
- [ ] Modo interactivo: preguntas al usuario, confirmaciones, barras de progreso
- [ ] Tests de integración contra proyectos reales (incluir fixtures multi-plataforma)

**Entregable**: Análisis completo de cualquier proyecto + reporte visual + recomendaciones

## Phase 4 💉 — Injection & Bootstrap

Implementar la inyección de tools y procesos en el proyecto objetivo.

- [ ] Templates base para `tools/agent-testing/` (runner + cases adaptados)
- [ ] Templates base para `tools/agent-metrics/` (report + config)
- [ ] Templates base para `tools/agent-workflows/` (definitions + executor)
- [ ] Templates para `Docs/processes/` en español (README, multi-agent-workflows, background-execution, agent-handoff, performance-metrics)
- [ ] Templates de configuración por plataforma (`.opencode/`, `.github/`, `.claude/`, antigravity)
- [ ] `inject` command: copia templates + adaptación al proyecto target
- [ ] `init` command: analyze → muestra resumen → preguntas → inject (full bootstrap interactivo)
- [ ] Modo dry-run (`--dry-run`) que muestra diff sin escribir
- [ ] Backup automático de archivos existentes antes de modificar
- [ ] Tests de inyección con verificación post-inyección

**Entregable**: Proyecto target completamente boostrapeado con tools + procesos + workflows

## Phase 5 📦 — Distribution & Documentation (Hybrid pnpm + npm)

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
| Publicación y distribución | `Docs/processes/tools-dynamic/distribution.md` | 5 |

---

*Modelo: opencode/deepseek-v4-flash-free*
