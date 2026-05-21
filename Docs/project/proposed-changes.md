# Proposed Changes — v2.0 Stabilization & Future Enhancements

> **Última revisión:** 2026-05-21
> Este documento centraliza acciones, propuestas y cambios omitidos de los roadmaps, junto con nuevas propuestas para la evolución del sistema.

---

## 1. Cambios Omitidos de Roadmaps Anteriores

### 1.1 v1 — Publicación en skills.sh

- **Fase:** v1 Phase 2
- **Estado:** 🚫 Omitido
- **Descripción:** Publicar los skills del proyecto en [skills.sh](https://www.skills.sh/) para que estén disponibles como catálogo público.
- **Razón de omisión:** No se priorizó durante el desarrollo de v1. Requiere integración con el ecosistema skills.sh y proceso de revisión.
- **Referencia:** `Docs/roadmaps/roadmap_v1.md`

### 1.2 v1 — Plugin de Ejecución Paralela (OMO)

- **Fase:** v1 Phase 3
- **Estado:** 🚫 Omitido
- **Descripción:** Implementar plugin de ejecución paralela basado en oh-my-openagent (OMO) para permitir que múltiples agentes secundarios trabajen simultáneamente.
- **Razón de omisión:** OpenCode no soporta ejecución paralela nativa; requiere un plugin externo. Se documentó el enfoque en `Docs/processes/deploy/parallel-execution.md` pero no se implementó.
- **Referencia:** `Docs/roadmaps/roadmap_v1.md`

### 1.3 v2 — Distribución & Publicación npm

- **Fase:** v2 Phase 6
- **Estado:** 🚫 Omitida (pospuesta a futuro)
- **Descripción:** Empaquetar y distribuir `tools_dynamic` como paquete npm con estrategia híbrida pnpm (desarrollo/testing) + npm (publicación OIDC).
- **Razón de omisión:** Se priorizó la estabilización del core, la inyección combinada multi-plataforma y la adición de nuevas funcionalidades antes de la publicación oficial. Además, el ecosistema npm sufrió ataques masivos de supply chain en 2025-2026, lo que requiere medidas de seguridad adicionales (pnpm v11 con `strictDepBuilds`, `minimumReleaseAge`, etc.).
- **Contenido original:** Incluye `package.json` con `packageManager`, `pnpm-workspace.yaml`, lockfile, README en inglés, documentación en español, CI/CD pipeline híbrido, changelog y migration guide.
- **Referencia:** `Docs/roadmaps/roadmap_v2.md`

---

## 2. Fase de Estabilización v2.0 — En Ejecución

La Fase de Estabilización está actualmente en curso. Consultar los documentos dedicados:

| Documento | Descripción |
|---|---|
| [`Docs/Fase-Estabilizacion.md`](../Fase-Estabilizacion.md) | Plan de implementación detallado con los 5 Gaps |
| [`Docs/roadmaps/roadmap_v2_stabilization.md`](../roadmaps/roadmap_v2_stabilization.md) | Roadmap con checklist para seguimiento paso a paso |

---

## 3. Propuesta Futura — Clasificación Semántica con IA

### 3.1 Problema

El sistema actual (y el propuesto en la estabilización) clasifica agents y skills mediante **similitud de keywords**. Esto tiene un límite fundamental: un skill con关键词 ortogonales a los perfiles conocidos (ej: "Brainstorming" con keywords `idea, creative, workshop`) no puede ser clasificado porque el sistema no comprende semánticamente que "synthesize group discussions" es una actividad de documentación/síntesis.

### 3.2 Propuesta

Integrar un LLM (opcional, no bloqueante) en el pipeline de clasificación para resolver los casos donde el scoring por keywords no alcanza el umbral de confianza:

```
Scanner
  │
  ▼
classifyBySkill() → Jaccard similarity
  │
  ├── confidence ≥ 30% → usar clasificación (sin IA)
  │
  └── confidence < 30% → ¿LLM disponible?
        │
        ├── Sí → enviar skill/agent body al LLM para clasificación semántica
        │        Prompt: "Clasifica este agente/skill en uno de estos roles:
        │                 reviewer, writer, tester, builder. Responde SOLO con
        │                 el nombre del rol."
        │
        └── No → marcar como unclassified (comportamiento actual)
```

### 3.3 Arquitectura Propuesta

```
core/
├── role-profiles.mjs          ← Perfiles + Jaccard scoring (sin IA)
├── classifier.mjs             ← Nueva: orquesta clasificación
│   ├── classifyByKeywords()   ← método actual (Jaccard)
│   └── classifyByLLM()        ← nuevo: llama a LLM cuando confidence < umbral
└── llm-connector.mjs          ← Nuevo: abstracción para conectar cualquier LLM
      ├── soporte: OpenAI API, Anthropic API, Gemini API, Ollama (local)
      └── configurable via: .env, CLI flag --llm, o config file
```

### 3.4 Prompt de Clasificación Semántica

```
System: You are a classifier that assigns AI agents to one of four roles.
Given the agent's name, description, keywords, and skill content, respond
with ONLY the role name: reviewer, writer, tester, or builder.

Input:
  Agent name: {name}
  Description: {role}
  Keywords: {keywords}
  Skill content: {skillBody}

Output:
  {role}
```

### 3.5 Consideraciones

| Aspecto | Detalle |
|---|---|
| **No bloqueante** | Si no hay LLM configurado, el sistema funciona igual (clasificación por keywords + unclassified) |
| **Caché** | Resultados de LLM cacheados por skill+agent hash para evitar llamadas repetidas |
| **Costo** | Solo se consulta al LLM para casos con confianza < 30% (casos borde) |
| **Local primero** | Soporte para Ollama permite ejecución 100% local sin costos de API |
| **Configurable** | `TOOLS_DYNAMIC_LLM_ENDPOINT`, `TOOLS_DYNAMIC_LLM_API_KEY`, `TOOLS_DYNAMIC_LLM_MODEL` |

### 3.6 Criterio de Activación

```
Por defecto: IA desactivada → clasificación por keywords + unclassified
Con IA:     Solo para skills/agents con confidence < 30%
Forzar IA:  `validate --llm` o `update --llm` para clasificar todo con IA
```

---

## 4. Resumen de Estados

| Propuesta | Estado | Prioridad |
|---|---|---|
| Gap 1 — Agent-Skill Binding | 📋 Planificado | Alta |
| Gap 2 — Scoring por Similitud | 📋 Planificado | Alta |
| Gap 3 — Comando `validate` | 📋 Planificado | Alta |
| Gap 4 — Comando `update` | 📋 Planificado | Media |
| Gap 5 — Post-Scan Feedback | 📋 Planificado | Media |
| Clasificación Semántica con IA | 🔮 Futuro | Baja |
| Publicación skills.sh | 🚫 Omitido | — |
| Plugin OMO (paralelismo) | 🚫 Omitido | — |
| Distribución npm (Phase 6) | 🚫 Omitido | — |

---

*Modelo: opencode/deepseek-v4-flash-free*
