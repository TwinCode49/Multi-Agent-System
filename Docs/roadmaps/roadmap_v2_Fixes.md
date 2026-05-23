# v2.0 — Fixes Roadmap

> **Versión**: 2.0
> **Estado**: 🟡 En planificación
> **Última revisión**: 2026-05-21
> **Plan de implementación**: `Docs/FASE-2-Fixes.md`

## Visión General

Corregir problemas detectados post-estabilización en el flujo interactivo de `tools_dynamic`:
1. Falta de opción de salida/cancelación en `init` interactivo
2. Ausencia de plataforma "vanilla" (convención genérica `.agents/`)
3. Bundling forzado de agents + skills en `config`
4. Omisión de la opción vanilla en `doctor`/`analyze`
5. Help text desactualizado

---

## Fix 1 — Salida en `init` interactivo

Agregar opción explícita "❌ Cancel / Exit" en los prompts de selección de plataformas y componentes. Si el usuario la selecciona, el comando termina inmediatamente sin modificar nada.

- [ ] **1.1** Agregar opción `__exit__` en prompt de plataformas
- [ ] **1.2** Agregar opción `__exit__` en prompt de componentes
- [ ] **1.3** Manejar `__exit__` con mensaje claro y `return`

---

## Fix 2 — Plataforma "vanilla" (`.agents/`)

Agregar `vanilla` como 5ª plataforma sintética que usa la convención genérica `.agents/agents/` y `.agents/skills/`.

- [ ] **2.1** Agregar `vanilla` a `makeSyntheticResult()` en `index.mjs`
- [ ] **2.2** Agregar `vanilla` a la lista de plataformas en `init` interactivo
- [ ] **2.3** Agregar `vanilla` a la descripción de `--platform`
- [ ] **2.4** Garantizar que `injector.plan()` maneje vanilla correctamente

---

## Fix 3 — Separar `config` en agents / skills / platformConfig

Desacoplar la opción `config` en tres componentes independientes para permitir inyección granular.

- [ ] **3.1** Separar checkbox "Agents + Skills + Config" en tres opciones individuales en `init`
- [ ] **3.2** Agregar flags `--agents`, `--skills`, `--platform-config` en `inject`
- [ ] **3.3** Modificar `injector.plan()` para procesar `agents`, `skills`, `platformConfig` como componentes separados
- [ ] **3.4** Mantener `--config` como bundle retrocompatible
- [ ] **3.5** Tests: `plan()` con componentes separados
- [ ] **3.6** Tests: `--config` bundle sigue funcionando

---

## Fix 4 — Vanilla en doctor/analyze

Cuando no se detectan plataformas, sugerir explícitamente la opción `.agents/` como alternativa genérica.

- [ ] **4.1** Actualizar `reporter.mjs` (`printAnalysis`) para mencionar `--platform vanilla`
- [ ] **4.2** Actualizar `doctor` output para sugerir vanilla

---

## Fix 5 — Help text desactualizado

Actualizar descripciones de flags para reflejar todas las plataformas disponibles.

- [ ] **5.1** Actualizar `--platform` description en `index.mjs`

---

## Verificación Final

- [ ] **V.1** `init` interactivo — opción Exit funciona en cada paso
- [ ] **V.2** `init --yes --platform vanilla` — crea estructura `.agents/`
- [ ] **V.3** `inject --agents` — solo inyecta agentes, no skills
- [ ] **V.4** `inject --skills` — solo inyecta skills, no agentes
- [ ] **V.5** `inject --config` — bundle completo sigue funcionando
- [ ] **V.6** 178 tests siguen pasando

---

## Métricas de Éxito

| Métrica | Objetivo | Actual |
|---|---|---|
| Tests totales | ≥ 178 | 178 |
| Tests pasando | 100% | 100% |
| Fixes completados | 5/5 | 0/5 |
| Nuevas opciones de plataforma | 1 (vanilla) | 0 |
| Opciones de salida en init | ≥ 2 | 0 |
| Retrocompatibilidad | Sin breaks | ✅ |

---

*Modelo: opencode/deepseek-v4-flash-free*
