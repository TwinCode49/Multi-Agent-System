# Procesos del Proyecto

Catálogo central de todos los procesos definidos para el proyecto. Cada proceso documenta cómo ejecutar, mantener o decidir sobre un aspecto específico del sistema.

## Convención

Cada punto del roadmap que se **implementa** o se **omite** debe generar o actualizar un archivo en `Docs/processes/<categoria>/`. Los procesos omitidos se documentan con los requerimientos completos para retomarlos en el futuro.

### Ciclo de Vida de un Proceso

```
[Roadmap item] → [Docs/processes/<categoria>/<name>.md] → [Implementación] → [Mantenimiento]
                                                                  │
                                                       [Si se omite → dejar requerimientos]
```

### Plantilla de Proceso

Cada proceso debe incluir:

```markdown
# Nombre del Proceso

> **Estado**: [Implementado | Omitido | Pendiente]
> **Última revisión**: YYYY-MM-DD

## 1. Propósito
## 2. Requerimientos (si omitido)
## 3. Procedimiento
## 4. Clasificación
## 5. Referencias
```

---

## Catálogo de Procesos

### ⚙️ Configuración — `Docs/processes/configuracion/`

| Proceso | Archivo | Estado | Descripción |
|---|---|---|---|
| Configuración inicial del proyecto | `opencode.json`, `AGENTS.md` | Implementado (Fase 1) | Setup de skills paths, agent registry, dispatch matrix |

### 🧠 Agentes — `Docs/processes/agentes/`

| Proceso | Archivo | Estado | Descripción |
|---|---|---|---|
| Definición de agentes | `.opencode/agents/*.md` | Implementado (Fase 3.1) | Prompts expandidos con responsibilities, behavior rules, handoff protocol |
| Orquestación y dispatch | `AGENTS.md`, `.opencode/agents/orchestrator.md` | Implementado (Fase 1, 3.1) | Keyword-to-agent dispatch matrix, reglas de routing |
| Flujos multi-agente | `Docs/processes/agentes/multi-agent-workflows.md` | Implementado (Fase 4.1) | Workflows JSON con pasos, dependencias, validación y plan de ejecución |
| Ejecución en background | `Docs/processes/agentes/background-execution.md` | Implementado (Fase 4.2) | Fire-and-forget: submit async, status polling, cancel, simulate |
| Handoff entre agentes | `Docs/processes/agentes/agent-handoff.md` | Implementado (Fase 4.3) | Contexto estructurado entre pasos, cadena de handoff, recepción y distribución |
| Métricas de rendimiento | `Docs/processes/agentes/performance-metrics.md` | Implementado (Fase 3.4) | 3 dimensiones (estructurales, funcionales, sistema), tool automatizado |

### 📦 Skills — `Docs/processes/skills/`

| Proceso | Archivo | Estado | Descripción |
|---|---|---|---|
| Creación de skills | `.opencode/skills/<name>/SKILL.md` (estructura) | Implementado (Fase 2) | 8 skills implementados siguiendo plantilla unificada |
| Revisión de skills | `Docs/processes/skills/skill-review.md` | Implementado (Fase 2) | Roles, criterios, checklist, ciclo de vida del skill |
| Checklist de revisión | `Docs/processes/skills/SKILL_REVIEW_CHECKLIST.md` | Implementado (Fase 2) | Checklist imprimible con 5 secciones y ~25 ítems |

### 🧪 Testing — `Docs/processes/testing/`

| Proceso | Archivo | Estado | Descripción |
|---|---|---|---|
| Testing de agentes y skills | `Docs/processes/testing/agent-testing.md` | Implementado (Fase 3.3) | Framework de validación automatizada, 144 tests |
| Test runner | `tools/agent-testing/run.mjs` | Implementado (Fase 3.3) | Script Node.js ESM, verifica estructura y contenido |
| Casos de prueba | `tools/agent-testing/cases/*.json` | Implementado (Fase 3.3) | 9 casos, uno por agente |

### 🚀 Deploy / Infra — `Docs/processes/deploy/`

| Proceso | Archivo | Estado | Descripción |
|---|---|---|---|
| Publicación en skills.sh | *(pendiente)* | [~] Omitido | No publicado aún |
| Plugin de ejecución paralela | `Docs/processes/deploy/parallel-execution.md` | [~] Omitido | Requerimientos documentados para implementación futura |

### 📐 Arquitectura — `Docs/processes/arquitectura/`

| Proceso | Archivo | Estado | Descripción |
|---|---|---|---|
| Estándar de idioma | `AGENTS.md`, `Docs/` | Implementado (Fase 1) | Inglés para IA, Español para documentación de desarrollo |
| Estructura de directorios | Estructura del proyecto | Implementado (Fase 1) | `.opencode/` y `.github/` para runtime; `agents/` y `skills/` raíz como referencia |

---

## Mapa de Archivos

```
Docs/processes/
├── README.md                       ← Este archivo — catálogo central
├── configuracion/                  ← ⚙️ (pendiente de procesos futuros)
├── agentes/                        ← 🧠 (pendiente de procesos futuros)
├── skills/                         ← 📦
│   ├── skill-review.md             ← Proceso de revisión (implementado)
│   └── SKILL_REVIEW_CHECKLIST.md   ← Checklist (implementado)
├── testing/                        ← 🧪
│   └── agent-testing.md            ← Proceso de testing (implementado)
├── deploy/                         ← 🚀
│   └── parallel-execution.md       ← Plugin paralelo (omitido)
└── arquitectura/                   ← 📐 (pendiente de procesos futuros)

tools/agent-testing/                ← Implementación del testing
├── run.mjs                         ← Test runner
├── cases/                          ← Casos de prueba
└── README.md                       ← Documentación técnica

tools/agent-workflows/              ← Implementación de flujos multi-agente
├── run.mjs                         ← Validador y generador de planes
├── executor.mjs                    ← Ejecutor en background (submit, status, simulate, handoff)
├── wf-runner.cjs                   ← Validador CJS (compatibilidad)
├── definitions/                    ← 3 workflows definidos en JSON
└── runs/                           ← Estado de ejecuciones activas/completadas

.opencode/agents/                   ← Implementación de agentes
├── orchestrator.md
├── database-specialist.md
└── ... (8 secundarios)

.opencode/skills/                   ← Implementación de skills
├── documentation/
├── frontend/
└── ... (8 skills)
```

## Cómo Añadir un Nuevo Proceso

1. Crear `Docs/processes/<categoria>/<nombre>.md` siguiendo la plantilla
2. Añadir entrada en el catálogo (este archivo) en la categoría correspondiente
3. Actualizar `Docs/LOG.md`
4. Si el proceso tiene implementación práctica (scripts, herramientas), ubicarla en `tools/<nombre>/`

## Cómo Omitir un Proceso

1. Crear `Docs/processes/<categoria>/<nombre>.md` con:
   - Estado: Omitido
   - Requerimientos completos para implementación futura
   - Prerrequisitos, opciones, métricas de éxito
2. Marcar en el roadmap como `[~]` con referencia al documento
3. Añadir entrada en el catálogo (este archivo) con estado Omitido

---
*Modelo: opencode/deepseek-v4-flash-free*
