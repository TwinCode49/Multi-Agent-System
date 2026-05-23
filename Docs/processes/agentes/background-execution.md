# Ejecución en Background

> **Estado**: Implementado
> **Última revisión**: 2026

## Propósito

Ejecutar flujos multi-agente de forma asíncrona (fire-and-forget) con capacidad de monitoreo y cancelación.

## Comandos

```bash
# Enviar workflow a ejecución
node tools/agent-workflows/executor.mjs --submit <workflow-name>

# Ver estado de un run
node tools/agent-workflows/executor.mjs --status <run-id>

# Listar runs (opcional: filtrar por estado)
node tools/agent-workflows/executor.mjs --list [status]

# Cancelar un run
node tools/agent-workflows/executor.mjs --cancel <run-id>

# Simular ejecución completa
node tools/agent-workflows/executor.mjs --simulate <run-id>

# Ver cadena de handoffs
node tools/agent-workflows/executor.mjs --handoff <run-id>

# Limpiar runs completados (older than N hours)
node tools/agent-workflows/executor.mjs --clean [24]
```

## Estados de un Run

```
submitted → running → synthesis_pending → completed
                         ├── synthesize → completed
                         ├── skip → completed
                         └── failed → failed
```

---

*Generado por tools-dynamic v2*
