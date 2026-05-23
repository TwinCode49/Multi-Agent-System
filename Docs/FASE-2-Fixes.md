# FASE-2-Fixes — Correcciones Post-Estabilización

> **Roadmap asociado**: `Docs/roadmaps/roadmap_v2_Fixes.md`

---

## Fix 1 — Salida en `init` interactivo

### Problema

El comando `init` en modo interactivo obliga al usuario a pasar por 3 prompts (plataformas → componentes → confirmación) sin posibilidad de cancelar explícitamente. Solo puede "salir" seleccionando 0 plataformas o 0 componentes, pero no es obvio.

### Solución

Agregar una opción "❌ Cancel / Exit" al final de cada prompt de selección.

#### Archivo: `tools_dynamic/index.mjs`

**Prompt de plataformas** (línea ~205-218):

```js
const { platform } = await inquirer.prompt([{
  type: 'list',
  name: 'platform',
  message: 'Select target platform to configure:',
  choices: [
    { name: 'OpenCode (.opencode/, AGENTS.md)', value: 'opencode' },
    { name: 'VS Code / Copilot (.github/copilot-instructions.md)', value: 'vscode' },
    { name: 'Claude Code (CLAUDE.md, .claude/)', value: 'claude' },
    { name: 'Antigravity (antigravity.yaml)', value: 'antigravity' },
    { name: 'Generic (.agents/ convention)', value: 'vanilla' },
    new inquirer.Separator(),
    { name: '❌ Cancel / Exit', value: '__exit__' },
  ],
}]);
if (platform === '__exit__') {
  console.log(`\n  ${YELLOW}Exiting. No changes made.${RESET}\n`);
  return;
}
```

> **Nota**: Se usa `type: 'list'` (no checkbox) para selección única. El `Separator` se coloca **directamente** en el array de choices, no envuelto en `{name: ...}`, para evitar el error `[object Object]` en `@inquirer/prompts` v4+.

**Prompt de componentes** (línea ~227-253):

```js
const { components } = await inquirer.prompt([{
  type: 'checkbox',
  name: 'components',
  message: 'Select components to bootstrap:',
  choices: [
    { name: '🤖 Agent Definitions (AGENTS.md + agent .md files)', value: 'agents', checked: true },
    { name: '📚 Skill Definitions (SKILL.md + references)', value: 'skills', checked: true },
    { name: '⚙️  Platform Config (opencode.json, GEMINI.md, copilot-instructions.md)', value: 'platformConfig', checked: true },
    new inquirer.Separator(),
    { name: '📦 Agent Testing Framework (run.mjs + cases)', value: 'testing', checked: true },
    { name: '📊 Agent Performance Metrics (report.mjs)', value: 'metrics', checked: true },
    { name: '⚡ Multi-Agent Workflows (definitions + executor)', value: 'workflows', checked: true },
    { name: '📋 Docs/Processes (documentation templates)', value: 'processes', checked: false },
    { name: '🧠 Context Manager (token estimation + compaction tool)', value: 'context', checked: true },
    new inquirer.Separator(),
    { name: '❌ Cancel / Exit', value: '__exit__' },
  ],
}]);
if (components.includes('__exit__')) {
  console.log(`\n  ${YELLOW}Exiting. No changes made.${RESET}\n`);
  return;
}
```

### Comportamiento esperado

- **Prompt de plataformas** (`type: 'list'`): Enter selecciona la opción resaltada. "❌ Cancel / Exit" sale inmediatamente.
- **Prompt de componentes** (`type: 'checkbox'`): Si el usuario selecciona "❌ Cancel / Exit" → mensaje "Exiting. No changes made." y `return`
- El separador `new inquirer.Separator()` se coloca **directamente** en el array de choices (no envuelto en `{name: ...}`) para compatibilidad con `@inquirer/prompts` v4+
- Ningún archivo se modifica al cancelar

---

## Fix 2 — Plataforma "vanilla" (`.agents/`)

### Problema

