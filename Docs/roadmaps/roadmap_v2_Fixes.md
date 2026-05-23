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
- **Option D**: Prompt de plataformas cambiado de `checkbox` a `list` para selección única + Exit directo
- **Multi-platform AGENTS.md merge**: Al generar AGENTS.md, detecta plataformas existentes en disco y las fusiona con la selección actual, permitiendo ejecutar `init` para múltiples plataformas en runs separados sin perder referencias
- **Limpieza de artefactos residuales**: Se eliminaron archivos de test/template que contaminaban el escaneo (`.github/agents/`, `.github/skills/`, `context-steward.md`, skills inyectadas incorrectamente en agentes existentes)

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
- [x] **2.4** Garantizar que `injector.plan()` maneje vanilla correctamente

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

Cambiar el prompt de selección de plataformas de `checkbox` (múltiple) a `list` (único) para mejorar UX:

- [x] **D.1** Cambiar `type: 'checkbox'` a `type: 'list'` en prompt de plataformas
- [x] **D.2** Mantener `type: 'checkbox'` con `__exit__` en prompt de componentes
- [x] **D.3** Separadores visuales con `inquirer.Separator` directo en array (no envuelto en `{name}`)

## Mejora Post-Fix — Multi-platform AGENTS.md Merge

Al generar AGENTS.md, detectar automáticamente qué plataformas tienen directorios/archivos existentes en disco y fusionarlas:

- [x] **M.1** Detectar `.opencode/`, `.agents/`, `.github/copilot-instructions.md`, `CLAUDE.md`, `antigravity.yaml`
- [x] **M.2** Fusionar plataformas existentes con las del run actual
- [x] **M.3** Agregar `vanilla` a `generateCombinedAgentsMd()` (AI-facing files lista `.agents`)

---

- [x] **V.1** `init` interactivo — opción Exit funciona en cada paso
- [x] **V.2** `init --yes --platform vanilla` — crea estructura `.agents/`
- [x] **V.3** `inject --agents` — solo inyecta agentes, no skills
- [x] **V.4** `inject --skills` — solo inyecta skills, no agentes
- [x] **V.5** `inject --config` — bundle completo sigue funcionando
- [x] **V.6** 181 tests siguen pasando

---

## Métricas de Éxito

| Métrica | Objetivo | Actual |
|---|---|---|
| Tests totales | ≥ 178 | 181 |
| Tests pasando | 100% | 100% |
| Fixes completados | 5/5 | **5/5** |
| Mejoras post-fix | — | **2** (Option D + Multi-platform merge) |
| Nuevas opciones de plataforma | 1 (vanilla) | 1 |
| Opciones de salida en init | ≥ 2 | 2 |
| Retrocompatibilidad | Sin breaks | ✅ |
| Artefactos residuales eliminados | — | 6 directorios, 3 archivos |
| Agentes con skills correctas | 7/9 | 7/9 |
| Skills referenciadas | 6/8 | 6/8 |

---

*Modelo: opencode/deepseek-v4-flash-free*
