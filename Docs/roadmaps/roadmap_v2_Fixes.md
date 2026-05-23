# v2.0 — Fixes Roadmap

> **Versión**: 2.1
> **Estado**: ✅ Completado
> **Última revisión**: 2026-05-23
> **Plan de implementación**: `Docs/FASE-2-Fixes.md`

## Visión General

Corregir problemas detectados post-estabilización en el flujo interactivo de `tools_dynamic`:
1. Falta de opción de salida/cancelación en `init` interactivo
2. Ausencia de plataforma "vanilla" (convención genérica `.agents/`)
3. Bundling forzado de agents + skills en `config`
4. Omisión de la opción vanilla en `doctor`/`analyze`
5. Help text desactualizado

### Mejoras adicionales post-implementación
- **Option D**: Prompt de plataformas cambiado de `checkbox` a `select` para selección única + Exit directo
- **Multi-platform AGENTS.md merge**: Al generar AGENTS.md, detecta plataformas existentes en disco y las fusiona con la selección actual, permitiendo ejecutar `init` para múltiples plataformas en runs separados sin perder referencias
- **Limpieza de artefactos residuales**: Se eliminaron archivos de test/template que contaminaban el escaneo (`.github/agents/`, `.github/skills/`, `context-steward.md`, skills inyectadas incorrectamente en agentes existentes)
- **Fix 6 — Inquirer v13**: `type: 'list'` no existe en inquirer v13; se usó `type: 'select'` (el único tipo registrado para menús)
- **UX — Comandos en carpeta vacía**: `doctor` ya no muestra falso positivo "No issues found"; `analyze` sugiere `init` en vez de `list-platforms`; `init` eliminó `printAnalysis()` redundante
- **Fix 7 — Prompt siempre visible**: El prompt de plataformas en `init` ahora se muestra siempre, con marcador `✅` para plataformas detectadas y `__exit__` con ayuda de comandos
- **VanillaScanner**: Nuevo scanner dedicado para detectar `.agents/` automáticamente; antigravity endurecido para no detectar falsamente vanilla
- **Model handling**: Sistema de modelo especializado con `model: auto` en templates, extracción en scanner, `defaultModel` configurable, y alertas en doctor/analyze

---

## Fix 1 — Salida en `init` interactivo

Agregar opción explícita "❌ Cancel / Exit" en los prompts de selección de plataformas y componentes. Si el usuario la selecciona, el comando termina inmediatamente sin modificar nada.

- [x] **1.1** Agregar opción `__exit__` en prompt de plataformas
- [x] **1.2** Agregar opción `__exit__` en prompt de componentes
- [x] **1.3** Manejar `__exit__` con mensaje claro y `return`

---

## Fix 2 — Plataforma "vanilla" (`.agents/`)

Agregar `vanilla` como 5ª plataforma sintética que usa la convención genérica `.agents/agents/` y `.agents/skills/`.

- [x] **2.1** Agregar `vanilla` a `makeSyntheticResult()` en `index.mjs`
- [x] **2.2** Agregar `vanilla` a la lista de plataformas en `init` interactivo
- [x] **2.3** Agregar `vanilla` a la descripción de `--platform`
- [x] **2.4** Agregar case `vanilla` en `resolveVariablesFromScan()` — los paths ahora son `.agents/` en vez de `.opencode/`

---

## Fix 3 — Separar `config` en agents / skills / platformConfig

Desacoplar la opción `config` en tres componentes independientes para permitir inyección granular.

- [x] **3.1** Separar checkbox "Agents + Skills + Config" en tres opciones individuales en `init`
- [x] **3.2** Agregar flags `--agents`, `--skills`, `--platform-config` en `inject`
- [x] **3.3** Modificar `injector.plan()` para procesar `agents`, `skills`, `platformConfig` como componentes separados
- [x] **3.4** Mantener `--config` como bundle retrocompatible
- [x] **3.5** Tests: `plan()` con componentes separados
- [x] **3.6** Tests: `--config` bundle sigue funcionando

---

## Fix 4 — Vanilla en doctor/analyze

Cuando no se detectan plataformas, sugerir explícitamente la opción `.agents/` como alternativa genérica.

- [x] **4.1** Actualizar `reporter.mjs` (`printAnalysis`) para mencionar `--platform vanilla`
- [x] **4.2** Actualizar `doctor` output para sugerir vanilla

---

## Fix 5 — Help text desactualizado

Actualizar descripciones de flags para reflejar todas las plataformas disponibles.

- [x] **5.1** Actualizar `--platform` description en `index.mjs`

---

## Mejora Post-Fix — Option D

Cambiar el prompt de selección de plataformas de `checkbox` (múltiple) a `select` (único) para mejorar UX:

- [x] **D.1** Cambiar `type: 'checkbox'` a `type: 'select'` en prompt de plataformas
- [x] **D.2** Mantener `type: 'checkbox'` con `__exit__` en prompt de componentes
- [x] **D.3** Separadores visuales con `inquirer.Separator` directo en array (no envuelto en `{name}`)

## Fix 6 — Inquirer v13: `type: 'list'` no existe

`inquirer` v13 migró a `@inquirer/prompts` y solo reconoce tipos registrados (`select`, `checkbox`, `confirm`, etc.). `'list'` no está registrado y falla silenciosamente a `type: 'input'`, mostrando un campo de texto vacío en vez del menú navegable.

