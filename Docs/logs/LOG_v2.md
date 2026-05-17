---
*Modelo: opencode/deepseek-v4-flash-free*

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