No existe una opción de plataforma genérica que use la convención `.agents/`. Las únicas opciones son opencode, vscode, claude, antigravity. Un usuario que solo quiere usar la convención universal de directorios no tiene cómo elegirla.

### Solución

Agregar `vanilla` como 5ª plataforma sintética en todos los lugares relevantes.

#### 2.1 — `makeSyntheticResult()` en `index.mjs`

Agregar mapeo para `vanilla`:

```js
function makeSyntheticResult(platformName, targetPath) {
  const platformDirMap = {
    opencode: '.opencode',
    vscode: '.github',
    claude: '.claude',
    antigravity: '.agent',
    vanilla: '.agents',
  };
  const agentsDirMap = {
    opencode: '.opencode/agents',
    vscode: '.github/agents',
    claude: '.claude/agents',
    antigravity: '.agent/rules',
    vanilla: '.agents/agents',
  };
  const skillsDirMap = {
    opencode: '.opencode/skills',
    vscode: '.github/skills',
    claude: '.claude/skills',
    antigravity: '.agent/rules',
    vanilla: '.agents/skills',
  };
  const configPathsMap = {
    opencode: ['.opencode', 'AGENTS.md'],
    vscode: ['.github/copilot-instructions.md'],
    claude: ['CLAUDE.md'],
    antigravity: ['antigravity.yaml'],
    vanilla: ['.agents', 'AGENTS.md'],
  };
  // ... mismo resto pero con vanilla incluido
  return {
    platform: platformName,
    platformVersion: '1.0',
    detected: true,
    configPaths: configPathsMap[platformName] || [],
    agents: [],
    skills: [],
    workflows: [],
    existingTools: [],
    nativeCapabilities: {
      subAgents: false,
      agentTeams: false,
      hooks: false,
      mcp: false,
      parallelExecution: false,
      customTools: true,
    },
    agentsDir: agentsDirMap[platformName] || '.agents/agents',
    skillsDir: skillsDirMap[platformName] || '.agents/skills',
    platformDir: platformDirMap[platformName] || '.agents',
  };
}
```

#### 2.2 — Prompt de plataformas en `init`

```js
{ name: 'Generic (.agents/ convention)', value: 'vanilla', checked: false },
```

#### 2.3 — Descripción de `--platform`

Actualizar de:
```
'--platform <name>', 'Target platform for --yes mode (opencode, vscode, claude, antigravity)'
```
a:
```
'--platform <name>', 'Target platform for --yes mode (opencode, vscode, claude, antigravity, vanilla)'
```

#### 2.4 — `resolveVariablesFromScan()` con vanilla

`injector.plan()` usa `resolveVariablesFromScan()` para determinar las rutas de directorios de cada plataforma. Originalmente no tenía un caso para `vanilla`, por lo que todo caía al default `.opencode/`. Se agregó el case:

```js
} else if (pName === 'vanilla') {
  agentsDir = '.agents/agents';
  skillsDir = '.agents/skills';
  githubSkillsDir = '.github/skills';
  platformDir = '.agents';
}
```

> **Nota**: Vanilla no tiene detector. Solo existe como plataforma sintética para `makeSyntheticResult()`. El scanner NUNCA detecta `vanilla` automáticamente — solo aparece cuando el usuario la selecciona explícitamente.

---

## Fix 3 — Separar `config` en agents / skills / platformConfig

### Problema

La opción `config` (tanto en `init` como en `inject --config`) agrupa agents + skills + config (opencode.json, AGENTS.md, etc.) como un solo bloque. No es posible inyectar solo agents o solo skills.

### Solución

1. **Separar el checkbox en `init`** en 3 opciones individuales
2. **Agregar flags individuales** en `inject`
3. **Modificar `injector.plan()`** para procesar componentes independientes
4. **Mantener `--config`** como bundle para retrocompatibilidad

#### 3.1 — Checkbox en `init` (index.mjs)

Reemplazar la opción única "🤖 Agents + Skills + Config" por:

