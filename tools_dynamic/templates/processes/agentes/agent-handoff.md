# Handoff entre Agentes

> **Estado**: Implementado
> **Última revisión**: {{year}}

## Propósito

Pasar contexto estructurado entre pasos de un workflow, permitiendo que cada agente reciba el output relevante del paso anterior.

## Estructura del Handoff

```json
{
  "from_step": "api_design",
  "from_agent": "database-specialist",
  "status": "completed",
  "context": {
    "received_from": [],
    "output_summary": "...",
    "artifacts": ["schema.prisma", "migrations/"],
    "risks": [{ "severity": "medium", "description": "..." }],
    "decisions": [{ "title": "...", "rationale": "..." }]
  },
  "timestamp": "..."
}
```

## Cadena de Handoff

```bash
node tools/agent-workflows/executor.mjs --handoff <run-id>
```

## Síntesis por Orchestrator

Cuando el workflow tiene `synthesizer` habilitado, el Orchestrator recolecta todos los handoffs y:

1. Mergea outputs de múltiples agentes
2. Resuelve conflictos de severidad entre riesgos reportados
3. Produce un reporte unificado con prioridades y decisiones escaladas

---

*Generado por tools-dynamic v2*
