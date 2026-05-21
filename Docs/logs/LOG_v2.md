---
*Modelo: opencode/deepseek-v4-flash-free*

## 2026-05-21 Phase 5.8 — Establishing `.agents/` Plural Convention & Hybrid Scanning

### Cambios

- **Convención plural `.agents/` establecida como estándar primario**:
  - `scanDotAgent()` en `parser.mjs` ya escaneaba `.agents/` primero y `.agent/` como fallback (implementado en Phase 5.6).
  - Los scanners ahora reportan `.agents/` como ruta unificada en `configPaths` para todos los hallazgos híbridos.

- **Scanners actualizados para usar `.agents` en configPaths**:
  - `opencode-scanner.mjs`: cambiada la ruta de `.agent` a `.agents` en el bloque de hybrid scanning.
  - `vscode-scanner.mjs`: ídem.
  - `antigravity-scanner.mjs` y `claude-scanner.mjs`: ya usaban `.agents` correctamente.

- **Hybrid test fixture creado**:
  - `antigravity-rules-project` ahora incluye `.agents/rules/` con agentes y skills que coexisten con `.agent/`.
  - Verifica que el merge híbrido funciona con deduplicación y precedencia plural.
  - Agentes/skills exclusivos de `.agents/` se descubren correctamente.
  - Agentes/skills exclusivos de `.agent/` se mantienen por compatibilidad hacia atrás.

- **Nuevo test añadido**: `scan hybrid merges agents/skills from both .agent and .agents` en `antigravity-scanner.test.mjs`.

### Archivos modificados

- `scanners/opencode-scanner.mjs` — `.agent` → `.agents` en configPaths
- `scanners/vscode-scanner.mjs` — `.agent` → `.agents` en configPaths
- `tests/antigravity-scanner.test.mjs` — nuevo test de hybrid merge
- `Docs/logs/LOG_v2.md` — este entry

### Archivos creados

- `tests/fixtures/antigravity-rules-project/.agents/rules/general.md`
- `tests/fixtures/antigravity-rules-project/.agents/rules/architect.md`
- `tests/fixtures/antigravity-rules-project/.agents/rules/database/SKILL.md`
- `tests/fixtures/antigravity-rules-project/.agents/rules/devops/SKILL.md`

---

## 2026-05-20 Phase 5.7 (Revision) — Multi-Platform AGENTS.md Combining & Phase 6 Postponement

### Cambios

- **Combinación inteligente de AGENTS.md**:
  - Removido el procesamiento repetitivo de `AGENTS.md` dentro del bucle de plataformas en `injector.plan()`.
  - Agregado método `generateCombinedAgentsMd(projectName, activePlatforms)` a la clase `Injector`. Construye programáticamente el archivo `AGENTS.md` combinando los archivos específicos de IA (como `opencode.json`, `GEMINI.md`, `.github/copilot-instructions.md`, `CLAUDE.md`) según las plataformas que estén activas en la configuración inyectada.
  - La matriz de despacho incluye todas las 9 reglas core de despacho actualizadas (con `@context-steward`).

- **Roadmap Actualizado**:
  - Marcada la **Fase 6** (Distribution) como **Omitida (Pospuesta a futuro)** en `Docs/roadmaps/roadmap_v2.md` con el objetivo de estabilizar y agregar más características antes del despliegue del paquete en npm.

- **Tests de Integración**:
  - Creado un test en `tests/injector.test.mjs` para verificar la planificación en proyectos multi-plataforma y corroborar que `AGENTS.md` se combine sin colisiones y con todas sus directivas.

### Archivos modificados

- `core/injector.mjs` — implementado método y modificado `plan()`
- `tests/injector.test.mjs` — agregado test de integración multi-plataforma
- `Docs/roadmaps/roadmap_v2.md` — postergación de la fase 6
- `Docs/logs/LOG_v2.md` — este log

---

## 2026-05-17 Phase 5.6 — Cross-Platform `.agent/` Convention

### Cambios

- **Nueva función compartida** `scanDotAgent(basePath)` en `core/parser.mjs`:
  - Escanea `.agent/rules/*.md` → agents (con frontmatter parsing)
  - Escanea `.agent/agents/*.md` → agents (dedup por nombre vs rules y nativos)
  - Escanea `.agent/rules/*/SKILL.md` y `.agent/skills/*/SKILL.md` → skills (con referencias)
  - Retorna vacío si no existe `.agent/`, mergea sin duplicar