```js
{ name: '🤖 Agent Definitions (AGENTS.md + agent .md files)', value: 'agents', checked: true },
{ name: '📚 Skill Definitions (SKILL.md + references)', value: 'skills', checked: true },
{ name: '⚙️  Platform Config (opencode.json, GEMINI.md, copilot-instructions.md)', value: 'platformConfig', checked: true },
```

#### 3.2 — Flags en `inject` (commands/inject.mjs)

Agregar:

```js
if (options.agents || options.config || options.all) {
  components.push('agents');
}
if (options.skills || options.config || options.all) {
  components.push('skills');
}
if (options.platformConfig || options.config || options.all) {
  components.push('platformConfig');
}
```

Y registrar los flags en `index.mjs`:

```js
program
  .command('inject [path]')
  .option('--agents', 'Inject agent definitions only')
  .option('--skills', 'Inject skill definitions only')
  .option('--platform-config', 'Inject platform config only')
  .option('--config', 'Inject agents + skills + config (default bundle)')
  // ... resto de opciones
```

#### 3.3 — Modificar `injector.plan()` (core/injector.mjs)

Reemplazar:

```js
const includeConfig = components.includes('config');
```

Por:

```js
const includeAgents = components.includes('agents') || components.includes('config');
const includeSkills = components.includes('skills') || components.includes('config');
const includePlatformConfig = components.includes('platformConfig') || components.includes('config');
```

Y separar la lógica dentro del bloque `if (includeConfig)` en tres bloques condicionales:

```js
if (includeAgents) {
  // Solo inyectar templates de agentes
}
if (includeSkills) {
  // Solo inyectar templates de skills
}
if (includePlatformConfig) {
  // Solo inyectar opencode.json, GEMINI.md, AGENTS.md, etc.
}
```

**Estructura del plan actual** (bloque `if (includeConfig)`):

1. Línea 194: itera plataformas
2. Línea 204-213: inyecta agentes desde templates (`agDir/agents/`)
3. Línea 215-228: inyecta skills desde templates (`agDir/skills/`)
4. Línea 230-260: inyecta config por plataforma (opencode.json, GEMINI.md, copilot-instructions.md, CLAUDE.md)
5. Línea 263-273: genera AGENTS.md combinado

**Nuevo flujo:**

```js
// 1. Agents (si incluido)
if (includeAgents) {
  for (const platform of platformsForConfig) {
    const agFiles = this.listTemplates(join('config', 'agents-skills', 'agents'));
    for (const file of agFiles) {
      // ... mismo código que antes para agents
    }
  }
}

// 2. Skills (si incluido)
if (includeSkills) {
  for (const platform of platformsForConfig) {
    const skillFiles = this.listTemplatesNested(join('config', 'agents-skills', 'skills'));
    for (const file of skillFiles) {
      // ... mismo código que antes para skills
    }
  }
}

// 3. Platform Config (si incluido)
if (includePlatformConfig) {
  for (const platform of platformsForConfig) {
    // opencode.json, GEMINI.md, etc.
  }
  // AGENTS.md combinado
}
```

#### 3.4 — Retrocompatibilidad

`--config` debe seguir funcionando exactamente igual que antes. Para lograrlo:

```js
// En inject.mjs:
if (options.config || options.all) {
  // includeAgents, includeSkills, includePlatformConfig todos true
}

// En index.mjs init:
// Si el usuario selecciona los 3 (agents + skills + platformConfig) es equivalente a antes
// Si selecciona solo algunos, funciona granular
```

#### 3.5 — Pruebas

**Nuevos tests en `tests/injector.test.mjs`**:

