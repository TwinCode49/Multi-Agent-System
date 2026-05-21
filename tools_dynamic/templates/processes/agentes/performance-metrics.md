# Métricas de Rendimiento

> **Estado**: Implementado
> **Última revisión**: {{year}}

## Propósito

Evaluar la calidad de agentes y skills en tres dimensiones: estructural, funcional y de sistema.

## Dimensiones

| Dimensión | Métrica | Fuente |
|---|---|---|
| **Estructural** | Keywords count, section completeness, Do NOT rules, frontmatter validity | `tools/agent-metrics/report.mjs` |
| **Funcional** | Test pass rate | `tools/agent-testing/run.mjs` |
| **Sistema** | Cross-platform sync rate | Comparación skills entre plataformas |

## Uso

```bash
# Generar reporte de métricas
node tools/agent-metrics/report.mjs

# Guardar reporte a archivo
node tools/agent-metrics/report.mjs --save
```

## Indicadores de Salud

| Color | Significado |
|---|---|
| 🟢 Verde | Sin alerts — todas las métricas en verde |
| 🟡 Amarillo | 1+ warning (keywords bajos, sections incompletas) |
| 🔴 Rojo | 1+ error (sin handoff, read-only inconsistente) |

---

*Generado por tools-dynamic v2*
