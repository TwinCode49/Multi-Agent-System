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

#### 2.4 — `injector.plan()` con vanilla

`injector.plan()` ya itera `scanResults` y usa `platform.platform` para determinar rutas. Con `makeSyntheticResult('vanilla', ...)`, el `plan()` usará `.agents/agents` y `.agents/skills` correctamente.

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
|---|---|---|
| `tools_dynamic/index.mjs` | 1, 2, 3, 5, D | Estructural: prompts (list), flags, makeSyntheticResult, vanilla, exit |
| `tools_dynamic/commands/inject.mjs` | 3 | Aditivo: nuevos flags |
| `tools_dynamic/core/injector.mjs` | 3, M | Estructural: plan() con componentes separados + multi-platform merge AGENTS.md |
| `tools_dynamic/core/reporter.mjs` | 4, D | Aditivo: mención vanilla + vanilla en printPlatforms |
| `tools_dynamic/tests/injector.test.mjs` | 3 | Aditivo: 3 nuevos tests |

---

## Orden de Implementación Sugerido

1. **Fix 3** (injector.mjs) — Cambio estructural más grande, base para los demás
2. **Fix 2** (index.mjs) — Nueva plataforma vanilla necesita el plan() actualizado primero
3. **Fix 1** (index.mjs) — Independiente, solo toca prompts
4. **Fix 4** (reporter.mjs) — Depende de Fix 2 (menciona --platform vanilla)
5. **Fix 5** (index.mjs) — Cosmético, al final
6. **Tests** — Validar todo junto

---

## Verificación de Retrocompatibilidad

| Escenario | Comportamiento esperado | Estado |
|---|---|---|
| `node tools_dynamic/index.mjs init .` | Sigue igual, pero con opciones separadas + exit | ✅ |
| `node tools_dynamic/index.mjs init . --yes` | Sin cambios | ✅ |
| `node tools_dynamic/index.mjs inject . --config` | Sigue igual (bundle) | ✅ |
| `node tools_dynamic/index.mjs inject . --agents` | Nuevo: solo agentes | ✅ |
| `node tools_dynamic/index.mjs inject . --skills` | Nuevo: solo skills | ✅ |
| `node tools_dynamic/index.mjs inject . --platform-config` | Nuevo: solo platform config | ✅ |
| `node tools_dynamic/index.mjs validate .` | Sin cambios | ✅ |
| `node tools_dynamic/index.mjs update .` | Sin cambios | ✅ |
| `node --test tools_dynamic/tests/*.test.mjs` | 181 tests, todos pasan | ✅ |

---

## Mejora Post-Fix — Option D: List para plataformas

### Problema

El checkbox de plataformas permitía seleccionar múltiples plataformas a la vez, pero en la práctica el usuario casi siempre selecciona una sola. Además, la opción "❌ Cancel / Exit" dentro de un checkbox requiere marcar con espacio + Enter, lo cual no es intuitivo.

### Solución

Cambiar el prompt de plataformas a `type: 'list'` para selección única + Enter directo:

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
results = [makeSyntheticResult(platform, targetPath)];
```

El prompt de componentes se mantiene como `checkbox` con opción `__exit__`.

### Cambio clave

El `Separator` debe colocarse DIRECTO en el array (no como `{name: new inquirer.Separator()}`) porque `@inquirer/prompts` v4+ reconoce `{type: 'separator'}` solo cuando el choice es una instancia directa de `Separator`, no cuando está envuelta en un objeto.

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

*Modelo: opencode/deepseek-v4-flash-free*
