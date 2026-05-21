# Protocolo de Handoff entre Agentes

> **Estado**: Implementado
> **Última revisión**: 2026-05-16

## 1. Propósito

Definir el protocolo formal de transferencia de contexto entre agentes en un flujo de trabajo multi-agente. El handoff asegura que cuando un agente completa su tarea, el siguiente agente reciba todo el contexto necesario para continuar sin pérdida de información.

## 2. Estructura de Datos del Handoff

Cada handoff representa una transferencia de contexto desde un agente completado hacia el orquestador, que luego lo distribuye al siguiente agente en la cadena.

### 2.1 Formato

```json
{
  "from_step": "string — ID del paso completado",
  "from_agent": "string — agente que completó el paso",
  "status": "completed|failed|partial",
  "context": {
    "received_from": [
      { "from": "string — step_id de origen", "output": "string — resumen del output recibido" }
    ],
    "output_summary": "string — resumen de lo que produjo este paso",
    "artifacts": ["string — archivos creados o modificados"],
    "risks": [
      { "severity": "high|medium|low", "description": "string" }
    ],
    "decisions": [
      { "title": "string", "rationale": "string" }
    ]
  },
  "timestamp": "ISO 8601"
}
```

### 2.2 Campos del Contexto

| Campo | Obligatorio | Descripción |
|---|---|---|
| `received_from` | No | Lista de handoffs previos que este paso consumió como entrada |
| `output_summary` | Sí | Resumen legible de lo que produjo el paso |
| `artifacts` | No | Archivos creados o modificados durante el paso |
| `risks` | No | Riesgos identificados durante la ejecución |
| `decisions` | No | Decisiones de diseño o implementación tomadas |

## 3. Ciclo de Vida del Handoff

```
workflow submit
    │
    ▼
  Step A (pending) ──advance──▶ Step A (running)
                                    │
                         completeStep──▶ Step A (completed)
                                    │
                                    ▼
                              buildHandoffContext()
                                    │
                                    ▼
                          handoff almacenado en run
                          (from_step: "A")
                                    │
                                    ▼
    Step B (pending) ──advance──▶ (dependencias revisadas)
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                    depends_on A            no depends_on
                          │                       │
                    recibe handoff          ejecuta sin
                    de A como input         contexto previo
                          │                       │
                          ▼                       ▼
                    Step B (running) ──→ Step B (completed)
```

## 4. Implementación en el Executor

El handoff está integrado en `tools/agent-workflows/executor.mjs`.

### 4.1 Comando `--handoff`

```bash
node tools/agent-workflows/executor.mjs --handoff <run-id>
```

Muestra la cadena completa de handoffs para un run completado, incluyendo:
- Cada paso con su estado (✓)
- Output summary de cada paso
- Contexto recibido desde pasos previos
- Artefactos, riesgos y decisiones asociados

### 4.2 Generación Automática

- `completeStep()`: cuando un paso se completa manualmente, `buildHandoffContext()` genera el handoff automáticamente, incluyendo los handoffs recibidos de pasos de los que depende.
- `--simulate`: genera handoffs con mock data realista para cada paso definido.

### 4.3 Formato de Almacenamiento

Los handoffs se almacenan en dos lugares dentro del archivo JSON del run:

```json
{
  "steps": [
    { "step_id": "api_inventory", "handoff": { ... } }
  ],
  "handoffs": [
    { "from_step": "api_inventory", "from_agent": "code-reviewer", ... }
  ]
}
```

- `steps[].handoff`: handoff individual por paso
- `handoffs[]`: colección completa de handoffs en orden de ejecución

## 5. Handoff en las Definiciones de Agentes

### 5.1 Agentes Secundarios (`.opencode/agents/*.md`)

Cada agente tiene una sección `## Handoff Protocol` estandarizada con:

| Sección | Descripción |
|---|---|
| **Context Expected** | Qué contexto espera recibir del paso anterior |
| **Reporting** | Qué información reporta al orquestador al completar |

### 5.2 Orquestador (`.opencode/agents/orchestrator.md`)

El orquestador ahora incluye una sección completa de `## Handoff Protocol` que define:

- **Receiving Handoffs**: cómo recibe reportes de agentes secundarios
- **Distributing Handoffs**: cómo mergea contexto y enriquece prompts para el siguiente agente
- **Parallel Handoff Coordination**: cómo recolecta y resuelve conflictos entre múltiples handoffs paralelos
- **Error Handling**: qué hacer cuando un agente falla o devuelve resultado parcial
- **Orchestrator Synthesis**: cómo el orquestador recolecta todos los handoffs de un workflow completo y genera un synthesis handoff final con conflictos resueltos (ver Phase 0, `FASE-2.md`)

## 6. Synthesis Handoff

Cuando un workflow define un `synthesizer`, al completar todos los pasos regulares el orquestador genera un synthesis handoff especial:

```json
{
  "from_step": "__synthesis__",
  "from_agent": "orchestrator",
  "status": "completed",
  "context": {
    "received_from": [
      { "from": "code_review", "output": "Found 3 blockers...", "risks": [...], "decisions": [...] },
      { "from": "security_review", "output": "Found 1 high...", "risks": [...], "decisions": [...] }
    ],
    "output_summary": "Synthesized N inputs: [agent summaries]",
    "artifacts": ["all artifacts from all steps"],
    "risks": {
      "all": [/* all risks flattened */],
      "unique": [/* deduplicated risks */],
      "conflicts": [/* auto-resolved conflicts with resolution */],
      "summary": "Found X unique risks, Y conflicts auto-resolved"
    },
    "decisions": [/* all decisions from all steps */]
  }
}
```

## 7. Edge Cases

| Situación | Comportamiento |
|---|---|
| Handoff desde paso fallido | Contexto marcado con `status: "failed"`, el paso no continúa la cadena |
| Múltiples dependencias paralelas | `received_from` contiene handoffs de todos los pasos previos |
| Paso sin dependencias | `received_from` es `[]` — arranca sin contexto previo |
| Handoff de paso no ejecutado | No se genera handoff; el paso queda en `pending` |
| Run sin handoffs (no completado) | `--handoff` muestra mensaje: "No handoff data — run may not be completed yet" |
| Run en `synthesis_pending` | `--handoff` muestra todos los handoffs de pasos completados más indicador de síntesis pendiente |
| Synthesis handoff fallido | El orquestador marca el synthesis step como `failed`; el run completo queda en `failed` |

## 8. Clasificación

- **Categoría**: Agentes
- **Fase**: 4.3 (core), Phase 0 (synthesis)
- **Depende de**: Fase 4.1 (workflows multi-agente), Fase 4.2 (ejecución background)

## 9. Referencias

- Herramienta: `tools/agent-workflows/executor.mjs` (comando `--handoff`)
- Definiciones de agentes: `.opencode/agents/*.md` (sección `## Handoff Protocol`)
- Orquestador: `.opencode/agents/orchestrator.md` (sección `## Handoff Protocol`)
- Flujos multi-agente: `Docs/processes/agentes/multi-agent-workflows.md`
- Ejecución background: `Docs/processes/agentes/background-execution.md`
- Roadmap v1: `Docs/roadmaps/roadmap_v1.md`

---

*Modelo: opencode/deepseek-v4-flash-free*
