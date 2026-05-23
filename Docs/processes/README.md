# Procesos del Proyecto

Catálogo central de todos los procesos definidos para el proyecto ..

## Convención

Cada punto del roadmap que se implementa u omite debe generar o actualizar un archivo en `Docs/processes/<categoria>/`.

### Catálogo de Procesos

### 🧠 Agentes — `Docs/processes/agentes/`

| Proceso | Archivo | Estado | Descripción |
|---|---|---|---|
| Flujos multi-agente | `Docs/processes/agentes/multi-agent-workflows.md` | Implementado | Workflows JSON con pasos, dependencias, validación |
| Ejecución en background | `Docs/processes/agentes/background-execution.md` | Implementado | Fire-and-forget: submit, status, cancel |
| Handoff entre agentes | `Docs/processes/agentes/agent-handoff.md` | Implementado | Contexto estructurado entre pasos |
| Métricas de rendimiento | `Docs/processes/agentes/performance-metrics.md` | Implementado | 3 dimensiones de evaluación |

## Cómo Añadir un Nuevo Proceso

1. Crear `Docs/processes/<categoria>/<nombre>.md`
2. Añadir entrada en este catálogo
3. Si tiene implementación práctica, ubicarla en `tools/<nombre>/`

---

*Generado por tools-dynamic v2*