```js
test('plan with agents only does not inject skills', () => {
  const plan = injector.plan(scanResults, targetPath, ['agents']);
  // Verificar que agent .md files están en plan.create
  // Verificar que NO hay SKILL.md files en plan.create
  // Verificar que NO hay opencode.json
});

test('plan with skills only does not inject agents', () => {
  const plan = injector.plan(scanResults, targetPath, ['skills']);
  // Verificar que SKILL.md files están en plan.create
  // Verificar que NO hay agent .md files
});

test('plan with config bundle produces same result as agents+skills+platformConfig', () => {
  const bundlePlan = injector.plan(scanResults, targetPath, ['config']);
  const individualPlan = injector.plan(scanResults, targetPath, ['agents', 'skills', 'platformConfig']);
  // Verificar que ambos planes son equivalentes
});
```

---

## Fix 4 — Vanilla en doctor/analyze

### Problema

Cuando `doctor` o `analyze` no detectan plataformas, sugieren `init --yes` pero no mencionan la opción `.agents/` genérica.

### Solución

#### 4.1 — `reporter.mjs` (`printAnalysis`)

Buscar donde se muestra "No agent platforms detected" y agregar:

```js
// Si no hay plataformas detectadas
console.log(`  💡 Run ${CYAN}tools-dynamic init --yes --platform vanilla${RESET} to bootstrap with .agents/ convention.`);
```

#### 4.2 — `doctor` output (index.mjs)

Buscar en el bloque de `options.json` false del comando `doctor` donde se invoca `VanillaDetector` y agregar:

```js
console.log(`  ${CYAN}   Or use --platform vanilla for the generic .agents/ convention${RESET}`);
```

---

## Fix 5 — Help text desactualizado

### Problema

La descripción de `--platform` en `index.mjs` línea 158 no incluye `vanilla`:

```
Target platform for --yes mode (opencode, vscode, claude, antigravity)
```

### Solución

```js
.option('--platform <name>', 'Target platform for --yes mode (opencode, vscode, claude, antigravity, vanilla)')
```

---

## Archivos a Modificar

| Archivo | Fixes | Tipo de cambio |
|---|---|---|---|
| `tools_dynamic/index.mjs` | 1, 2, 3, 5, D, 6, C | Estructural: prompts (select), flags, makeSyntheticResult, vanilla, exit, UX init |
| `tools_dynamic/commands/inject.mjs` | 3 | Aditivo: nuevos flags |
| `tools_dynamic/core/injector.mjs` | 3, M, 2b | Estructural: plan() con componentes separados + multi-platform merge AGENTS.md + vanilla paths en resolveVariablesFromScan + defaultModel |
| `tools_dynamic/core/reporter.mjs` | 4, D, A, B, Md | Aditivo: mención vanilla, UX doctor, UX analyze, UX empty dir, modelo en analyze/doctor/diagnose |
| `tools_dynamic/core/types.mjs` | Md | Aditivo: `model` opcional en AgentDef |
| `tools_dynamic/core/parser.mjs` | Md | Aditivo: extraer `model` del frontmatter, `auto` → undefined |
| `tools_dynamic/scanners/opencode-scanner.mjs` | Md | Aditivo: extraer `model` del frontmatter |
| `tools_dynamic/scanners/vscode-scanner.mjs` | Md | Aditivo: extraer `model` del frontmatter |
| `tools_dynamic/scanners/claude-scanner.mjs` | Md | Aditivo: extraer `model` del frontmatter |
| `tools_dynamic/scanners/antigravity-scanner.mjs` | Ag | Estructural: endurecer `detect()` — eliminar condiciones compartidas con vanilla |
| `tools_dynamic/scanners/vanilla-scanner.mjs` | Vs | **Nuevo**: scanner para plataforma vanilla (`.agents/`) |
| `tools_dynamic/scanners/scanner.mjs` | Vs | Aditivo: registrar VanillaScanner + prioridad vanilla |
| `tools_dynamic/templates/config/agents-skills/agents/code-reviewer.md` | Md | Aditivo: `model: auto` en vez de modelo hardcodeado |
| `tools_dynamic/templates/config/agents-skills/agents/security-reviewer.md` | Md | Aditivo: `model: auto` |
| `tools_dynamic/templates/config/opencode/opencode.json` | Md | Aditivo: `defaultModel` |
| `tools_dynamic/tests/vanilla-scanner.test.mjs` | Vs | **Nuevo**: 10 tests para VanillaScanner |
| `tools_dynamic/tests/scanner.test.mjs` | Vs | Actualizado: vanilla detectado, no vacío |
| `tools_dynamic/tests/injector.test.mjs` | 3 | Aditivo: 3 nuevos tests |

