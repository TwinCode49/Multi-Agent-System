# Métricas de Rendimiento de Agentes

> **Estado**: Implementado
> **Herramienta**: `tools/agent-metrics/report.mjs`
> **Última revisión**: 2026-05-16

## 1. Propósito

Medir, monitorear y mejorar el rendimiento de los agentes del proyecto. Las métricas permiten detectar regresiones, comparar variantes de prompts, y establecer objetivos de calidad cuantificables.

## 2. Dimensiones de Métricas

### 2.1 Estructurales (calidad del prompt)

Miden la calidad intrínseca del archivo de definición del agente.

| Métrica | Cómo se mide | Objetivo |
|---|---|---|
| **Keywords count** | Número de TRIGGER KEYWORDS en `description` | ≥ 10 por agente |
| **Sections completeness** | % de secciones requeridas presentes (Core Responsibilities, Behavior Rules, Response Format, Constraints, Handoff Protocol) | 100% |
| **Frontmatter validity** | Parseo exitoso del YAML frontmatter | 100% |
| **Do NOT rules count** | Número de constraint items listados | ≥ 5 por agente |
| **Read-only consistency** | Agentes read-only tienen `edit: deny` + `bash: deny` + modelo especializado | 100% |
| **Handoff presence** | Sección Handoff Protocol definida con items accionables | 100% |

### 2.2 Funcionales (comportamiento en ejecución)

Miden cómo se comporta el agente cuando es invocado.

| Métrica | Cómo se mide | Objetivo |
|---|---|---|
| **Dispatch accuracy** | % de invocaciones donde el agente correcto fue seleccionado por keywords | ≥ 95% |
| **Output format compliance** | % de respuestas que siguen el Response Format definido | ≥ 90% |
| **Constraint adherence** | % de respuestas que no violan las constraints del agente | 100% |
| **Response time** | Tiempo desde dispatch hasta respuesta completa | < 30s |
| **Hallucination rate** | % de respuestas con información fabricada | < 5% |

### 2.3 De Sistema (salud del ecosistema)

Miden el estado general del sistema de agentes.

| Métrica | Cómo se mide | Objetivo |
|---|---|---|
| **Test pass rate** | % de tests que pasan en `tools/agent-testing/run.mjs` | 100% |
| **Cross-platform sync** | % de skills con references/ sincronizados entre `.opencode/` y `.github/` | 100% |
| **Keyword coverage** | % de keywords definidas en skills que están también en agent descriptions | ≥ 80% |
| **Skill-agent alignment** | % de skills que tienen un agente correspondiente con keywords coincidentes | 100% |

## 3. Recolección de Métricas

### 3.1 Automática (tools/agent-metrics/report.mjs)

Ejecutar:

```bash
node tools/agent-metrics/report.mjs
```

Genera un reporte JSON y HTML con todas las métricas estructurales y de sistema.

### 3.2 Manual (para métricas funcionales)

Las métricas funcionales requieren invocación real del agente y revisión humana o semiautomatizada:

1. Seleccionar 5 prompts de prueba por agente
2. Invocar el agente (simulado o real)
3. Evaluar output compliance, constraint adherence, hallucinations
4. Registrar resultados en `tools/agent-metrics/reports/manual-<fecha>.json`

### 3.3 Dashboard

El reporte generado incluye:
- Tabla de métricas por agente (semáforo: 🟢 ≥ objetivo, 🟡 ≥ 80%, 🔴 < 80%)
- Histórico de ejecuciones (para detectar regresiones)
- Alertas cuando una métrica cae por debajo del objetivo

## 4. Formato del Reporte

```json
{
  "timestamp": "2026-05-16T19:00:00Z",
  "summary": {
    "agents_evaluated": 9,
    "structural_pass_rate": 1.0,
    "test_pass_rate": 1.0,
    "cross_platform_sync_rate": 1.0,
    "overall_health": "green"
  },
  "agents": {
    "database-specialist": {
      "keywords_count": 16,
      "sections_completeness": 1.0,
      "do_not_rules": 6,
      "frontmatter_valid": true,
      "read_only_consistent": true,
      "handoff_present": true
    }
  },
  "system": {
    "total_tests": 144,
    "tests_passed": 144,
    "tests_failed": 0,
    "skills_total": 8,
    "skills_synced": 8
  },
  "alerts": []
}
```

## 5. Objetivos por Fase

| Fase | Keywords | Sections | Tests | Sync |
|---|---|---|---|---|
| Fase 3 (actual) | ≥ 10 | 100% | 100% | 100% |
| Fase 4 | ≥ 15 | 100% | 100% | 100% |
| Producción | ≥ 20 | 100% | 100% | 100% |

## 6. Alertas y Umbrales

| Alerta | Condición | Acción |
|---|---|---|
| 🔴 **Test failure** | Cualquier test falla | Bloqueante — corregir antes de continuar |
| 🔴 **Read-only inconsistency** | Agente read-only sin modelo asignado | Asignar modelo especializado |
| 🟡 **Low keywords** | < 10 keywords en un agente | Expandir lista de triggers |
| 🟡 **Section missing** | < 100% sections completeness | Añadir sección faltante |
| 🟢 **All green** | Todas las métricas en objetivo | Sin acción requerida |

## 7. Procedimiento

### 7.1 Ejecutar reporte completo
```bash
node tools/agent-metrics/report.mjs
```

### 7.2 Revisar alertas
- 🔴 Bloqueantes: detener y corregir
- 🟡 Advertencias: programar corrección

### 7.3 Comparar con línea base
El reporte incluye diff contra el último reporte guardado en `tools/agent-metrics/reports/latest.json`.

### 7.4 Actualizar línea base
```bash
node tools/agent-metrics/report.mjs --save
```

## 8. Referencias

- Herramienta: `tools/agent-metrics/report.mjs`
- Reportes: `tools/agent-metrics/reports/`
- Testing: `Docs/processes/testing/agent-testing.md`
- Revisión de skills: `Docs/processes/skills/skill-review.md`

---
*Modelo: opencode/deepseek-v4-flash-free*
