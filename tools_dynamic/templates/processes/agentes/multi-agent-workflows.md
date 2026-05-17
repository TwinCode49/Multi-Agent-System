# Flujos Multi-Agente

> **Estado**: Implementado
> **Última revisión**: {{year}}

## Propósito

Coordinar múltiples agentes especializados en un flujo de trabajo estructurado con pasos secuenciales y paralelos.

## Estructura

Los workflows se definen en `tools/agent-workflows/definitions/*.json` con el siguiente esquema:

```json
{
  "name": "workflow-name",
  "version": "1.0",
  "description": "...",
  "trigger_keywords": ["..."],
  "synthesizer": {
    "agent": "orchestrator",
    "enabled": true,
    "prompt": "...",
    "input_from": ["step_id_1", "step_id_2"]
  },
  "steps": [
    {
      "id": "step_id",
      "agent": "agent-name",
      "prompt": "Instructions for this step",
      "depends_on": []
    }
  ]
}
```

## Validación

```bash
node tools/agent-workflows/run.mjs
```

## Flujo de Ejecución

1. **Plan**: Se genera un plan de ejecución resolviendo dependencias topológicamente
2. **Submit**: El workflow se envía al ejecutor, que lo persiste como run
3. **Advance**: Los pasos listos (dependencias cumplidas) pasan a running
4. **Complete**: Cada paso genera un handoff con contexto para el siguiente
5. **Synthesis** (opcional): El orchestrator recolecta todos los handoffs y produce un reporte unificado

---

*Generado por tools-dynamic v2*