---

## Orden de Implementación Sugerido

1. **Fix 3** (injector.mjs) — Cambio estructural más grande, base para los demás
2. **Fix 2** (index.mjs) — Nueva plataforma vanilla necesita el plan() actualizado primero
3. **Fix 1** (index.mjs) — Independiente, solo toca prompts
4. **Fix 4** (reporter.mjs) — Depende de Fix 2 (menciona --platform vanilla)
5. **Fix 5** (index.mjs) — Cosmético, al final
6. **Fix 6** (index.mjs) — Inquirer v13: `list` → `select`
7. **Fix A/B/C** (reporter.mjs, index.mjs) — UX en carpeta vacía
8. **Tests** — Validar todo junto

---

## Mejora Post-Fix — VanillaScanner (detección automática de `.agents/`)

### Problema

La plataforma vanilla solo existía como `makeSyntheticResult()` (sintética). No tenía scanner propio, por lo que nunca se mostraba como `✅` detectada en el menú interactivo. Antes de endurecer AntigravityScanner, antigravity detectaba falsamente `.agents/agents/` y `.agents/skills/` como propios.

### Solución

#### VanillaScanner (nuevo)

**Archivo:** `tools_dynamic/scanners/vanilla-scanner.mjs`

Scanner que detecta `.agents/` y escanea agentes/skills desde `.agents/agents/` y `.agents/skills/`:

```js
export class VanillaScanner extends PlatformScanner {
  static platformName = 'vanilla';

  detect(basePath) {
    return existsSync(join(basePath, '.agents'));
  }

  scan(basePath) {
    // platform: 'vanilla'
    // nativeCapabilities: customTools: true
    // Agentes: .agents/agents/*.md + scanDotAgent()
    // Skills: .agents/skills/*/SKILL.md + scanDotAgent()
    // Tools: tools/agent-testing, tools/agent-metrics, tools/agent-workflows
    // Workflows: tools/agent-workflows/definitions/*.json
  }
}
```

#### AntigravityScanner — detect() endurecido

**Archivo:** `tools_dynamic/scanners/antigravity-scanner.mjs`

Se eliminaron 4 condiciones del `detect()` que compartían directorios con vanilla:

| Condición eliminada | Motivo |
|---|---|
| ~~`.agents/agents`~~ | Compartido con vanilla |
| ~~`.agents/skills`~~ | Compartido con vanilla |
| ~~`.agent/agents`~~ | Compartido con `.agent/` genérico |
| ~~`.agent/skills`~~ | Compartido con `.agent/` genérico |

Se mantienen las condiciones exclusivas de antigravity:
- `antigravity.yaml` / `antigravity.json` — archivos de configuración propios
- `.agents/rules` — subcarpeta específica de antigravity (vanilla usa `agents/` no `rules/`)
- `.agent/rules` — mismo criterio

#### scanner.mjs — Registro

**Archivo:** `tools_dynamic/scanners/scanner.mjs`

```js
import { VanillaScanner } from './vanilla-scanner.mjs';

this.scanners = [
  new OpenCodeScanner(),
  new VSCodeScanner(),
  new ClaudeScanner(),
  new AntigravityScanner(),
  new VanillaScanner(),  // <-- nuevo
];

// scanPrimary priority:
const priority = ['opencode', 'vscode', 'claude', 'antigravity', 'vanilla'];
```

### Tests

**Archivo nuevo:** `tools_dynamic/tests/vanilla-scanner.test.mjs` (10 tests)

**Archivo modificado:** `tools_dynamic/tests/scanner.test.mjs` — actualizadas expectativas para vanilla detectado

### Comportamiento

