# Parallel Execution Plugin — Plan de Implementación

> **Estado**: Omitido (pendiente para futuro)
> **Última revisión**: 2026-05-16

## 1. Contexto

OpenCode no soporta ejecución paralela de agentes de forma nativa. Cuando se necesita ejecutar múltiples agentes simultáneamente (por ejemplo, `@database-specialist` + `@security-reviewer` sobre el mismo cambio), el orquestador debe ejecutarlos secuencialmente, lo que aumenta el tiempo de respuesta.

La ejecución paralela requiere un plugin externo. Las opciones conocidas son:

| Plugin | Estado |
|---|---|
| `oh-my-openagent` (OMO) | Plugin comunitario, no verificado |
| `opencode-council` | Alternativa mencionada en investigación inicial |
| SDK personalizado | Construir integración propia sobre la API de OpenCode |

## 2. Requerimientos Funcionales

### 2.1 Fan-Out / Fan-In

```
Usuario → Orquestador
             ├─ → @database-specialist  (paralelo)
             ├─ → @security-reviewer    (paralelo)
             ├─ → @perf-engineer        (paralelo)
             └─ → Orquestador recolecta resultados → síntesis → respuesta
```

- El orquestador debe poder lanzar N agentes secundarios simultáneamente
- Recolectar resultados conforme terminan (no esperar al más lento si hay timeout)
- Sintetizar respuestas múltiples en una sola coherente
- Resolver conflictos cuando dos agentes dan recomendaciones contradictorias

### 2.2 Patrones de Ejecución

| Patrón | Descripción | Caso de Uso |
|---|---|---|
| **Fan-Out** | Un agente → múltiples agentes en paralelo → recolección | `@database-specialist` + `@security-reviewer` para revisión de schema |
| **Race** | Múltiples agentes compiten, se toma el primer resultado exitoso | Pruebas con diferentes configuraciones |
| **Pipeline** | Stage 1 (paralelo) → agregación → Stage 2 (paralelo) | Análisis de código → generación de documentación |
| **Voting** | Misma tarea a múltiples agentes, se toma la respuesta más frecuente | Clasificación o revisión crítica |
| **Scatter-Gather** | Dividir trabajo en partes → procesar cada parte → unir resultados | Revisión de PR grande dividido por archivos |

### 2.3 Aislamiento de Estado

- Cada agente en paralelo debe tener su propio contexto aislado
- No debe haber contaminación entre ejecuciones paralelas
- Las variables de entorno, archivos temporales, y conexiones deben ser independientes
- Soporte para contextos de alto y bajo aislamiento (según nivel de confianza)

### 2.4 Timeouts y Resilience

| Requerimiento | Especificación |
|---|---|
| Timeout por agente | Configurable por tarea (default: 60s) |
| Timeout global | Configurable por invocación (default: 120s) |
| Retry | Configurable (0-3 reintentos con backoff exponencial) |
| Circuit breaker | Detener invocaciones si un agente falla repetidamente |
| Fallback | Si un agente falla, continuar con los demás y reportar el error |

### 2.5 Recolección y Síntesis

- Resultados recolectados como estructura JSON tipada
- Estrategias de síntesis configurables:
  - **Merge**: unir resultados complementarios (ej: database + security)
  - **Priority**: usar resultado del agente con mayor prioridad definida
  - **Vote**: mayoría simple cuando hay solapamiento
  - **Manual**: todos los resultados al usuario para decisión final
- Detección de conflictos entre resultados de diferentes agentes

## 3. Arquitectura Propuesta

```
┌─────────────────────────────────────────┐
│            Orchestrator                  │
│  (planifica y coordina ejecución)        │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Parallel Executor               │
│  (plugin externo: OMO / council / SDK)  │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Agent 1  │ │ Agent 2  │ │ Agent N  │ │
│  │ (ctx A)  │ │ (ctx B)  │ │ (ctx C)  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       │            │            │        │
│  ┌────▼────────────▼────────────▼────┐   │
│  │      Result Collector             │   │
│  │      (merge + conflict detect)    │   │
│  └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 3.1 Interfaz del Plugin

```typescript
interface ParallelExecutor {
  execute<T>(
    tasks: ParallelTask[],
    options?: ParallelOptions
  ): Promise<ParallelResult<T>>;
}