- **OpenCodeScanner**: importa `scanDotAgent`, llama al final de `scan()`. Ahora detecta agents/skills de `.agent/` además de `.opencode/`.

- **VSCodeScanner**: ídem, además de `.github/`.

- **ClaudeScanner**: ídem, además de `.claude/` y `CLAUDE.md`.

- **AntigravityScanner**: simplificado — eliminadas funciones `scanAgentsFromRules`, `scanSkillsFromRules`, `RULES_DIR`, `hasRulesDir`. Reemplazadas por `scanDotAgent()`. `detect()` expandido para incluir `.agent/agents/` y `.agent/skills/`.

- **Tests**: 19 nuevos (total 135). Fixtures actualizados con estructura `.agent/` en opencode, vscode, claude, antigravity-rules-project. Vanilla fixture limpio.

- **Scanner orchestrator test**: opencode-project ahora es multi-plataforma (opencode + antigravity vía .agent/)

### Archivos modificados

- `core/parser.mjs` — nueva función `scanDotAgent()` exportada
- `scanners/opencode-scanner.mjs` — importa y usa `scanDotAgent`
- `scanners/vscode-scanner.mjs` — ídem
- `scanners/claude-scanner.mjs` — ídem
- `scanners/antigravity-scanner.mjs` — simplificado, usa `scanDotAgent` en lugar de funciones custom
- `tests/scanner.test.mjs` — opencode-project espera 2 platforms
- `Docs/roadmaps/roadmap_v2.md` — Phase 5.6 agregada
- `Docs/logs/LOG_v2.md` — este entry

### Archivos de test creados

- `tests/fixtures/opencode-project/.agent/rules/architect.md`
- `tests/fixtures/opencode-project/.agent/agents/security-specialist.md`
- `tests/fixtures/opencode-project/.agent/skills/cli-tooling/{SKILL.md, references/patterns.md}`
- `tests/fixtures/vscode-project/.agent/rules/formatting.md`
- `tests/fixtures/claude-project/.agent/rules/reviewer.md`
- `tests/fixtures/claude-project/.agent/skills/security/{SKILL.md, references/owasp.md}`
- `tests/fixtures/antigravity-rules-project/.agent/agents/deployment.md`
- `tests/fixtures/antigravity-rules-project/.agent/skills/logging/{SKILL.md, references/best-practices.md}`

## 2026-05-17 Phase 5.5 — Context Manager: Token Estimation & Auto-Compaction

### Cambios

- **Nuevo tool**: `templates/tools/context-manager/estimate.mjs`
  - Escanea agentes y skills, estima tokens (~4 chars/token)
  - Flags: `--check`, `--save`, `--model`, `--json`
  - Modelos soportados: GPT-4, Claude, Gemini, DeepSeek, Llama, Mistral, Qwen
  - Exit code 1 si contexto > 95% (útil para CI/gating)

- **Nuevo agente**: `templates/config/agents-skills/agents/context-steward.md`
  - `@context-steward` — monitorea contexto, compacta cuando es necesario
  - TRIGGER KEYWORDS: context, token, compact, summarize, window, limit, usage, memory, conversation, history
  - Edit: allow, bash: allow, con skill path a context-management

- **Nuevo skill**: `templates/config/agents-skills/skills/context-management/`
  - `SKILL.md` — estrategias de compactación, umbrales, notas por plataforma
  - `references/platform-limits.md` — límites de contexto por modelo y plataforma

- **Orquestador actualizado**: Context-Aware Dispatch agregado como paso 2 del workflow
  - > 95% → stall hasta compactar
  - > 80% → compactar antes de tareas largas

- **Dispatch Matrix actualizada** en las 4 plataformas:
  - `templates/config/opencode/AGENTS.md`
  - `templates/config/antigravity/AGENTS.md`
  - `templates/config/vscode/AGENTS.md`
  - `templates/config/claude/AGENTS.md`
  - Nueva fila: `context, token, compact... → @context-steward`

- **Workflows con pre-step de contexto**:
  - `executor.mjs`: `checkContextBeforeSubmit()` — verifica headroom antes de aceptar workflows
  - `run.mjs`: muestra estado de contexto al inicio de validación
  - Stalla submission si headroom insuficiente para los pasos del workflow

- **Injection**:
  - `core/injector.mjs`: nuevo componente `context` inyecta `tools/context-manager/`
  - `index.mjs`: `context` incluido por defecto en `init --yes` e interactivo
  - `commands/inject.mjs`: nuevo flag `--context`

- **Documentación**: `Docs/processes/tools-dynamic/context-management.md`

