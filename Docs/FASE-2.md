# Fase 2 — tools_dynamic: Portable Agent Orchestration System

**Fecha:** 2026-05-17
**Estado:** Phase 0 ✅ · Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4–5 Planificadas

## Visión General

v2.0 construye `tools_dynamic`, una CLI autónoma e interactiva que permite analizar cualquier proyecto, descubrir sus agentes y skills (sin importar la plataforma), y potenciarlo inyectando todas las herramientas de orquestación multi-agente desarrolladas en v1: testing automatizado, métricas de rendimiento, workflows con ejecución en background, y protocolo de handoff entre agentes.

### El Problema

v1 creó un ecosistema completo de agentes, skills, workflows y herramientas dentro de **este** proyecto. Pero ese ecosistema no es portable — cada proyecto nuevo tendría que reconstruir todo desde cero.

### La Solución

`tools_dynamic` actúa como un "puente" entre este proyecto y cualquier otro:

```
[Este proyecto] ─── tools_dynamic ───→ [Cualquier proyecto]
  ├── 9 agentes          │              ├── agentes descubiertos
  ├── 8 skills            │              ├── skills detectados
  ├── 3 workflows         │              ├── workflows inyectados
  ├── agent-testing       │              ├── agent-testing (adaptado)
  └── agent-metrics       │              └── agent-metrics (adaptado)
                      [CLI]
                analyze | report |
                inject | init | doctor
```

### Arquitectura General

```
tools_dynamic/
├── index.mjs                    ← Entry point CLI (commander)
├── commands/
│   ├── analyze.mjs              ← Descubrimiento de plataforma, agentes, skills
│   ├── report.mjs               ← Generación de reportes JSON/HTML
│   ├── inject.mjs               ← Inyección parcial de componentes
│   ├── init.mjs                 ← Bootstrap completo (analyze → inject)
│   ├── doctor.mjs               ← Diagnóstico de config existente
│   └── list-platforms.mjs       ← Lista plataformas detectables
├── core/
│   ├── scanner.mjs              ← Orquestador de scanners
│   ├── parser.mjs               ← Parseo unificado (frontmatter, JSON, YAML, markdown tables)
│   ├── workflow-generator.mjs   ← Generación adaptativa de workflows
│   ├── test-generator.mjs       ← Generación de casos de test
│   ├── injector.mjs             ← Copia + adaptación de templates
│   ├── differ.mjs               ← Diff preview antes de escribir
│   └── reporter.mjs             ← Output formateado (JSON/HTML/texto)
├── scanners/
│   ├── opencode-scanner.mjs     ← OpenCode detector
│   ├── vscode-scanner.mjs       ← VS Code / GitHub Copilot detector
│   ├── claude-scanner.mjs       ← Claude Code detector
│   └── antigravity-scanner.mjs  ← Antigravity detector
├── templates/                   ← Lo que se inyecta en el target
│   ├── tools/
│   │   ├── agent-testing/
│   │   ├── agent-metrics/
│   │   └── agent-workflows/
│   ├── processes/
│   │   ├── README.md
│   │   └── agentes/
│   └── config/
│       ├── opencode/
│       ├── vscode/
│       ├── claude/
│       └── antigravity/
├── output/                      ← Reportes generados
├── package.json
└── README.md
```

---

## Phase 0 ✅ — Orchestrator Synthesis Enhancement

### 0.1 Problema

✅ Resuelto. El Orchestrator ahora ejecuta `## Handoff Protocol` real:
- **Parallel Handoff Coordination**: recolecta resultados de múltiples agentes, detecta conflictos via `resolveConflicts()`
- **Distributing Handoffs**: mergea contexto en el synthesis handoff
- **Error Handling**: la síntesis fallida marca el run completo como `failed`
- Los 3 workflows están actualizados: `full-review-pipeline` usa synthesizer habilitado, `feature-pipeline` opcional, `docs-generation` no lo necesita

### 0.2 Solución

Añadir un **synthesis step opcional** al modelo de workflows. Cuando un workflow define un `synthesizer`, después de que todos los pasos regulares se completan, el run entra en estado `synthesis_pending` y espera que el Orchestrator (o el usuario) complete la síntesis recolectando todos los handoffs previos.

### 0.3 Workflow Schema — Nuevo campo `synthesizer`

```json
{
  "name": "full-review-pipeline",
  "version": "1.0",
  "description": "Review code for quality, security, performance with orchestrator synthesis",
  "synthesizer": {
    "agent": "orchestrator",
    "enabled": true,
    "prompt": "Synthesize the following review results into a unified report. Resolve conflicts between agents. Output: prioritized findings, auto-resolved items, escalated decisions.",
    "input_from": ["code_review", "security_review", "perf_review"],
    "steps": [
      { "id": "code_review", "agent": "code-reviewer", ... },
      { "id": "security_review", "agent": "security-reviewer", ... },
      { "id": "perf_review", "agent": "perf-engineer", ... }
    ]
  }
}
```

**Campos**:

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `agent` | string | Sí | Nombre del agente que hace la síntesis (normalmente `"orchestrator"`) |
| `enabled` | boolean | No | `true` por defecto. `false` para desactivar sin borrar la configuración |
| `prompt` | string | Sí | Instrucción que recibe el agente junto con los handoffs recolectados |
| `input_from` | string[] | No | Lista de `step_id` cuyos handoffs se pasan al synthesizer. Por defecto: todos los steps completados |

### 0.4 Modelo de Run — Nuevo estado `synthesis_pending`

```
submitted → running → synthesis_pending → completed
                           │
                           ├──synthesize──▶ completed
                           ├──skip────────▶ completed (synthesis skipped)
                           └──failed──────▶ failed
```

El run JSON se extiende con:

```javascript
{
  "id": "a1b2c3d4",
  "workflow": "full-review-pipeline",
  "status": "synthesis_pending",
  "plan": [ /* ... */ ],
  "synthesizer": {
    "agent": "orchestrator",
    "enabled": true,
    "prompt": "Synthesize the following review results...",
    "input_from": ["code_review", "security_review", "perf_review"],
    "status": "pending",     // "pending" | "completed" | "skipped"
    "completedAt": null,
    "handoff": null
  },
  "steps": [ /* all completed */ ],
  "handoffs": [ /* all step handoffs */ ],
  "submittedAt": "...",
  "completedAt": null
}
```

### 0.5 Executor — Cambios en `executor.mjs`

#### 0.5.1 `completeStep()` — Detectar fin de steps y activar síntesis

```javascript
function completeStep(runId, stepId) {
  const run = getRun(runId);
  // ... validación existente ...

  step.status = "completed";
  // ... handoff existente ...

  const allDone = run.steps.every(s => s.status === "completed");
  if (allDone) {
    if (run.synthesizer?.enabled) {
      run.status = "synthesis_pending";  // ← NUEVO: no completed aún
    } else {
      run.status = "completed";           // ← existente
      run.completedAt = new Date().toISOString();
    }
  }

  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return { runId, stepId, stepStatus: "completed", runStatus: run.status };
}
```

#### 0.5.2 Nuevo comando `--synthesize <run-id>`