- [x] **6.1** Cambiar `type: 'list'` a `type: 'select'` en prompt de plataformas (`index.mjs`)

## Mejora Post-Fix — Multi-platform AGENTS.md Merge

Al generar AGENTS.md, detectar automáticamente qué plataformas tienen directorios/archivos existentes en disco y fusionarlas:

- [x] **M.1** Detectar `.opencode/`, `.agents/`, `.github/copilot-instructions.md`, `CLAUDE.md`, `antigravity.yaml`
- [x] **M.2** Fusionar plataformas existentes con las del run actual
- [x] **M.3** Agregar `vanilla` a `generateCombinedAgentsMd()` (AI-facing files lista `.agents`)

## Fix 7 — Prompt de plataformas siempre visible en `init`

El prompt de plataformas ahora se muestra **siempre** (sin condicional), permitiendo al usuario agregar múltiples plataformas en runs separados:

- [x] **7.1** Eliminar `if (results.length === 0)` alrededor del prompt
- [x] **7.2** Marcar plataformas detectadas con `✅`
- [x] **7.3** `__exit__` muestra comandos disponibles en vez de solo "Exiting"
- [x] **7.4** Usar `results.push()` (acumular) en vez de `results = [synthetic]` (reemplazar)
- [x] **7.5** Si la plataforma ya está detectada, usar datos reales del scanner (no sintéticos)

---

## Mejora Post-Fix — VanillaScanner

Vanilla ahora tiene scanner propio para detección automática de `.agents/`:

- [x] **Vs.1** Crear `VanillaScanner` — detecta `.agents/`, escanea `.agents/agents/` y `.agents/skills/`
- [x] **Vs.2** Registrar en `scanner.mjs` — lista de scanners + prioridad `scanPrimary`
- [x] **Vs.3** Endurecer `AntigravityScanner.detect()` — eliminar `.agents/agents`, `.agents/skills`, `.agent/agents`, `.agent/skills`
- [x] **Vs.4** Tests: 10 tests para VanillaScanner + fixture `.agents/` en vanilla-project
- [x] **Vs.5** Actualizar `scanner.test.mjs` — vanilla ahora se detecta correctamente

## Mejora Post-Fix — Model handling

Sistema de modelo especializado con `model: auto` y fallback a default:

- [x] **Md.1** `model: auto` en templates de read-only agents (code-reviewer, security-reviewer)
- [x] **Md.2** `model` opcional en `AgentDef` (`types.mjs`)
- [x] **Md.3** Scanner extrae `model` del frontmatter; `auto` → `undefined` (parser + 3 scanners)
- [x] **Md.4** `defaultModel` en `opencode.json` template
- [x] **Md.5** `resolveVariablesFromScan()` lee `defaultModel` de `opencode.json` (fallback `gpt-4o`)
- [x] **Md.6** `reporter.mjs`: analyze muestra `[model: X]`, diagnose alerta si read-only sin modelo
- [x] **Md.7** `_platformToJSON()` incluye `model` en salida

---

- [x] **V.1** `init` interactivo — opción Exit funciona en cada paso
- [x] **V.2** `init --yes --platform vanilla` — crea estructura `.agents/`
- [x] **V.3** `inject --agents` — solo inyecta agentes, no skills
- [x] **V.4** `inject --skills` — solo inyecta skills, no agentes
- [x] **V.5** `inject --config` — bundle completo sigue funcionando
- [x] **V.6** 190 tests siguen pasando
- [x] **V.7** `init` en carpeta con plataforma existente — prompt visible con ✅
- [x] **V.8** `init` con Exit — muestra lista de comandos disponibles
- [x] **V.9** `init` en carpeta vanilla — muestra `Generic ✅` con agentes/skills detectados
- [x] **V.10** `doctor` alerta si read-only agent no tiene modelo especializado
- [x] **V.11** `analyze` muestra modelo de cada agente (`[model: default]` o `[model: nombre]`)

---

## Métricas de Éxito

| Métrica | Objetivo | Actual |
|---|---|---|
| Tests totales | ≥ 178 | **190** |
| Tests pasando | 100% | 100% |
| Fixes completados | 5/5 | **7/7** |
| Mejoras post-fix | — | **8** (Option D, Multi-platform merge, Fix 6, UX empty dir, Fix 7, VanillaScanner, Model handling, Antigravity tightening) |
| Nuevas opciones de plataforma | 1 (vanilla) | 1 |
| Opciones de salida en init | ≥ 2 | 2 (plataforma + componentes) |
| Retrocompatibilidad | Sin breaks | ✅ |
| Artefactos residuales eliminados | — | 6 directorios, 3 archivos |
| Agentes con skills correctas | 7/9 | 7/9 |
| Skills referenciadas | 6/8 | 6/8 |
| Prompts de plataforma funcionales | 1/1 | ✅ (`select` en vez de `list`) |
| Comandos con UX correcta en vacío | 3/3 | ✅ (doctor, analyze, init) |
| Prompt plataforma visible en 2do init | siempre | ✅ |
| Plataforma vanilla detectada automáticamente | — | ✅ (VanillaScanner) |
| Antigravity sin falsos positivos con vanilla | — | ✅ (detect endurecido) |
| Modelo especializado configurable por agente | — | ✅ (`model: auto` o concreto) |
| Doctor alerta read-only sin modelo | — | ✅ |

---

*Modelo: opencode/deepseek-v4-flash-free*