- **Roadmap**: Phase 5.5 agregada con checklist completo `[x]` entre Phase 5 y Phase 6

### Archivos creados

- `templates/tools/context-manager/estimate.mjs`
- `templates/config/agents-skills/agents/context-steward.md`
- `templates/config/agents-skills/skills/context-management/SKILL.md`
- `templates/config/agents-skills/skills/context-management/references/platform-limits.md`
- `Docs/processes/tools-dynamic/context-management.md`

### Archivos modificados

- `templates/config/opencode/AGENTS.md` — nueva fila context-steward en dispatch matrix
- `templates/config/antigravity/AGENTS.md` — ídem
- `templates/config/vscode/AGENTS.md` — ídem
- `templates/config/claude/AGENTS.md` — ídem
- `templates/config/agents-skills/agents/orchestrator.md` — Context-Aware Dispatch agregado
- `templates/tools/agent-workflows/executor.mjs` — checkContextBeforeSubmit() + import execSync
- `templates/tools/agent-workflows/run.mjs` — context check al inicio
- `core/injector.mjs` — nuevo componente `context`
- `index.mjs` — context en defaults y checklist
- `commands/inject.mjs` — flag `--context`
- `Docs/roadmaps/roadmap_v2.md` — Phase 5.5 agregada
- `Docs/logs/LOG_v2.md` — este entry

## 2026-05-17 Phase 5 — Nexus Dashboard: Live Agent Metrics

### Cambios

- **Roadmap reestructurado**: Phase 5 original (Distribution) movida a Phase 6; nueva Phase 5 dedicada al Dashboard
- **Dashboard API reescrito**: `DashboardService.cs` ahora lee datos reales en lugar de `Random`:
  - `GET /api/metrics/summary` — health general, pass rates, agent/skill counts
  - `GET /api/metrics/agents` — lista de agentes con keywords, mode, handoff, alerts
  - `GET /api/metrics/skills` — skills con keywords, sync status, frontmatter validity
  - `GET /api/metrics/alerts` — todos los alerts del último reporte de métricas
  - `GET /api/metrics/workflows/runs` — últimos workflow runs con status y progreso
  - `GET /api/metrics/workflows/definitions` — definiciones de workflow disponibles
- **DashboardService** ahora:
  - Lee `tools/agent-metrics/reports/latest.json` para datos de agents/skills/alerts
  - Escanea `tools/agent-workflows/runs/` para workflow runs
  - Escanea `tools/agent-workflows/definitions/` para definiciones
  - Fallback graceful si los archivos no existen
- **Frontend** rediseñado para mostrar datos reales de agentes:
  - Agent Health Cards con semáforo
  - Overall Health Banner con pass rates
  - Skill Sync Panel
  - Alerts Timeline
  - Workflow Runs Panel
  - Tests Summary con barra de progreso
  - Auto-refresh cada 30s

### Archivos modificados

- `dashboard/backend/Dashboard.Api/Services/DashboardService.cs` — reemplazado Random por lectores de archivos reales
- `dashboard/backend/Dashboard.Api/Models/Models.cs` — nuevos records para datos de agentes
- `dashboard/backend/Dashboard.Api/Program.cs` — nuevos endpoints de métricas
- `dashboard/frontend/index.html` — layout enfocado en agentes
- `dashboard/frontend/js/app.js` — fetch de datos reales
- `dashboard/frontend/css/styles.css` — nuevos estilos para agent dashboard
- `Docs/roadmaps/roadmap_v2.md` — Phase 5 movida a Phase 6, nueva Phase 5 agregada
- `Docs/processes/tools-dynamic/dashboard.md` — documentación del dashboard
- `Docs/logs/LOG_v2.md` — este entry

### Verificación

- **API build**: 0 errores, 0 warnings
- **tools_dynamic tests**: 116/116 pass
- **Datos de prueba**: sample report generado en e2e-opencode con 9 agents, 9 skills, 4 alerts, 3 workflow runs
- **Roadmap**: todos los checklist de Phase 5 marcados como `[x]`, status `✅ Completada`
- **Phase 6**: renumerada, checklist intacto (pendiente de implementar)

### Fix post-implementación

- **Bug en `DashboardService.cs`**: `structural_pass_rate`, `test_pass_rate`, `cross_platform_sync_rate` no se multiplicaban por 100 por precedencia de operadores en C# (`?? 0 * 100` evaluaba como `?? (0 * 100)` en lugar de `(?? 0) * 100`). Corregido extrayendo a variables temporales.