```javascript
function synthesizeRun(runId) {
  const run = getRun(runId);
  if (!run) return { error: `Run "${runId}" not found` };
  if (run.status !== "synthesis_pending") {
    return { error: `Run is "${run.status}", not synthesis_pending` };
  }

  // 1. Recolectar handoffs de los steps indicados en input_from
  const inputSteps = run.synthesizer.input_from?.length > 0
    ? run.synthesizer.input_from
    : run.steps.map(s => s.step_id);

  const inputHandoffs = inputSteps
    .map(id => run.handoffs.find(h => h.from_step === id))
    .filter(Boolean);

  // 2. Construir contexto de síntesis
  const synthesisHandoff = {
    from_step: "__synthesis__",
    from_agent: run.synthesizer.agent,
    status: "completed",
    context: {
      received_from: inputHandoffs.map(h => ({
        from: h.from_step,
        output: h.context.output_summary,
        risks: h.context.risks || [],
        decisions: h.context.decisions || [],
        artifacts: h.context.artifacts || [],
      })),
      output_summary: getSynthesisOutput(run, inputHandoffs),
      artifacts: inputHandoffs.flatMap(h => h.context.artifacts || []),
      risks: resolveConflicts(inputHandoffs),
      decisions: inputHandoffs.flatMap(h => h.context.decisions || []),
    },
    timestamp: new Date().toISOString(),
  };

  // 3. Almacenar
  run.synthesizer.status = "completed";
  run.synthesizer.handoff = synthesisHandoff;
  run.synthesizer.completedAt = new Date().toISOString();
  run.handoffs.push(synthesisHandoff);
  run.status = "completed";
  run.completedAt = new Date().toISOString();

  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return { runId, status: "completed" };
}
```

#### 0.5.3 `--synthesize --skip <run-id>` — Omitir síntesis

```javascript
function skipSynthesis(runId) {
  const run = getRun(runId);
  if (!run) return { error: `Run "${runId}" not found` };
  if (run.status !== "synthesis_pending") {
    return { error: `Run is "${run.status}", not synthesis_pending` };
  }
  run.synthesizer.status = "skipped";
  run.synthesizer.completedAt = new Date().toISOString();
  run.status = "completed";
  run.completedAt = new Date().toISOString();
  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return { runId, status: "completed", synthesis: "skipped" };
}
```

#### 0.5.4 Resolución de Conflictos (`resolveConflicts`)

```javascript
function resolveConflicts(handoffs) {
  // Extraer todos los riesgos de todos los handoffs
  const all = handoffs.flatMap(h => (h.context.risks || []).map(r => ({
    ...r,
    from: h.from_step
  })));

  const conflicts = [];
  const seen = new Map();

  // Detectar riesgos que apuntan al mismo tema
  for (const risk of all) {
    const key = risk.description.toLowerCase().slice(0, 40);
    if (seen.has(key)) {
      const prev = seen.get(key);
      if (prev.severity !== risk.severity) {
        conflicts.push({
          between: [prev.from, risk.from],
          description: risk.description,
          severities: [prev.severity, risk.severity],
          resolution: "auto",
          resolved_severity: risk.severity > prev.severity ? risk.severity : prev.severity
        });
      }
    } else {
      seen.set(key, risk);
    }
  }

  return {
    all: all,
    unique: [...seen.values()],
    conflicts: conflicts,
    summary: `Found ${seen.size} unique risks, ${conflicts.length} conflicts auto-resolved`
  };
}
```

#### 0.5.5 `--simulate` — Síntesis automática al final

El simulate actual itera sobre `run.plan`. Si al final hay synthesizer definido, lo ejecuta automáticamente:

```javascript
// Dentro de --simulate, después del loop de steps:
const allDone = run.steps.every(s => s.status === "completed");
if (allDone) {
  if (run.synthesizer?.enabled) {
    run.status = "synthesis_pending";
    writeJSON(join(RUNS_DIR, `${runId}.json`), run);
    console.log("\n  🔄 Synthesis pending — run --synthesize to complete");
    // O auto-completar:
    const synthResult = synthesizeRun(runId);
    console.log("  🧠 [orchestrator] synthesis");
    console.log(`     ✓ ${run.synthesizer.handoff.context.output_summary}`);
  } else {
    run.status = "completed";
    run.completedAt = new Date().toISOString();
    run.currentStep = run.totalSteps;
    console.log("\n  ✅ Workflow completed");
  }
}
```

#### 0.5.6 `--handoff` — Mostrar síntesis en la cadena

```javascript
function printHandoffChain(run) {
  // ... existente ...

  // Si hay síntesis completada, mostrarla al final
  if (run.synthesizer?.handoff) {
    const h = run.synthesizer.handoff;
    console.log(`  ◆ ✓ [${h.from_agent}] synthesis`);
    console.log(`     📋 ${h.context.output_summary}`);
    if (h.context.risks?.conflicts?.length > 0) {
      for (const c of h.context.risks.conflicts) {
        console.log(`     ⚡ Conflict: ${c.description} (${c.between.join(" vs ")}) → ${c.resolved_severity}`);
      }
    }
    console.log();
  }
}
```

#### 0.5.7 `printRun()` — Mostrar estado synthesis_pending

```javascript
function printRun(run) {
  // ... existente ...
  if (run.synthesizer) {
    const syn = run.synthesizer;
    const icon = syn.status === "completed" ? "✓" : syn.status === "skipped" ? "–" : "○";
    console.log(`  Synthesis:  ${icon} [${syn.agent}] (${syn.status})`);
  }
}
```

### 0.6 Workflows Actualizados

#### full-review-pipeline (síntesis por Orchestrator)

```json
{
  "name": "full-review-pipeline",
  "version": "2.0",
  "description": "Review code for quality, security, performance with orchestrator synthesis",
  "trigger_keywords": ["full review", "complete analysis", "audit codebase"],
  "synthesizer": {
    "agent": "orchestrator",
    "enabled": true,
    "prompt": "Synthesize the review findings from code-reviewer, security-reviewer, and perf-engineer into a unified report. Resolve any conflicting recommendations. Output: prioritized action items, auto-resolved conflicts, escalated decisions.",
    "input_from": ["code_review", "security_review", "perf_review"]
  },
  "steps": [
    {
      "id": "code_review",
      "agent": "code-reviewer",
      "prompt": "Review the following code for correctness, design, and maintainability. Output structured findings.",
      "output_key": "code_review",
      "depends_on": []
    },
    {
      "id": "security_review",
      "agent": "security-reviewer",
      "prompt": "Review the same code for vulnerabilities, OWASP Top 10 risks, and auth issues.",
      "output_key": "security_review",
      "depends_on": []
    },
    {
      "id": "perf_review",
      "agent": "perf-engineer",
      "prompt": "Review the code for performance bottlenecks, N+1 queries, caching opportunities, and bundle size issues.",
      "output_key": "perf_review",
      "depends_on": []
    }
  ]
}
```

#### feature-pipeline (síntesis opcional por Orchestrator)