| Escenario | Antes | Después |
|---|---|---|
| Proyecto con `.agents/` solo | Antigravity lo detectaba falsamente ✅ | Vanilla lo detecta ✅, Antigravity no ❌ |
| Proyecto con `antigravity.yaml` + `.agents/` | Solo antigravity ✅ | Ambos ✅ |
| Proyecto sin nada | Ninguno ❌ | Ninguno ❌ |
| `init` en proyecto vanilla | Mostraba "0 platforms" sin ✅ | Muestra "1 platform — vanilla ✅" |

---

## Mejora Post-Fix — Model handling (`model: auto`)

### Problema

Las templates de agentes read-only (`code-reviewer.md`, `security-reviewer.md`) tenían `model: claude-sonnet-4-20250514` hardcodeado. Si ese modelo no estaba disponible en runtime, no había fallback. Además, el scanner no extraía `model` del frontmatter, por lo que ninguna herramienta podía leer ni validar el modelo de un agente.

### Solución

#### 1. `model: auto` en templates

**Archivos:** `tools_dynamic/templates/config/agents-skills/agents/code-reviewer.md`, `security-reviewer.md`

```yaml
model: auto  # "usar el modelo por defecto del proyecto"
```

`auto` significa: "este agente no requiere modelo especializado, usa el default". Si el usuario quiere especializar, cambia `auto` por un nombre de modelo concreto.

#### 2. Scanner extrae `model`, normaliza `auto` → `undefined`

**Archivos:** `opencode-scanner.mjs`, `vscode-scanner.mjs`, `claude-scanner.mjs`, `parser.mjs`

```js
model: frontmatter.model === 'auto' ? undefined : (frontmatter.model || undefined),
```

#### 3. `AgentDef` incluye `model`

**Archivo:** `core/types.mjs`

```js
/**
 * @typedef {Object} AgentDef
 * ...
 * @property {string} [model]  // Modelo especializado (opcional)
 */
```

#### 4. `defaultModel` en `opencode.json`

**Archivo:** `tools_dynamic/templates/config/opencode/opencode.json`

```json
{
  "defaultModel": "claude-sonnet-4-20250514",
  ...
}
```

#### 5. `resolveVariablesFromScan()` lee `defaultModel`

**Archivo:** `core/injector.mjs`

```js
let defaultModel = 'gpt-4o';  // fallback global
try {
  const cfgPath = join(targetPath, platformDir, 'opencode.json');
  if (existsSync(cfgPath)) {
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));
    if (cfg.defaultModel) defaultModel = cfg.defaultModel;
  }
} catch {}
```

#### 6. Reporter muestra modelo + alerta

**Archivo:** `core/reporter.mjs`

- `printAnalysis()`: muestra `[model: claude-sonnet-4-20250514]` o `[model: default]` por agente
- `diagnose()`: warning si agente read-only (`edit: deny`) no tiene modelo asignado
- `_platformToJSON()`: incluye `model` en JSON de salida

### Comportamiento

| Escenario | Scanner | analyze | doctor |
|---|---|---|---|
| `model: auto` en .md | `model: undefined` | `[model: default]` | Sin warning (intencional) |
| `model: claude-...` en .md | `model: 'claude-...'` | Muestra el modelo | Sin warning |
| Sin `model:` en .md (read-only) | `model: undefined` | `[model: default]` | ⚠️ Warning: agregar modelo |
| Sin `model:` en .md (no read-only) | `model: undefined` | `[model: default]` | Sin warning |

---

## Verificación de Retrocompatibilidad