## 2026-05-17 Phase 4 (gap fix) — Agent & Skill Generation

### Cambios

- **Templates de configuración creados**:
  - `templates/config/opencode/agents/*.md` — 9 agentes completos con frontmatter YAML (description, mode, permission, skills.paths, model)
  - `templates/config/opencode/skills/*/SKILL.md` — 9 skills con keywords de dispatch
  - `templates/config/opencode/AGENTS.md` — dispatch matrix con 8 keyword-to-agent mappings
  - `templates/config/opencode/opencode.json` — config con registro de todos los agentes

- **vanilla-detector.mjs** actualizado:
  - `suggestSkills(vanillaInfo)` — retorna skills base (testing, documentation, prompt-optimization, terminal, customize-opencode) más skills específicas por framework
  - `suggestAgents(vanillaInfo)` — retorna los 9 agentes base más agentes adicionales por framework
  - Framework-to-skills mapping: React/Vue/Angular → frontend, Express/Fastify/NestJS → backend+database+containerization
  - Docker detection en dependencies → containerization skill
  - ORM/DB detection → database skill

- **injector.mjs** actualizado:
  - `plan()` ahora acepta `config` como componente en el array `components`
  - Cuando `config` está incluido, genera:
    - Agent .md files en `{{platformDir}}/agents/`
    - Skill SKILL.md files en `{{skillsDir}}/*/`
    - `AGENTS.md` en raíz del proyecto (o modifica si existe)
    - `opencode.json` en `{{platformDir}}/`

- **index.mjs** (init flow):
  - init ahora incluye `config` en los componentes por defecto
  - Vanilla init pregunta si configurar OpenCode (agentes + skills + dispatch matrix)
  - init --yes incluye config automáticamente

### Tests

- tools_dynamic: 116/116 tests pass (sin nuevos tests aún para agent/skill injection)
- v1: 144/144 tests pass, 9/9 metrics green, 3/3 workflows valid
- Prueba real en TestWarp: init --yes genera correctamente agents/ y skills/ completos

### Archivos creados

- `templates/config/opencode/agents/` — 9 agent .md files
- `templates/config/opencode/skills/` — 9 skill SKILL.md files
- `templates/config/opencode/AGENTS.md` — dispatch matrix
- `templates/config/opencode/opencode.json` — config

### Bug fixes — init no hacía nada en vanilla, sin selección de plataforma, doctor sin feedback

- **Bug 1**: `init --yes` saltaba inyección en proyectos vanilla porque tenía `if (results.length > 0)` bloqueando todo
  - Fix: inyecta siempre, con componentes por defecto (`config` + `testing` + `metrics` + `workflows` + `processes`)
- **Bug 2**: `init` interactivo no ofrecía `config` como componente (solo testing/metrics/workflows/processes)
  - Fix: agregado `config` como opción chequeada por defecto
- **Bug 3**: `inject` command no tenía flag `--config`
  - Fix: agregado `--config` + soporte para proyectos vanilla
- **Bug 4**: `doctor` no mostraba feedback en proyectos vanilla
  - Fix: cuando no hay plataforma, corre vanilla-detector y muestra lenguaje/framework/skills sugeridos

### Mejoras UX — Selección de plataforma en init

- Cuando `init` interactivo no detecta plataforma, ahora pregunta al usuario:
  - Checkbox con 4 plataformas: OpenCode, VS Code, Claude Code, Antigravity
  - OpenCode preseleccionado, usuario puede elegir una o varias
  - Se genera config para cada plataforma seleccionada
- `init --yes` acepta `--platform <name>` para especificar plataforma target
  - Valores: opencode, vscode, claude, antigravity
  - Default: opencode

### Archivos modificados

- `core/injector.mjs` — plan() ahora soporta `config` component con agent/skill/config generation;
  multi-platform config: itera sobre todas las plataformas detectadas para generar config
- `core/vanilla-detector.mjs` — nuevas funciones suggestSkills() y suggestAgents()
- `index.mjs` — init flow incluye config por defecto; plataforma seleccionable en vanilla;
  `--platform` flag para yes mode; doctor muestra vanilla info
- `commands/inject.mjs` — soporte `--config` y proyectos vanilla

### Archivos creados

- `templates/config/opencode/agents/` — 9 agent .md files
- `templates/config/opencode/skills/` — 9 skill SKILL.md files
- `templates/config/opencode/AGENTS.md` — dispatch matrix
- `templates/config/opencode/opencode.json` — config