```json
{
  "name": "feature-pipeline",
  "version": "2.0",
  "description": "Implement a full feature across all layers with optional orchestrator synthesis",
  "trigger_keywords": ["new feature", "full implementation", "end-to-end feature"],
  "synthesizer": {
    "agent": "orchestrator",
    "enabled": false,
    "prompt": "Synthesize the test results and documentation into a feature completion report. Verify test coverage meets requirements.",
    "input_from": ["test_code", "docs"]
  },
  "steps": [ /* ... steps existentes ... */ ]
}
```

#### docs-generation (sin síntesis — no la necesita)

```json
{
  "name": "docs-generation",
  "version": "2.0",
  "description": "Analyze code and generate comprehensive documentation",
  "trigger_keywords": ["generate docs", "document code", "auto-document"]
  // Sin synthesizer — doc-agent ya produce toda la documentación directamente
}
```

### 0.7 Integración con tools_dynamic (workflow-generator)

El `workflow-generator.mjs` en tools_dynamic debe ofrecer la opción de síntesis por Orchestrator:

```javascript
class WorkflowGenerator {
  generate(scanResult, options = {}) {
    const { orchestratorSynthesis } = options;
    // ... generar workflows ...

    // Si orchestratorSynthesis es true y hay agentes múltiples que convergen
    if (orchestratorSynthesis && scanResult.agents.some(a => a.mode === 'primary')) {
      if (roles.reviewers.length >= 2) {
        const wf = this.buildReviewPipeline(roles, scanResult);
        wf.synthesizer = {
          agent: "orchestrator",
          enabled: true,
          prompt: "Synthesize review findings into a unified report...",
          input_from: wf.steps.filter(s => roles.reviewers.some(r => r.name === s.agent)).map(s => s.id)
        };
        workflows.push(wf);
      }
    }
    return workflows;
  }
}
```

### 0.8 Templates Actualizados

Los templates de workflow en `templates/tools/agent-workflows/definitions/` deben incluir el campo `synthesizer` como opcional:

```json
{
  "name": "{{workflowName}}",
  "version": "1.0",
  "description": "{{description}}",
  "trigger_keywords": {{keywords}},
  {{#if orchestratorSynthesis}}
  "synthesizer": {
    "agent": "orchestrator",
    "enabled": true,
    "prompt": "{{synthesisPrompt}}",
    "input_from": {{inputFromSteps}}
  },
  {{/if}}
  "steps": {{steps}}
}
```

### 0.9 Tests

- Test: workflow sin synthesizer → completeStep marca `completed` directamente
- Test: workflow con synthesizer enabled → completeStep marca `synthesis_pending`
- Test: `--synthesize` con run en synthesis_pending → pasa a `completed` con handoff de síntesis
- Test: `--synthesize` con run en otro estado → error
- Test: `--synthesize --skip` → pasa a `completed` con synthesizer.status = "skipped"
- Test: `resolveConflicts()` detecta conflictos de severidad entre handoffs
- Test: `--simulate` con synthesizer → auto-completa síntesis
- Test: `--handoff` muestra síntesis como paso final

---

## Phase 1 🏗️ — Platform Adaptation & Scanner

### 1.1 Interfaz Unificada `PlatformScanner`

Define el contrato que todos los scanners deben implementar:

```javascript
/**
 * @typedef {Object} PlatformScanResult
 * @property {string} platform            - opencode | vscode | claude | antigravity
 * @property {string} platformVersion     - Versión detectada de la plataforma (si aplica)
 * @property {boolean} detected           - true si la plataforma fue detectada
 * @property {Object} nativeCapabilities
 * @property {boolean} nativeCapabilities.subagents       - Soporte nativo de subagentes
 * @property {boolean} nativeCapabilities.agentTeams      - Soporte nativo de Agent Teams
 * @property {boolean} nativeCapabilities.parallelExecution
 * @property {boolean} nativeCapabilities.hooks           - Sistema de hooks/settings
 * @property {boolean} nativeCapabilities.mcp             - Model Context Protocol
 * @property {boolean} nativeCapabilities.customTools     - Herramientas personalizadas
 * @property {AgentDef[]} agents
 * @property {SkillDef[]} skills
 * @property {WorkflowDef[]} workflows
 * @property {string[]} existingTools
 * @property {string[]} configPaths
 * @property {Object} platformMeta         - Metadatos específicos de plataforma
 */

/**
 * @typedef {Object} AgentDef
 * @property {string} name          - Nombre del agente
 * @property {string} role          - Rol/descripción corta
 * @property {string[]} keywords    - TRIGGER KEYWORDS
 * @property {string} mode          - primary | subagent
 * @property {string} filePath      - Ruta al archivo de definición
 * @property {Object} permissions   - edit, bash (allow | deny)
 * @property {string[]} sections    - Secciones encontradas en el prompt
 * @property {boolean} hasHandoff   - Tiene sección Handoff Protocol
 */

/**
 * @typedef {Object} SkillDef
 * @property {string} name          - Nombre del skill
 * @property {string[]} keywords    - TRIGGER KEYWORDS
 * @property {string} filePath      - Ruta al archivo SKILL.md
 * @property {string[]} references  - Archivos en references/
 * @property {boolean} crossPlatformSynced - Sincronizado entre plataformas
 */

/**
 * @typedef {Object} WorkflowDef
 * @property {string} name          - Nombre del workflow
 * @property {number} steps         - Cantidad de pasos
 * @property {string[]} agents      - Agentes involucrados
 * @property {string} filePath      - Ruta al archivo de definición
 */

/**
 * Interfaz que todo scanner debe implementar
 */
class PlatformScanner {
  static platformName = 'opencode'; // o vscode, claude, antigravity

  /**
   * @param {string} basePath - Ruta absoluta al proyecto a escanear
   * @returns {boolean} - true si esta plataforma está presente
   */
  detect(basePath) { /* ... */ }

  /**
   * @param {string} basePath
   * @returns {PlatformScanResult}
   */
  scan(basePath) { /* ... */ }
}
```

### 1.2 Scanner OpenCode

**Propósito**: Detectar proyectos que usan OpenCode como plataforma de agentes.

**Indicadores de detección**:
| Archivo | Ubicación | Prioridad |
|---|---|---|
| `opencode.json` | `<root>/.opencode/opencode.json` | Alta |
| `AGENTS.md` | `<root>/AGENTS.md` | Alta |
| `orchestrator.md` | `<root>/.opencode/agents/orchestrator.md` | Media |

**Proceso de escaneo**:
1. Verificar existencia de `.opencode/` directory
2. Parsear `opencode.json` para extraer agent registry y permisos
3. Parsear `AGENTS.md` para extraer dispatch matrix (keywords ↔ agentes)
4. Escanear `.opencode/agents/*.md` para definiciones completas de agentes
5. Escanear `.opencode/skills/*/SKILL.md` para skills
6. Detectar `tools/agent-testing/`, `tools/agent-metrics/`, `tools/agent-workflows/` existentes
7. Detectar workflows JSON en `tools/agent-workflows/definitions/`