| Escenario | Comportamiento esperado | Estado |
|---|---|---|
| `node tools_dynamic/index.mjs init .` | Prompt `select` con menú navegable + exit | ✅ |
| `node tools_dynamic/index.mjs init . --yes` | Sin cambios | ✅ |
| `node tools_dynamic/index.mjs init <empty>` | Menu de plataformas visible + selección | ✅ |
| `node tools_dynamic/index.mjs doctor <empty>` | "⚠️ No configuration detected. Run init" | ✅ |
| `node tools_dynamic/index.mjs analyze <empty>` | "Run init" (no "list-platforms") | ✅ |
| `node tools_dynamic/index.mjs inject . --config` | Sigue igual (bundle) | ✅ |
| `node tools_dynamic/index.mjs inject . --agents` | Nuevo: solo agentes | ✅ |
| `node tools_dynamic/index.mjs inject . --skills` | Nuevo: solo skills | ✅ |
| `node tools_dynamic/index.mjs inject . --platform-config` | Nuevo: solo platform config | ✅ |
| `node tools_dynamic/index.mjs validate .` | Sin cambios | ✅ |
| `node tools_dynamic/index.mjs update .` | Sin cambios | ✅ |
| `node --test tools_dynamic/tests/*.test.mjs` | 190 tests, todos pasan | ✅ |

---

## Mejora Post-Fix — Option D: Select para plataformas

### Problema

El checkbox de plataformas permitía seleccionar múltiples plataformas a la vez, pero en la práctica el usuario casi siempre selecciona una sola. Además, la opción "❌ Cancel / Exit" dentro de un checkbox requiere marcar con espacio + Enter, lo cual no es intuitivo.

### Solución

Cambiar el prompt de plataformas a `type: 'select'` para selección única + Enter directo:

```js
const { platform } = await inquirer.prompt([{
  type: 'select',
  name: 'platform',
  message: 'Select target platform to configure:',
  choices: [
    { name: 'OpenCode (.opencode/, AGENTS.md)', value: 'opencode' },
    { name: 'VS Code / Copilot (.github/copilot-instructions.md)', value: 'vscode' },
    { name: 'Claude Code (CLAUDE.md, .claude/)', value: 'claude' },
    { name: 'Antigravity (antigravity.yaml)', value: 'antigravity' },
    { name: 'Generic (.agents/ convention)', value: 'vanilla' },
    new inquirer.Separator(),
    { name: '❌ Cancel / Exit', value: '__exit__' },
  ],
}]);
if (platform === '__exit__') {
  console.log(`\n  ${YELLOW}Exiting. No changes made.${RESET}\n`);
  return;
}
results = [makeSyntheticResult(platform, targetPath)];
```

El prompt de componentes se mantiene como `checkbox` con opción `__exit__`.

### Cambio clave

El `Separator` debe colocarse DIRECTO en el array (no como `{name: new inquirer.Separator()}`) porque `@inquirer/prompts` v4+ reconoce `{type: 'separator'}` solo cuando el choice es una instancia directa de `Separator`, no cuando está envuelta en un objeto.

---

## Fix 6 — Inquirer v13: `type: 'list'` no existe, usar `type: 'select'`

### Problema

`inquirer` v13 migró internamente a `@inquirer/prompts`. El mapeo de tipos (`inquirer/dist/index.js`):

```js
const builtInPrompts = { input, select, number, confirm, rawlist, expand, checkbox, password, editor, search };
```

No existe la clave `'list'`. Cuando `PromptsRunner.prepareQuestion()` encuentra un `type` que no está en `builtInPrompts`, falla silenciosamente a `'input'`:

```js
type: question.type in this.prompts ? question.type : 'input',
```

Esto convertía el menú navegable de plataformas en un campo de texto vacío. El usuario veía "Select a platform below to bootstrap." seguido de un `@inquirer/input` sin opciones, donde Enter enviaba string vacío.

### Solución

Cambiar `type: 'list'` a `type: 'select'` en el prompt de plataformas. `'select'` existe en el mapeo y apunta directamente a `@inquirer/select`.

### Cambio clave

Sensible a versiones de `inquirer`: `type: 'list'` funciona en inquirer v8-v9 pero NO en v13+.

### Archivos modificados

- `tools_dynamic/index.mjs` — Fix 6: `list` → `select`

---

## Mejora Post-Fix — Multi-platform AGENTS.md Merge

### Problema

