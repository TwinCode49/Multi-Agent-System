# Agent & Skill Testing Framework

> **Estado**: Implementado
> **Ubicación**: `tools/agent-testing/`
> **Última revisión**: 2026-05-16

## 1. Propósito

Validar automáticamente que los agentes y skills del proyecto cumplen con los estándares de estructura, contenido y consistencia multiplataforma. Detecta regresiones cuando se modifican prompts o se añaden nuevos agentes/skills.

## 2. ¿Qué Prueba?

| Categoría | Pruebas por entidad | ¿Qué valida? |
|---|---|---|
| **Agentes** | ~10 checks | Frontmatter, keywords, secciones requeridas, modo, permisos, consistencia read-only |
| **Skills** | ~6 checks | Frontmatter, keywords, Goal, Constraints, directorio references/ |
| **Cross-platform** | 1 check por skill | Sincronía entre `.opencode/skills/` y `.github/skills/` |

**Total**: ~144 tests automatizados.

## 3. Ejecución

```bash
node tools/agent-testing/run.mjs
```

### Salida esperada

```
╔══════════════════════════════════════════════╗
║   Summary                                    ║
╚══════════════════════════════════════════════╝
  PASS:  144
  FAIL:  0
  SKIP:  0
  TOTAL: 144
```

Si hay fallos, se listan al final con detalles del agente, prueba y mensaje de error.

## 4. Estructura

```
tools/agent-testing/
├── run.mjs              ← Test runner principal (Node.js ESM)
├── package.json         ← Scripts de ejecución
├── cases/               ← Test cases en JSON
│   ├── orchestrator.json
│   ├── database-specialist.json
│   ├── test-engineer.json
│   ├── doc-agent.json
│   ├── security-reviewer.json
│   ├── perf-engineer.json
│   ├── devops-agent.json
│   ├── code-reviewer.json
│   ├── ui-specialist.json
│   └── ... (extensible)
└── README.md            ← Este archivo
```

## 5. Casos de Prueba (JSON)

Cada archivo en `cases/<agent>.json` define:

```json
{
  "agent": "database-specialist",
  "type": "secondary",
  "checks": {
    "frontmatter": {
      "description": "starts with TRIGGER KEYWORDS:",
      "mode": "subagent",
      "permission": { "edit": "allow", "bash": "allow" }
    },
    "keywords": ["database", "SQL", "query", "schema"],
    "sections": ["Core Responsibilities", "Behavior Rules"],
    "contains": ["parameterized queries", "EXPLAIN ANALYZE"],
    "readOnly": false
  }
}
```

### Campos

| Campo | Descripción |
|---|---|
| `agent` | Nombre del agente (debe coincidir con filename) |
| `type` | `primary` o `secondary` |
| `checks.frontmatter` | Validaciones del frontmatter YAML |
| `checks.keywords` | Keywords esperadas en `description` |
| `checks.sections` | Secciones `##` requeridas en el cuerpo |
| `checks.contains` | Texto que debe aparecer en el contenido |
| `checks.readOnly` | Si el agente es read-only |
| `checks.expectedModel` | Modelo esperado (solo read-only) |

### Scenarios (Orquestador)

El orquestador incluye `scenarios` que simulan prompts de entrada y verifican que se dispache al agente correcto:

```json
"scenarios": [
  {
    "name": "dispatch to specialist",
    "input": "revisa la seguridad de este endpoint",
    "expected_agents": ["security-reviewer"],
    "reason": "keyword 'security' should trigger security-reviewer"
  }
]
```

## 6. Integración Continua

Para ejecutar las pruebas en CI:

```yaml
# GitHub Actions
- name: Validate agents and skills
  run: node tools/agent-testing/run.mjs
```

El script retorna exit code 0 solo si todos los tests pasan.

## 7. ¿Qué Hace Cada Prueba?

### Frontmatter
- Verifica que `description` comienza con `TRIGGER KEYWORDS:`
- Verifica `mode` correcto (primary/subagent)
- Verifica `permission` tiene edit y bash definidos
- Para agentes read-only: verifica que `edit: deny` y `bash: deny`
- Para read-only: verifica que tiene `model` específico (claude)

### Keywords
- Parsea la sección `TRIGGER KEYWORDS:` 
- Cuenta keywords (mínimo 5)
- Verifica que las keywords listadas en el test case están presentes

### Secciones
- Verifica que el contenido incluye `## SectionName`
- Secciones obligatorias para secundarios: Core Responsibilities, Behavior Rules, Response Format, Constraints, Handoff Protocol
- Orquestador: Workflow, Dispatch Rules, Prohibited

### Cross-platform
- Compara archivos en `references/` entre `.opencode/skills/<name>/` y `.github/skills/<name>/`
- Reporta archivos faltantes o extra en cualquiera de las dos ubicaciones

## 8. Mantenimiento

### Añadir un nuevo agente
1. Crear el archivo `.md` en `.opencode/agents/`
2. Registrar en `opencode.json`
3. Crear `cases/<agent>.json` con los checks correspondientes
4. Ejecutar `node tools/agent-testing/run.mjs` para verificar

### Añadir un nuevo skill
1. Crear el skill en `.opencode/skills/<name>/` y `.github/skills/<name>/`
2. El runner lo detecta automáticamente (busca `SKILL.md` en subdirectorios)
3. Ejecutar pruebas para verificar sincronía cross-platform

### Modificar un prompt existente
1. Hacer el cambio en el `.md`
2. Ejecutar `node tools/agent-testing/run.mjs`
3. Si falla, ajustar el test case o corregir el prompt

---
*Modelo: opencode/deepseek-v4-flash-free*