**Algoritmo de parseo de `AGENTS.md`**:
```javascript
// Extraer dispatch matrix de una tabla markdown
function parseDispatchMatrix(markdown) {
  // Buscar sección "## Keyword-to-Agent Dispatch Matrix"
  // Extraer tabla: | Trigger Keywords | Secondary Agent | Dispatch Mode |
  // Para cada fila, extraer keywords (split por coma) y mapear al agent name
  // Retornar Map<keyword, agentName>
}
```

**Estructura de `nativeCapabilities` para OpenCode**:
```javascript
{
  subagents: false,          // No tiene subagentes nativos
  agentTeams: false,         // No tiene Agent Teams
  parallelExecution: false,  // No nativo (requiere plugin)
  hooks: false,              // No tiene sistema de hooks
  mcp: false,                // No soporta MCP nativamente
  customTools: true          // Custom executor.mjs
}
```

### 1.3 Scanner VS Code / GitHub Copilot

**Propósito**: Detectar proyectos que usan VS Code / GitHub Copilot con agentes y skills.

**Indicadores de detección**:
| Archivo | Ubicación | Prioridad |
|---|---|---|
| `copilot-instructions.md` | `<root>/.github/copilot-instructions.md` | Alta |
| Directorio `agents/` | `<root>/.github/agents/` | Alta |
| Directorio `skills/` | `<root>/.github/skills/` | Alta |

**Proceso de escaneo**:
1. Verificar existencia de `.github/` directory
2. Detectar `copilot-instructions.md` y parsear secciones
3. Escanear `.github/agents/*.md` para definiciones
4. Escanear `.github/skills/*/SKILL.md` para skills
5. Verificar sincronización cross-platform con `.opencode/`

**Estructura de `nativeCapabilities` para VS Code**:
```javascript
{
  subagents: false,
  agentTeams: false,
  parallelExecution: false,
  hooks: false,
  mcp: false,
  customTools: false
}
```

### 1.4 Scanner Claude Code

**Propósito**: Detectar proyectos que usan Claude Code (Anthropic) como plataforma de agentes.

**Indicadores de detección**:
| Archivo | Ubicación | Prioridad |
|---|---|---|
| `CLAUDE.md` | `<root>/CLAUDE.md` o `<root>/.claude/CLAUDE.md` | Alta |
| `settings.json` | `<root>/.claude/settings.json` | Alta |
| Directorio `skills/` | `<root>/.claude/skills/` | Alta |
| Directorio `agents/` | `<root>/.claude/agents/` | Media |
| Directorio `rules/` | `<root>/.claude/rules/` | Media |
| `mcp.json` | `<root>/.claude/mcp.json` | Baja |
| Directorio `hooks/` | `<root>/.claude/hooks/` | Baja |

**Proceso de escaneo**:
1. Verificar existencia de `CLAUDE.md` (raíz o `.claude/`)
2. Detectar `.claude/` directory
3. Parsear `settings.json` para extraer hooks, permisos, config
4. Escanear `.claude/skills/*/SKILL.md` para skills
5. Escanear `.claude/agents/*.md` para agentes custom
6. Escanear `.claude/rules/*.md` para reglas cargadas en sesión
7. Detectar `mcp.json` para MCP servers configurados
8. Detectar `CLAUDE.local.md` para overrides locales
9. Detectar `~/.claude/` (user-level) para config global

**Estructura de `nativeCapabilities` para Claude Code**:
```javascript
{
  subagents: true,           // Soporta subagentes nativos
  agentTeams: true,          // Soporta Agent Teams (CLI)
  parallelExecution: true,   // Agent Teams maneja paralelismo
  hooks: true,               // settings.json + hooks/ directory
  mcp: true,                 // mcp.json para MCP servers
  customTools: true          // Puede ejecutar scripts custom
}
```

