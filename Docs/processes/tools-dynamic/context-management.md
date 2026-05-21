# Gestión de Contexto LLM (Context Management)

## Descripción

El sistema de gestión de contexto monitorea la utilización del contexto del LLM y dispara compactación automática cuando se acerca al límite de la ventana de contexto del modelo. Esto previene errores de contexto overflow y mantiene la calidad de las respuestas.

## Componentes

```
tools/context-manager/          ← Tool de estimación de tokens
├── estimate.mjs                ← CLI para conteo y chequeo
└── reports/                    ← Reportes guardados (con --save)

.agent/rules/context-steward.md ← Agente especializado en contexto
.skills/context-management/     ← Skill con estrategias de compactación
└── references/platform-limits.md
```

## Arquitectura Multi-Capa

```
Usuario → Orquestador
              │
              ├── ¿Contexto > 80%? → @context-steward
              │       │
              │       ├── estimate.mjs --check → % actual
              │       ├── ¿> 95%? → Compactación inmediata
              │       └── ¿80-95%? → Sugerir compactación
              │
              └── Dispatch normal (si contexto suficiente)
```

## Uso del Tool

```bash
# Chequeo rápido (exit code 1 si > 95%)
node tools/context-manager/estimate.mjs --check

# Reporte completo
node tools/context-manager/estimate.mjs

# Guardar reporte
node tools/context-manager/estimate.mjs --save

# Especificar modelo
node tools/context-manager/estimate.mjs --model claude-3.5-sonnet

# Salida JSON
node tools/context-manager/estimate.mjs --check --json
```

## Umbrales

| Nivel | Uso | Acción |
|---|---|---|
| 🟢 Safe | < 50% | Ninguna |
| 🟡 Elevated | 50-80% | Monitorear |
| 🟡 Warning | 80-95% | Preparar compactación |
| 🔴 Critical | > 95% | Compactar inmediatamente |

## Estrategias de Compactación

1. **Summarization**: Condensar histórico en preamble estructurado
2. **Pruning**: Remover outputs de tools completados
3. **Consolidation**: Fusionar respuestas múltiples en log de decisiones

## Plataformas Soportadas

| Plataforma | Auto-Compact | Monitoreo |
|---|---|---|
| OpenCode | ✅ Built-in | Nativo |
| Claude Code | ✅ /compact | Nativo |
| VS Code | ❌ | Manual (context-steward) |
| Antigravity | ❌ | Manual (context-steward) |