Al ejecutar `init` para múltiples plataformas en runs separados, el AGENTS.md se regeneraba mencionando solo la plataforma del run actual, perdiendo las referencias a plataformas configuradas en runs anteriores.

### Solución

En `injector.plan()`, antes de generar AGENTS.md, detectar qué plataformas tienen directorios/archivos existentes en disco y fusionarlas con la selección actual:

```js
if (platformsForConfig.length > 0) {
  const globalVars = this.resolveVariablesFromScan(platformsForConfig, targetPath);
  let activePlatforms = platformsForConfig.map(p => p.platform);
  const existingPlatformDirs = {
    opencode: join(targetPath, '.opencode'),
    vanilla: join(targetPath, '.agents'),
    vscode: join(targetPath, '.github', 'copilot-instructions.md'),
    claude: join(targetPath, 'CLAUDE.md'),
    antigravity: join(targetPath, 'antigravity.yaml'),
  };
  for (const [plat, dirPath] of Object.entries(existingPlatformDirs)) {
    if (existsSync(dirPath) && !activePlatforms.includes(plat)) {
      activePlatforms.push(plat);
    }
  }
  const combinedContent = this.generateCombinedAgentsMd(globalVars.projectName, activePlatforms);
  // ...
}
```

Además, se agregó `vanilla` a `generateCombinedAgentsMd()`:

```js
if (activePlatforms.includes('vanilla')) aiFacingFilesList.push('.agents');
```

### Comportamiento

1. Primer run: `init` para `opencode` → crea `.opencode/` + AGENTS.md mencionando opencode
2. Segundo run: `init` para `vanilla` → detecta `.opencode/` existente → AGENTS.md menciona **ambas** plataformas

---

## Fix 7 — Prompt de plataformas siempre visible en `init`

### Problema

El prompt de selección de plataformas solo se mostraba cuando `results.length === 0`. Después del primer `init` exitoso, el scanner detectaba la plataforma instalada y el prompt desaparecía, impidiendo al usuario configurar plataformas adicionales en ejecuciones posteriores.

### Solución

Eliminar el condicional `if (results.length === 0)` alrededor del prompt. Ahora el menú se muestra **siempre**:

```js
const detectedNames = results.map(r => r.platform);
const makeChoice = (name, value) => ({
  name: name + (detectedNames.includes(value) ? ` ${GREEN}✅${RESET}` : ''),
  value,
});
const { platform } = await inquirer.prompt([{
  type: 'select',
  name: 'platform',
  message: 'Select target platform to configure:',
  choices: [
    makeChoice('OpenCode (.opencode/, AGENTS.md)', 'opencode'),
    makeChoice('VS Code / Copilot (.github/copilot-instructions.md)', 'vscode'),
    makeChoice('Claude Code (CLAUDE.md, .claude/)', 'claude'),
    makeChoice('Antigravity (antigravity.yaml)', 'antigravity'),
    makeChoice('Generic (.agents/ convention)', 'vanilla'),
    new inquirer.Separator(),
    { name: '🚪 Exit — show available commands', value: '__exit__' },
  ],
}]);
if (platform === '__exit__') {
  // muestra lista de comandos disponibles y termina
  return;
}
if (!detectedNames.includes(platform)) {
  results.push(makeSyntheticResult(platform, targetPath));
}
```

### Cambios clave

| Aspecto | Antes | Después |
|---|---|---|
| Condición | Solo si `results.length === 0` | Siempre |
| Marcador | — | `✅` en plataformas ya detectadas |
| Exit | "Exiting. No changes made." | Muestra comandos disponibles (`doctor`, `validate`, `report`, `inject`, `update`, `list-platforms`) |
| Asignación | `results = [synthetic]` (reemplaza) | `results.push(synthetic)` si es nueva plataforma |
| Plataforma ya detectada | No aplicaba | Usa datos reales del scanner |

### Archivos modificados

- `tools_dynamic/index.mjs` — Fix 7: prompt siempre visible

---

*Modelo: opencode/deepseek-v4-flash-free*
