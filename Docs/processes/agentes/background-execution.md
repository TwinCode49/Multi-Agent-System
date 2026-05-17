# Ejecución en Background (Fire-and-Forget)

> **Estado**: Implementado
> **Herramienta**: `tools/agent-workflows/executor.mjs`
> **Última revisión**: 2026-05-16

## 1. Propósito

Permite ejecutar flujos de trabajo multi-agente de forma asíncrona: el usuario envía un workflow y recibe un ID inmediatamente, sin esperar a que termine. Puede consultar el estado más tarde, cancelar la ejecución, o listar todas las ejecuciones activas.

## 2. Modelo de Estados

Cada ejecución (run) pasa por los siguientes estados:

```
submitted → running → completed
               ↓          ↓
            failed    cancelled
```

| Estado | Significado |
|---|---|
| `submitted` | Workflow validado y aceptado, esperando ejecución |
| `running` | Al menos un paso está en ejecución |
| `completed` | Todos los pasos terminaron exitosamente |
| `failed` | Error irrecuperable (deadlock, paso fallido) |
| `cancelled` | Usuario canceló la ejecución |

## 3. API de la Herramienta

### 3.1 Subir un workflow

```bash
node tools/agent-workflows/executor.mjs --submit <workflow-name>
```

Retorna un `runId` de 8 caracteres. El runner valida el workflow y genera el plan de ejecución antes de registrar el run.

### 3.2 Consultar estado

```bash
node tools/agent-workflows/executor.mjs --status <run-id>
```

Muestra: ID, workflow, estado, progreso (`currentStep/totalSteps`), timestamps, y estado de cada paso.

### 3.3 Listar ejecuciones

```bash
node tools/agent-workflows/executor.mjs --list [status]
```

Sin filtro: lista todos los runs ordenados por fecha descendente. Con filtro: solo runs en ese estado (`submitted`, `running`, `completed`, `failed`, `cancelled`).

### 3.4 Cancelar

```bash
node tools/agent-workflows/executor.mjs --cancel <run-id>
```

Solo funciona si el run está en `submitted` o `running`. Un run cancelado no se puede reanudar.

### 3.5 Simular ejecución

```bash
node tools/agent-workflows/executor.mjs --simulate <run-id>
```

Procesa todos los pasos del plan en orden automáticamente (sin invocar agentes reales). Útil para testing y demostración.

### 3.6 Avanzar manualmente

```bash
node tools/agent-workflows/executor.mjs --advance <run-id>
node tools/agent-workflows/executor.mjs --complete-step <run-id> <step-id>
```

Permite control paso a paso: `--advance` mueve los pasos listos de `pending` a `running`; `--complete-step` marca un paso como `completed`.

### 3.7 Limpiar runs antiguos

```bash
node tools/agent-workflows/executor.mjs --clean [hours]
```

Elimina runs completados/cancelados más viejos que N horas (default: 24). No afecta runs en `submitted`, `running`, o `failed`.

## 4. Formato del Archivo de Run

Cada run se persiste como JSON en `tools/agent-workflows/runs/<runId>.json`:

```json
{
  "id": "a1b2c3d4",
  "workflow": "docs-generation",
  "status": "running",
  "plan": [
    { "step_id": "api_inventory", "agent": "code-reviewer", "parallel": false }
  ],
  "currentStep": 1,
  "totalSteps": 4,
  "steps": [
    { "step_id": "api_inventory", "agent": "code-reviewer", "status": "completed", "startedAt": "...", "completedAt": "..." }
  ],
  "submittedAt": "2026-05-16T...",
  "startedAt": "2026-05-16T...",
  "completedAt": null,
  "error": null
}
```

## 5. Integración con el Runtimer

El executor está diseñado para reemplazar la simulación con ejecución real cuando los plugins externos estén disponibles:

| Componente Actual | Reemplazo Futuro |
|---|---|
| `--simulate` avanza pasos sin delay | Plugin OMO invoca agentes reales |
| `--advance` / `--complete-step` manual | `ParallelExecutor` automático |
| Archivos JSON locales en `runs/` | Base de datos o cola de mensajes |

Ver `Docs/processes/deploy/parallel-execution.md` para los requerimientos del plugin de ejecución paralela.

## 6. Estados Inválidos y Edge Cases

| Situación | Comportamiento |
|---|---|
| Submit de workflow inexistente | Error: "Workflow not found" |
| Cancelar run ya completado | Error: "Cannot cancel run in completed status" |
| Deadlock (dependencias circulares) | Run pasa a `failed` con error "Deadlock" |
| Paso ya completado al llamar `--complete-step` | Error: "Step is already completed" |
| `--clean 0` | Elimina todos los runs completados/cancelados (útil para limpieza total) |

## 7. Problemas Conocidos

- La ejecución real de agentes no está implementada (requiere plugin externo OMO/council)
- El estado de los runs se persiste en archivos JSON locales — no hay concurrencia ni locks
- Node.js 24: evitar `Set.has()` en callbacks `.filter()` sin side effects (ver `multi-agent-workflows.md` sección 5)

## 8. Clasificación

- **Categoría**: Agentes
- **Fase**: 4.2
- **Depende de**: Fase 4.1 (workflows multi-agente), definiciones en `tools/agent-workflows/definitions/`

## 9. Referencias

- Herramienta: `tools/agent-workflows/executor.mjs`
- Workflows: `tools/agent-workflows/definitions/`
- Ejecución paralela (plugin externo): `Docs/processes/deploy/parallel-execution.md`
- Flujos multi-agente: `Docs/processes/agentes/multi-agent-workflows.md`
- Roadmap v1: `Docs/roadmaps/roadmap_v1.md`

---

*Modelo: opencode/deepseek-v4-flash-free*