interface ParallelTask {
  agentId: string;           // "database-specialist"
  task: string;              // prompt o instrucción específica
  context: TaskContext;       // archivos, variables, historial
  priority?: number;         // para orden de síntesis
  timeout?: number;          // ms
}

interface ParallelOptions {
  strategy: "fan-out" | "race" | "pipeline" | "voting" | "scatter-gather";
  synthesis: "merge" | "priority" | "vote" | "manual";
  globalTimeout: number;
  retryConfig: { maxRetries: number; backoffMs: number };
  isolation: "high" | "low";
}

interface ParallelResult<T> {
  results: TaskResult<T>[];
  conflicts: Conflict[];
  synthesis: T;
  metadata: { totalTime: number; failures: number };
}

interface Conflict {
  between: string[];         // agentIds involucrados
  field: string;             // campo en conflicto
  values: unknown[];         // valores diferentes
  resolution: "auto" | "manual";
}
```

### 3.2 Integración con Orchestrator

El orquestador debe:

1. Recibir la solicitud del usuario
2. Analizar keywords y determinar qué agentes secundarios invocar
3. Si hay múltiples agentes:
   - Decidir si pueden ejecutarse en paralelo (dependencias) o requieren secuencia
   - Crear `ParallelTask[]` con el contexto adecuado para cada agente
   - Llamar a `ParallelExecutor.execute()` 
   - Recibir `ParallelResult` con resultados sintetizados
   - Revisar conflictos y resolverlos
4. Responder al usuario con la síntesis final

### 3.3 Manejo de Conflictos

| Tipo de Conflicto | Estrategia de Resolución |
|---|---|
| Misma recomendación opuesta | Usar prioridad de agente (configurable) |
| Resultados complementarios | Merge automático |
| Resultados contradictorios sin prioridad | Preguntar al usuario |
| Un agente falla, otro responde | Tomar el resultado exitoso |

## 4. Opciones de Implementación

### 4.1 oh-my-openagent (OMO)

- Plugin comunitario para OpenCode
- Proporciona ejecución paralela de agentes
- **Riesgo**: No verificado, puede no tener mantenimiento activo
- **Acción requerida**: Investigar estado actual, probar en entorno aislado

### 4.2 opencode-council

- Alternativa mencionada en research inicial
- **Riesgo**: Poca información disponible
- **Acción requerida**: Buscar documentación, evaluar si sigue activo

### 4.3 SDK / Custom Implementation

- Construir integración propia usando el sistema de tasks de OpenCode
- Ventaja: control total sobre la implementación
- Desventaja: mayor esfuerzo de desarrollo
- **Acción requerida**: Diseñar e implementar el `ParallelExecutor` como skill o script

## 5. Prerrequisitos para Implementar

- [ ] Investigar estado actual de `oh-my-openagent` y `opencode-council`
- [ ] Decidir entre plugin existente o implementación custom
- [ ] Diseñar e implementar la interfaz `ParallelExecutor`
- [ ] Integrar con el orquestador para detección de tareas paralelizables
- [ ] Implementar estrategias de síntesis (merge, priority, vote)
- [ ] Implementar detección y resolución de conflictos
- [ ] Agregar timeouts, retry, circuit breaker
- [ ] Escribir tests unitarios y de integración
- [ ] Documentar el uso y configuración
- [ ] Agregar métricas de performance (tiempo ahorrado vs secuencial)

## 6. Métricas de Éxito

| Métrica | Objetivo |
|---|---|
| Reducción de tiempo en tareas multi-agente | ≥ 50% vs ejecución secuencial |
| Tasa de resolución automática de conflictos | ≥ 80% |
| Tasa de fallos | ≤ 5% de invocaciones paralelas |
| Sobrecarga del plugin | ≤ 500ms overhead por invocación |
| Aislamiento de contexto | 0 escapes de estado entre ejecuciones |

---
*Modelo: opencode/deepseek-v4-flash-free*
