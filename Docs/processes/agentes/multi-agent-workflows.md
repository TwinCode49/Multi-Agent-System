# Flujos de Trabajo Multi-Agente

> **Estado**: Implementado
> **Herramienta**: `tools/agent-workflows/`
> **Última revisión**: 2026-05-16

## 1. Propósito

Coordinar múltiples agentes secundarios en secuencias orquestadas con dependencias entre pasos. Un flujo de trabajo (workflow) define una serie de pasos, cada uno asignado a un agente específico, con un orden de ejecución determinado por dependencias explícitas.

## 2. Formato de Workflow

Los workflows se definen como archivos JSON en `tools/agent-workflows/definitions/`.

### Estructura

```json
{
  "name": "string — nombre único del workflow",
  "version": "string — semver",
  "description": "string — propósito del workflow",
  "trigger_keywords": ["string — palabras que activan este workflow"],
  "steps": [
    {
      "id": "string — identificador único del paso",
      "agent": "string — nombre del agente secundario",
      "prompt": "string — instrucción a pasar al agente",
      "output_key": "string — clave para almacenar el output del paso",
      "depends_on": ["string — IDs de pasos de los que depende"]
    }
  ]
}
```

### Reglas de Validación

1. **Nombre**: obligatorio
2. **Steps**: al menos un paso
3. **ID**: único por workflow
4. **Agent**: cada paso debe tener un agente asignado
5. **Prompt**: cada paso debe tener un prompt
6. **Dependencias**: todo ID en `depends_on` debe existir como `id` en otro paso
7. **Orden topológico**: si `B` depende de `A`, `A` debe aparecer antes que `B` en el array `steps`

### Reglas de Ejecución

1. Los pasos sin dependencias se ejecutan primero (en paralelo si hay múltiples)
2. Los pasos con dependencias se ejecutan cuando todas sus dependencias han completado
3. Múltiples pasos listos al mismo tiempo se ejecutan en paralelo
4. Si ningún paso puede avanzar (deadlock), el workflow falla

## 3. Herramienta de Validación

El runner `tools/agent-workflows/run.mjs`:

1. Lee todos los archivos `.json` en `definitions/`
2. Valida cada workflow contra las reglas
3. Genera un plan de ejecución (orden secuencial/paralelo)
4. Muestra el resumen

```bash
node tools/agent-workflows/run.mjs
```

Salida esperada: workflows válidos con desglose de pasos secuenciales vs paralelos.

## 4. Workflows Definidos

| Workflow | Pasos | Agentes Involucrados |
|---|---|---|
| `docs-generation` | 4 | code-reviewer → doc-agent |
| `feature-pipeline` | 5 | database-specialist → ui-specialist → test-engineer, doc-agent |
| `full-review-pipeline` | 4 | code-reviewer, security-reviewer, perf-engineer → doc-agent |

### docs-generation
```
→ [code-reviewer] api_inventory
║ [doc-agent] readme ← api_inventory
║ [doc-agent] apidocs ← api_inventory
║ [doc-agent] changelog ← api_inventory
```

### feature-pipeline
```
→ [database-specialist] schema
→ [database-specialist] api_code ← schema
→ [ui-specialist] ui_code ← api_code
║ [test-engineer] test_code ← api_code, ui_code
║ [doc-agent] docs ← api_code, ui_code
```

### full-review-pipeline
```
║ [code-reviewer] code_review
║ [security-reviewer] security_review
║ [perf-engineer] perf_review
→ [doc-agent] synthesis ← code_review, security_review, perf_review
```

## 5. Problemas Conocidos

### ~~Node.js 24: `Set.prototype.has()` incorrecto en callbacks `.filter()`~~

**Estado**: Resuelto — workaround aplicado.

**Síntoma**: El runner (ESM y CJS) fallaba con `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed`. Heap alcanzaba 4GB y el proceso moría con código 134.

**Causa raíz**: Bug en V8 (Node.js 24.13.0) donde `Set.prototype.has()` retorna `false` dentro de una arrow function usada como callback de `.filter()` cuando el cuerpo del callback no tiene side effects. El JIT compiler optimiza incorrectamente la llamada, provocando un loop infinito en `generatePlan()`.

**Solución**: Reemplazar `Set/Set.has/Set.add` con `Array/Array.includes/Array.push` en la función `generatePlan()`.

**Demostración**:
```javascript
// ❌ Bug: loop infinito, OOM
const done = new Set();
rem = rem.filter(s => !done.has(s)); // done.has() retorna false siempre

// ✅ Workaround: funciona correctamente
const done = [];
rem = rem.filter(s => !done.includes(s.id));
```

**Nota**: El bug no afecta a `Set.has()` en bucles `for...of` o `for` anidados — solo en callbacks `.filter()` sin side effects. Si se migra a Node.js > 24 o a otra plataforma, se puede revertir a `Set`.

## 6. Workflows Omitidos (paralelismo externo)

La ejecución real de los pasos del workflow (invocar agentes, recolectar outputs, encadenar prompts) requiere plugins externos no implementados:

- **oh-my-openagent (OMO)**: Plugin de ejecución paralela
- **opencode-council**: Coordinador de agentes múltiples

Ver `Docs/processes/deploy/parallel-execution.md` para requerimientos completos.

## 7. Clasificación

- **Categoría**: Agentes
- **Fase**: 4.1
- **Depende de**: Fase 3.1 (definición de agentes), Fase 3.3 (testing de agentes), Fase 3.4 (métricas)

## 8. Referencias

- Herramienta: `tools/agent-workflows/run.mjs`
- Definiciones: `tools/agent-workflows/definitions/`
- Ejecución paralela (omitido): `Docs/processes/deploy/parallel-execution.md`
- Roadmap v1: `Docs/roadmaps/roadmap_v1.md`
- Catálogo de procesos: `Docs/processes/README.md`

---

*Modelo: opencode/deepseek-v4-flash-free*