**Parsing de CLAUDE.md**: Similar a `AGENTS.md` pero más libre. Extraer secciones por headings (##) y detectar patrones como:
- `## Tools` → herramientas disponibles
- `## Guidelines` / `## Rules` → reglas de comportamiento
- `## Skills` → skills habilitados
- Definiciones de comandos slash personalizados

**Parsing de settings.json**:
```javascript
{
  "permissions": { /* tool permissions */ },
  "hooks": { /* PreToolUse, PostToolUse, etc. */ },
  "autoMemoryEnabled": boolean,
  "skills": /* "all" | ["skill1", "skill2"] */,
  "models": { /* model overrides */ }
}
```

### 1.5 Scanner Antigravity

**Propósito**: Detectar proyectos que usan Antigravity como plataforma.

**Indicadores de detección**:
| Archivo | Ubicación | Prioridad |
|---|---|---|
| `antigravity.yaml` | `<root>/antigravity.yaml` | Alta |
| `antigravity.json` | `<root>/antigravity.json` | Alta |

**Proceso de escaneo**:
1. Verificar existencia de `antigravity.yaml` o `antigravity.json`
2. Parsear archivo de configuración
3. Extraer agentes, skills, y configuraciones definidas
4. Mapear a estructura `PlatformScanResult`

**Nota**: Antigravity tiene una estructura menos estandarizada. El scanner debe ser flexible y capturar tanto como sea posible, marcando campos desconocidos en `platformMeta`.

### 1.6 Orquestador de Scanners (`scanner.mjs`)

```javascript
class Scanner {
  constructor() {
    this.scanners = [
      new OpenCodeScanner(),
      new VSCodeScanner(),
      new ClaudeScanner(),
      new AntigravityScanner()
    ];
  }

  /**
   * Escanea un proyecto con todos los scanners registrados.
   * @param {string} basePath
   * @returns {PlatformScanResult[]} - Resultados por plataforma detectada
   */
  scan(basePath) {
    const results = [];
    for (const scanner of this.scanners) {
      if (scanner.detect(basePath)) {
        results.push(scanner.scan(basePath));
      }
    }
    return results;
  }

  /**
   * Escanea y retorna solo la primera plataforma detectada (prioridad: opencode > vscode > claude > antigravity)
   * @param {string} basePath
   * @returns {PlatformScanResult|null}
   */
  scanPrimary(basePath) {
    const priority = ['opencode', 'vscode', 'claude', 'antigravity'];
    const all = this.scan(basePath);
    for (const name of priority) {
      const found = all.find(r => r.platform === name && r.detected);
      if (found) return found;
    }
    return null;
  }

  /**
   * Escanea y retorna TODAS las plataformas detectadas (un proyecto puede tener múltiples)
   * @param {string} basePath
   * @returns {PlatformScanResult[]}
   */
  scanAll(basePath) {
    return this.scan(basePath).filter(r => r.detected);
  }
}
```

### 1.7 Tests de Scanners

Cada scanner debe tener tests unitarios con fixtures de proyecto mock:

```
tests/
├── fixtures/
│   ├── opencode-project/
│   │   ├── .opencode/
│   │   │   ├── opencode.json
│   │   │   ├── agents/
│   │   │   └── skills/
│   │   └── AGENTS.md
│   ├── vscode-project/
│   │   └── .github/
│   │       ├── copilot-instructions.md
│   │       ├── agents/
│   │       └── skills/
│   ├── claude-project/
│   │   ├── CLAUDE.md
│   │   └── .claude/
│   │       ├── settings.json
│   │       ├── skills/
│   │       ├── agents/
│   │       ├── rules/
│   │       └── mcp.json
│   ├── antigravity-project/
│   │   └── antigravity.yaml
│   └── vanilla-project/       ← Sin agentes (debe retornar array vacío)
│       └── package.json
├── opencode-scanner.test.mjs
├── vscode-scanner.test.mjs
├── claude-scanner.test.mjs
├── antigravity-scanner.test.mjs
└── scanner.test.mjs           ← Tests del orquestador
```

**Casos de prueba clave**:
1. Detección positiva: proyecto con estructura completa
2. Detección parcial: proyecto con solo algunos archivos
3. Detección negativa: proyecto vanilla sin agentes
4. Múltiples plataformas: proyecto con OpenCode + Claude Code
5. nativeCapabilities: verificar que cada plataforma reporta capacidades correctas
6. Parseo de frontmatter inválido: manejo graceful de errores

---

## Phase 2 ⚙️ — Core Engine

### 2.1 CLI Framework

**Tecnología**: `commander` (npm: `commander`)

**Estructura de comandos**:

```
tools_dynamic <command> [options] <path>

Commands:
  analyze [path]      Discover platform, agents, and skills
  report [path]       Generate diagnostic report (JSON/HTML)
  inject [path]       Inject selected tools into project
  init [path]         Full interactive bootstrap
  doctor [path]       Diagnose existing configuration
  list-platforms      List detectable platforms and their indicators

Options:
  -h, --help          Display help
  -V, --version       Display version
  --json              Output in JSON format (for analyze/report)
  --dry-run           Show diff without writing (for inject/init)
  --yes               Non-interactive mode (use defaults)
  --verbose           Detailed logging
  --output-dir <dir>  Output directory for reports (default: ./output)
```

**Flujo de `init` (experiencia interactiva)**:

```
$ npx @opencode/tools-dynamic init ./mi-proyecto

🔍 Escaneando mi-proyecto...
  ✅ OpenCode detected (.opencode/ + AGENTS.md)
  ℹ️  VS Code: no detectado
  ✅ Claude Code detected (CLAUDE.md + .claude/)
  ℹ️  Antigravity: no detectado

📋 Agentes encontrados: 5
  - database-specialist, test-engineer, code-reviewer, doc-agent, ui-specialist

📦 Skills encontrados: 4
  - database, testing, documentation, frontend

🔧 Herramientas existentes: testing (parcial), metrics (no), workflows (no)

⚡ Workflows sugeridos:
  [1] feature-pipeline: database → ui → test + docs (4 pasos)
  [2] review-pipeline: code-review + doc-agent (3 pasos)

¿Qué deseas hacer?
❯ [1] Generar reporte detallado (sin modificar)
  [2] Inyectar tools recomendadas
  [3] Inyección personalizada (elige qué componentes)
  [4] Salir

> 2

Se inyectarán los siguientes componentes:
  📦 tools/agent-testing/       (8 cases generados)
  📦 tools/agent-metrics/       (config adaptada)
  📦 tools/agent-workflows/     (2 workflows generados)
  📦 Docs/processes/            (documentación en español)

Archivos existentes que serán modificados:
  📝 AGENTS.md                  (se añadirán 2 entradas en dispatch matrix)
  📝 .opencode/opencode.json    (se añadirán agentes faltantes)

¿Continuar? (Y/n) > Y

✅ Inyección completada en 3.2s
📊 Reporte guardado en: ./output/report-2026-05-17.json
```

### 2.2 Parser Unificado (`parser.mjs`)

```javascript
class Parser {
  /**
   * Parsea frontmatter YAML de archivos .md (skills, agentes)
   * Soporta: strings, arrays, objetos anidados, folded blocks (>)
   * @param {string} content - Contenido del archivo
   * @returns {Object} - Frontmatter parseado + body (resto del contenido)
   */
  static parseFrontmatter(content) { /* usa gray-matter */ }

  /**
   * Parsea una tabla markdown a array de objetos
   * @param {string} markdown - Contenido markdown
   * @param {string} tableIdentifier - Texto cerca de la tabla (ej: "| Trigger Keywords |")
   * @returns {Object[]} - Filas de la tabla como objetos
   */
  static parseMarkdownTable(markdown, tableIdentifier) { /* ... */ }

  /**
   * Parsea dispatch matrix de AGENTS.md
   * @param {string} content - Contenido de AGENTS.md
   * @returns {Map<string, string>} - keyword → agentName
   */
  static parseDispatchMatrix(content) { /* ... */ }

  /**
   * Detecta plataforma de un archivo por su estructura
   * @param {string} filePath
   * @returns {string} - opencode | vscode | claude | antigravity | unknown
   */
  static detectPlatformFromPath(filePath) { /* ... */ }
}
```

### 2.3 Generador de Workflows (`workflow-generator.mjs`)

Algoritmo de generación adaptativa:

```javascript
class WorkflowGenerator {
  /**
   * Genera definiciones de workflow basadas en agentes descubiertos.
   * Usa nativeCapabilities para decidir el formato de salida.
   *
   * @param {PlatformScanResult} scanResult
   * @returns {GeneratedWorkflow[]}
   */
  generate(scanResult) {
    const { agents, nativeCapabilities } = scanResult;

    // 1. Clasificar agentes por rol
    const roles = this.classifyAgents(agents);
    // → { reviewers: [], builders: [], writers: [], testers: [] }

    // 2. Generar workflows según patrones predefinidos
    const workflows = [];

    if (roles.reviewers.length >= 1 && roles.writers.length >= 1) {
      workflows.push(this.buildReviewPipeline(roles, scanResult));
    }

    if (roles.builders.length >= 2 && roles.testers.length >= 1) {
      workflows.push(this.buildFeaturePipeline(roles, scanResult));
    }

    if (roles.writers.length >= 1 && roles.builders.length >= 1) {
      workflows.push(this.buildDocsGeneration(roles, scanResult));
    }

    // 3. Adaptar formato según capacidades nativas
    if (nativeCapabilities.agentTeams) {
      return this.toAgentTeamsFormat(workflows);
    }

    return this.toExecutorJSONFormat(workflows);
  }

  /**
   * Clasifica agentes por su rol basado en keywords y nombre
   */
  classifyAgents(agents) {
    const roles = { reviewers: [], builders: [], writers: [], testers: [] };

    for (const agent of agents) {
      const kw = agent.keywords.join(' ').toLowerCase();

      if (kw.match(/review|security|quality|audit|perf|performance/))
        roles.reviewers.push(agent);
      else if (kw.match(/database|schema|api|backend|server|devops|ui|frontend|component/))
        roles.builders.push(agent);
      else if (kw.match(/doc|readme|changelog|apidoc|migration/))
        roles.writers.push(agent);
      else if (kw.match(/test|spec|coverage|unittest|jest|pytest/))
        roles.testers.push(agent);
      else
        roles.builders.push(agent); // default: builder
    }

    return roles;
  }

  /**
   * Genera workflow de revisión para plataforma que soporta paralelismo nativo
   */
  toAgentTeamsFormat(workflows) {
    // Para Claude Code: generar Team config con agentes en paralelo
    // y un agente coordinador que sintetiza resultados
  }

  /**
   * Genera workflow JSON compatible con executor.mjs de v1
   */
  toExecutorJSONFormat(workflows) {
    // Para OpenCode/VS Code: generar JSON con steps, depends_on, output_key
  }
}
```

**Patrones de workflow generables**:

| Patrón | Agentes Requeridos | Estructura |
|---|---|---|
| **review-pipeline** | 1 reviewer + 1 writer | reviewer(parallel) → writer |
| **feature-pipeline** | 1 builder + 1 ui + 1 tester + 1 writer | builder → ui → tester + writer |
| **docs-generation** | 1 builder + 1 writer | builder → writer(parallel x N) |
| **full-review** | 2+ reviewers + 1 writer | reviewers(parallel) → writer |
| **test-pipeline** | 1 builder + 1 tester | builder → tester |

### 2.4 Generador de Tests (`test-generator.mjs`)

Genera casos de test para `tools/agent-testing/cases/` adaptados a los agentes descubiertos.

```javascript
class TestGenerator {
  /**
   * @param {AgentDef[]} agents
   * @returns {TestCase[]} - Array de casos de test listos para escribir
   */
  generate(agents) {
    return agents.map(agent => ({
      name: agent.name,
      keywords: agent.keywords,
      expectedKeywords: Math.max(10, agent.keywords.length),
      sectionsRequired: [
        'Core Responsibilities',
        'Behavior Rules',
        'Response Format',
        'Constraints',
        'Handoff Protocol'
      ],
      modeExpected: agent.mode,
      permissionsExpected: agent.permissions
    }));
  }
}
```

### 2.5 Sistema de Diff (`differ.mjs`)

Muestra preview de cambios antes de cualquier modificación:

```javascript
class Differ {
  /**
   * Genera diff entre el estado actual y el propuesto
   * @param {string} basePath
   * @param {InjectionPlan} plan
   * @returns {DiffReport}
   */
  diff(basePath, plan) {
    // Para cada archivo a crear: mostrar "NEW <path>"
    // Para cada archivo a modificar: mostrar diff unificado
    // Para cada directorio a crear: mostrar "+ <dir>/"
  }

  /**
   * Imprime el diff en consola con colores
   * @param {DiffReport} diff
   */
  print(diff) {
    // Verde para archivos nuevos
    // Amarillo para archivos modificados (con +/- líneas)
    // Cian para directorios nuevos
  }
}
```

### 2.6 Sistema de Templates

Los templates son archivos que serán copiados al proyecto target. Usan variables de sustitución para adaptación:

```
templates/tools/agent-testing/cases/<agentName>.json.hbs
→ {{agentName}}, {{keywords}}, {{sectionsRequired}}, {{mode}}, {{permissions}}

templates/tools/agent-workflows/definitions/<workflowName>.json.hbs
→ {{workflowName}}, {{steps}}, {{agents}}

templates/processes/README.md
→ (catálogo general, mismo formato que v1)
```

El sistema de templates debe:
1. Cargar archivos `.hbs` (Handlebars) o usar string replacement simple
2. Reemplazar variables con datos del `PlatformScanResult`
3. Generar nombres de archivo adaptados (ej: `database-specialist.json` → database-specialist.json)
4. Soporte para templates opcionales (solo incluir si aplican)

---

## Phase 3 🔬 — Analysis & Report

### 3.1 Comando `analyze`

**Flujo de ejecución**:

```
analyze(path)
  │
  ├─ 1. Scanner.scanAll(path) → PlatformScanResult[]
  │
  ├─ 2. Para cada plataforma detectada:
  │     ├─ Mostrar header con nombre y versión
  │     ├─ Listar agentes (con keywords, modo, permisos)
  │     ├─ Listar skills (con keywords, sync status)
  │     ├─ Listar workflows existentes
  │     ├─ Listar tools existentes
  │     └─ Mostrar capacidades nativas
  │
  ├─ 3. Si no hay plataforma detectada:
  │     ├─ Mostrar mensaje "No agent platform detected"
  │     ├─ Ejecutar vanilla detector (package.json, lenguaje, framework)
  │     └─ Sugerir plataforma base
  │
  └─ 4. Generar resumen:
        ├─ Total plataformas, agentes, skills
        ├─ Recomendaciones iniciales
        └─ Sugerir next steps (report, inject, init)
```

### 3.2 Comando `report`

**Formato JSON de salida**:

```json
{
  "timestamp": "2026-05-17T12:00:00Z",
  "projectPath": "/ruta/al/proyecto",
  "platforms": [
    {
      "platform": "opencode",
      "detected": true,
      "health": "green",
      "agents": {
        "total": 5,
        "list": [ /* AgentDef[] */ ],
        "recommendations": [
          "Add more TRIGGER KEYWORDS (currently 8, target ≥ 10)",
          "Missing Handoff Protocol section in doc-agent"
        ]
      },
      "skills": {
        "total": 4,
        "list": [ /* SkillDef[] */ ],
        "synced": 3,
        "recommendations": [
          "frontend skill not synced to .github/",
          "No references/ directory in containerization skill"
        ]
      },
      "workflows": {
        "total": 0,
        "suggested": [
          {
            "name": "feature-pipeline",
            "steps": 4,
            "agents": ["database-specialist", "ui-specialist", "test-engineer", "doc-agent"]
          }
        ]
      },
      "tools": {
        "testing": false,
        "metrics": false,
        "workflows": false
      }
    }
  ],
  "summary": {
    "totalPlatforms": 1,
    "totalAgents": 5,
    "totalSkills": 4,
    "totalWorkflows": 0,
    "overallHealth": "yellow",
    "blockers": 0,
    "warnings": 2,
    "suggestions": 3
  }
}
```

**Formato HTML**: Similar al JSON pero renderizado como página web con:
- Semáforo visual por plataforma (🟢🟡🔴)
- Tablas expandibles para agentes, skills, workflows
- Sección de recomendaciones priorizadas
- Botón para exportar a JSON

### 3.3 Comando `doctor`

Diagnostica problemas en la configuración existente de agentes y sugiere correcciones:

| Problema Detectable | Severidad | Sugerencia |
|---|---|---|
| Agente sin sección Handoff Protocol | 🟡 Warning | Añadir sección Handoff Protocol estandarizada |
| Keywords < 10 en agente | 🟡 Warning | Expandir lista de TRIGGER KEYWORDS |
| Agente read-only sin `edit: deny` | 🔴 Bloqueante | Corregir permisos en frontmatter |
| Skill sin references/ | 🟢 Info | Añadir directorio references/ con ejemplos |
| Workflow con dependencia circular | 🔴 Bloqueante | Revisar depends_on en definiciones |
| Cross-platform sync missing | 🟡 Warning | Sincronizar skills entre `.opencode/` y `.github/` |
| Frontmatter inválido | 🔴 Bloqueante | Corregir sintaxis YAML del frontmatter |
| Agente definido pero no referenciado en dispatch matrix | 🟡 Warning | Añadir entrada en AGENTS.md |
| Dispatch matrix refiere agente inexistente | 🔴 Bloqueante | Crear definición del agente o corregir matrix |
| Tools desactualizadas vs v1 template | 🟢 Info | Actualizar tools desde template |

### 3.4 Modo Interactivo

**Librería**: `inquirer` (npm: `inquirer`) o `enquirer` para prompts interactivos.

**Patrones de interacción**:
1. **Checkbox**: selección múltiple de componentes a inyectar
2. **List**: opción única (tipo de reporte, plataforma target)
3. **Confirm**: sí/no para acciones destructivas
4. **Input**: entrada libre (path personalizado, nombre de workflow)
5. **Progress bar**: durante escaneo e inyección

**UX Requirements**:
- Spinner durante operaciones largas (escaneo, generación)
- Colores: verde (éxito), amarillo (warning), rojo (error), cian (info)
- Output estructurado con iconos (✅, ℹ️, ⚡, 📦, 📝, 📊)
- Tabulación anidada para jerarquías (plataforma → agentes → skills)

---

## Phase 4 💉 — Injection & Bootstrap

### 4.1 Templates Base

**Estructura de `templates/tools/agent-testing/`**:

```
templates/tools/agent-testing/
├── run.mjs                    ← Test runner (idéntico al de v1, referencias adaptables)
├── cases/
│   └── {{agentName}}.json     ← Template por agente descubierto
└── README.md                  ← Documentación técnica
```

**Estructura de `templates/tools/agent-metrics/`**:

```
templates/tools/agent-metrics/
├── report.mjs                 ← Metrics reporter (usa scanner de v2 para detectar agentes)
└── README.md
```

**Estructura de `templates/tools/agent-workflows/`**:

```
templates/tools/agent-workflows/
├── definitions/
│   └── {{workflowName}}.json  ← Workflows generados por workflow-generator
├── executor.mjs               ← Background executor (idéntico al de v1)
├── run.mjs                    ← Workflow runner (idéntico al de v1)
├── runs/                      ← Estado de ejecuciones (inicialmente vacío)
│   └── .gitkeep
└── README.md
```

**Estructura de `templates/processes/`**:

```
templates/processes/
├── README.md                  ← Catálogo de procesos (adaptado)
└── agentes/
    ├── multi-agent-workflows.md    ← Copia adaptada de v1
    ├── background-execution.md     ← Copia adaptada de v1
    ├── agent-handoff.md            ← Copia adaptada de v1
    └── performance-metrics.md      ← Copia adaptada de v1
```

Las referencias a rutas en los procesos deben ser reemplazadas durante la inyección:
- `<origen>/tools/agent-*` → `<target>/tools/agent-*`
- `<origen>/.opencode/agents/` → `<target>/.opencode/agents/` (o `.claude/agents/`, etc.)
- `<origen>/Docs/processes/` → `<target>/Docs/processes/`

### 4.2 Inyector (`injector.mjs`)

```javascript
class Injector {
  constructor(templatePath) {
    this.templatePath = templatePath; // tools_dynamic/templates/
  }

  /**
   * Genera un plan de inyección (sin ejecutar)
   * @param {PlatformScanResult} scan
   * @param {InjectionOptions} options
   * @returns {InjectionPlan}
   */
  plan(scan, options) {
    // Para componente seleccionado, determinar:
    // - Archivos a crear (nuevos en target)
    // - Archivos a modificar (existentes en target)
    // - Archivos a respaldar (antes de modificar)
    // - Variables de sustitución
  }

  /**
   * Ejecuta un plan de inyección
   * @param {InjectionPlan} plan
   * @param {Object} callbacks - onFileCreate, onFileModify, onBackup
   * @returns {InjectionResult}
   */
  execute(plan, callbacks) {
    // 1. Crear directorios necesarios
    // 2. Copiar templates con sustitución de variables
    // 3. Modificar archivos existentes (AGENTS.md, opencode.json, etc.)
    // 4. Generar reporte post-inyección
  }

  /**
   * Adapta un template reemplazando variables {{variable}}
   */
  adaptTemplate(templateContent, variables) {
    // {{agentName}} → "database-specialist"
    // {{keywords}} → "database, SQL, query, schema..."
    // {{platform}} → "opencode"
  }
}
```

### 4.3 Comando `inject`

**Flags**:
```
--tools           Inyectar tools (testing, metrics, workflows)
--processes       Inyectar Docs/processes/
--config          Actualizar config (AGENTS.md, opencode.json, etc.)
--all             Inyectar todo (default)
--select          Modo interactivo para elegir componentes
```

**Flujo**:
1. Escanear proyecto
2. Preguntar qué componentes inyectar
3. Mostrar diff preview
4. Confirmar
5. Backup automático (archivos modificados → `.bak.<timestamp>`)
6. Ejecutar inyección
7. Mostrar resumen

### 4.4 Comando `init`

Combina `analyze` + `inject` en un solo flujo interactivo.

**Modo dry-run** (`--dry-run`):
- Ejecuta todo el flujo de análisis y planificación
- Muestra diff completo de todos los cambios
- NO escribe ningún archivo
- Útil para revisar antes de ejecutar

**Backup automático**:
```
.target/<archivo>                ← Archivo original
.target/<archivo>.bak.20260517  ← Backup antes de modificar
.target/<archivo>                ← Archivo modificado
```

---

## Phase 5 📦 — Distribution & Documentation (Hybrid pnpm + npm)

### Contexto de Seguridad (2025-2026)

El ecosistema npm sufrió ataques masivos de supply chain que motivan esta estrategia:

| Incidente | Impacto | Vector |
|---|---|---|
| **Shai-Hulud 1.0** (Sep 2025) | 500+ packages, worm autoreplicante | preinstall scripts roban tokens npm/GitHub/cloud |
| **Shai-Hulud 2.0** (Nov 2025) | 796 packages, 20M+ downloads/semana | Bun runtime para evadir Node.js monitoring |
| **chalk/debug hijack** (Sep 2025) | 18 packages, 2.6B downloads/semana | Credenciales de mantenedores |
| **Mini Shai-Hulud** (Abr 2026) | SAP CAP ecosystem, 570K descargas/semana | Misma técnica, nuevo objetivo |

En 2025 se publicaron **454,648 paquetes maliciosos** en npm (Sonatype). Más del 99% del malware de open source targets npm. La vulnerabilidad crítica no está en el registry, sino en **`npm install` como primitiva de ejecución remota**: cada `postinstall` se ejecuta con las credenciales completas del usuario.

### Estrategia Híbrida

```
Desarrollo local:    pnpm (dev, test, lint)      → 3 capas de defensa supply chain
CI/CD (test):        pnpm install --frozen-lockfile → bloqueado por defecto
CI/CD (publish):     npm publish (OIDC trusted)   → madurez comprobada
                     │
                     └── Ambos publican al mismo registry npmjs.com
                         El lockfile/packageManager no afecta al consumidor
```

**pnpm v11** (abril 2026) proporciona 3 capas de defensa que **npm CLI no tiene**:

| Control | pnpm v11 (default) | npm v11 |
|---|---|---|
| **Lifecycle scripts** | `strictDepBuilds: true` — bloqueado, solo con `allowBuilds` explícito | Sin restricción |
| **Release cooldown** | `minimumReleaseAge: 1440` — 24h de retraso para paquetes nuevos | Sin restricción |
| **Subdeps exóticas** | `blockExoticSubdeps: true` — transitivas no usan git/tarball URLs | Sin restricción |

npm publish se retiene para el paso final porque su integración OIDC (trusted publishing con GitHub Actions) es más madura que la de pnpm v11 (issue #11513: OIDC tokens fallaban hasta v11.0.8+).

### 5.1 Archivos de Configuración

**package.json**:
```json
{
  "name": "@opencode/tools-dynamic",
  "version": "2.0.0",
  "description": "Portable agent orchestration system - analyze and supercharge any project",
  "type": "module",
  "bin": {
    "tools-dynamic": "./index.mjs"
  },
  "packageManager": "pnpm@11.0.0",
  "engines": {
    "node": ">=22"
  },
  "files": [
    "index.mjs",
    "commands/",
    "core/",
    "scanners/",
    "templates/",
    "package.json",
    "README.md"
  ],
  "dependencies": {
    "commander": "^12.0.0",
    "gray-matter": "^4.0.3",
    "js-yaml": "^4.1.0",
    "inquirer": "^9.0.0",
    "chalk": "^5.0.0",
    "glob": "^10.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "pnpm test"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

**pnpm-workspace.yaml** (configuración de seguridad):
```yaml
# pnpm-workspace.yaml
# Configuración de seguridad supply chain
# pnpm v11 activa strictDepBuilds, minimumReleaseAge, y blockExoticSubdeps por defecto
# Solo permitir build scripts para paquetes que realmente los necesitan
allowBuilds:
  esbuild: true
  # Sharp y otras dependencias nativas se agregan aquí cuando se requieran
```

**.npmrc** (solo auth — pnpm v11 no lee config de proyecto desde aquí):
```
# pnpm v11 solo lee auth y registry settings de .npmrc
# Toda otra configuración va en pnpm-workspace.yaml
```

**Uso via npx** (funciona igual para el consumidor final):
```bash
npx @opencode/tools-dynamic init ./mi-proyecto
npx @opencode/tools-dynamic analyze ./mi-proyecto --json
npx @opencode/tools-dynamic doctor ./mi-proyecto
```

### 5.2 CI/CD Pipeline Híbrido

```yaml
# .github/workflows/tools-dynamic.yml
name: tools_dynamic CI

on:
  push:
    branches: [main]
    paths: ['tools_dynamic/**']
  pull_request:
    paths: ['tools_dynamic/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: node tools_dynamic/index.mjs doctor . --json
      - run: node tools_dynamic/index.mjs analyze . --json

  publish:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write       # ← Necesario para OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: 'https://registry.npmjs.org'
      # pnpm para instalar (seguro), npm para publicar (OIDC maduro)
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - run: pnpm install --frozen-lockfile
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Nota sobre trusted publishing**: Si se usa OIDC en lugar de token estático, el paso `npm publish` detecta automáticamente el entorno CI y genera provenance attestations sin necesidad de `NODE_AUTH_TOKEN`:

```yaml
      - run: npm publish --provenance --access public
        # Sin NODE_AUTH_TOKEN — usa OIDC
        env:
          NODE_AUTH_TOKEN: ""  # Se ignora; OIDC lo reemplaza
```

### 5.3 Documentación en Español

Se genera en `Docs/processes/tools-dynamic/`:

| Archivo | Contenido |
|---|---|
| `scanner.md` | Cómo funciona el escaneo multi-plataforma, cómo añadir un nuevo scanner |
| `workflow-generation.md` | Algoritmo de generación adaptativa, patrones de workflow |
| `analysis-report.md` | Cómo interpretar reportes, semáforo, recomendaciones |
| `injection.md` | Proceso de inyección, backup, dry-run, resolución de conflictos |
| `distribution.md` | Publicación npm con pnpm+npm, CI/CD híbrido, versionado |

### 5.4 Seguridad Adicional Recomendada

Más allá de pnpm, el proyecto debería implementar:

- **Dependencias mínimas**: solo `commander`, `gray-matter`, `js-yaml`, `inquirer`, `chalk`, `glob` — ninguna de estas ejecuta build scripts
- **Lockfile commiteado**: `pnpm-lock.yaml` en git para instalaciones deterministas
- **Dependabot / Renovate**: monitoreo automático de vulnerabilidades en dependencias
- **npm provenance**: `--provenance` en publish para que los consumidores verifiquen el origen del paquete
- **SBOM opcional**: `pnpm sbom` genera CycloneDX/SPDX para auditorías de seguridad

---

## Proyectos Objetivo: Estructura Esperada

### OpenCode

```
proyecto/
├── .opencode/
│   ├── opencode.json
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── database-specialist.md
│   │   └── ...
│   └── skills/
│       ├── database/SKILL.md
│       ├── testing/SKILL.md
│       └── ...
├── AGENTS.md
└── tools/               ← Inyectado por tools_dynamic
    ├── agent-testing/
    ├── agent-metrics/
    └── agent-workflows/
```

### VS Code / GitHub Copilot

```
proyecto/
├── .github/
│   ├── copilot-instructions.md
│   ├── agents/
│   │   └── *.md
│   └── skills/
│       └── */SKILL.md
└── tools/               ← Inyectado por tools_dynamic
    ├── agent-testing/
    ├── agent-metrics/
    └── agent-workflows/
```

### Claude Code

```
proyecto/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   ├── agents/
│   │   └── *.md
│   ├── skills/
│   │   └── */SKILL.md
│   ├── rules/
│   │   └── *.md
│   └── mcp.json
└── tools/               ← Inyectado por tools_dynamic
    ├── agent-testing/
    ├── agent-metrics/
    └── agent-workflows/
```

---

## Referencias Técnicas

### Librerías npm Recomendadas

| Librería | Uso | Alternativa |
|---|---|---|
| `commander` | CLI framework (flags, subcomandos, help) | `yargs` |
| `gray-matter` | Parseo de frontmatter YAML en .md | Manual con regex |
| `js-yaml` | Parseo de archivos YAML (antigravity, settings) | `yaml` |
| `glob` | Búsqueda de archivos por patrón | `fast-glob` |
| `chalk` | Colores en terminal | `kleur` |
| `inquirer` | Prompts interactivos | `enquirer` |

### Versionado

- v2.0.0-alpha: Phase 1 completa (scanners funcionales)
- v2.0.0-beta: Phases 2-3 completas (CLI + analysis)
- v2.0.0-rc: Phase 4 completa (injection)
- v2.0.0: Release final con Phase 5 (distribution)

### Migración desde v1

No hay migración directa porque v1 y v2 son proyectos diferentes:
- v1: el sistema en sí mismo (vive en este proyecto)
- v2: herramienta para replicar el sistema en otros proyectos

La relación es: v2 usa a v1 como fuente de templates y referencia de implementación.

---

*Modelo: opencode/deepseek-v4-flash-free*
