# agents/ — Template Reference (Deprecated)

> **⚠️ Deprecated**: Los agentes activos están en `.opencode/agents/` (OpenCode), `agents/vscode/` (VS Code), y `agents/antigravity/` (Antigravity).
>
> Esta carpeta raíz `agents/` contiene las definiciones de referencia y templates. Las implementaciones runtime están en las carpetas específicas de cada plataforma.

## Propósito Original

Esta carpeta se creó como estructura unificada de templates de agentes para las 3 plataformas soportadas. Con la maduración del proyecto, cada plataforma tiene su propia ubicación runtime:

| Plataforma | Ubicación Runtime |
|---|---|
| OpenCode | `.opencode/agents/` |
| VS Code | `agents/vscode/` (`.agent.md`) |
| Antigravity | `agents/antigravity/` |

## Estructura

```
agents/
├── opencode/       → Referencia histórica (duplicada en .opencode/agents/)
├── vscode/         → Templates para VS Code (.agent.md)
└── antigravity/    → Templates para Antigravity
```

Para crear nuevos agentes, usar `opencode agent create` o colocar los archivos directamente en `.opencode/agents/`.
