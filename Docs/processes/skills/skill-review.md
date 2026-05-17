# Proceso de Revisión de Skills

> **Estado**: Implementado
> **Última revisión**: 2026-05-16

## 1. Propósito

Garantizar que todo skill publicado cumple con los estándares de calidad, consistencia y completitud del proyecto. La revisión es obligatoria antes de publicar un skill en `skills.sh` o antes de marcarlo como "activo" en la configuración del proyecto.

## 2. Roles

| Rol | Responsabilidad |
|---|---|
| **Autor** | Crea o modifica el skill, ejecuta la autoevaluación, abre la solicitud de revisión |
| **Revisor** | Evalúa el skill contra el checklist, provee feedback, aprueba o rechaza |
| **Mantenedor** | Decide la versión final, fusiona cambios, publica |

El autor y el revisor **no deben ser la misma persona**.

## 3. Ciclo de Vida de un Skill

```
[Idea] → [Borrador] → [Autoevaluación] → [Solicitud de Revisión] → [Revisión]
    ↑                                                                    │
    └──────────── [Rechazado con feedback] ←─────────────────────────────┘
                                                                         │
                                                                    [Aprobado]
                                                                         │
                                                                    [Publicado]
```

## 4. Criterios de Evaluación

### 4.1 Estructurales
- [ ] El skill tiene un `SKILL.md` (exactamente ese nombre, con mayúsculas)
- [ ] El frontmatter incluye `name`, `description` y `TRIGGER KEYWORDS:`
- [ ] La estructura de directorios incluye `references/` y `examples/`
- [ ] Los archivos de referencia están en `references/` (no en la raíz del skill)
- [ ] No hay archivos `.gitkeep` en el commit final

### 4.2 De Contenido
- [ ] El `description` comienza con `TRIGGER KEYWORDS:` seguido de términos separados por coma
- [ ] Las keywords cubren todos los casos de uso relevantes
- [ ] El cuerpo tiene una sección `## Goal` clara
- [ ] Las reglas y constraints están en formato de lista o tabla legible
- [ ] No hay enlaces rotos ni referencias a rutas inexistentes
- [ ] El tono es instruccional (imperativo), no descriptivo

### 4.3 Técnicos
- [ ] Los comandos, ejemplos de código y configuraciones son sintácticamente válidos
- [ ] Los patrones mostrados siguen buenas prácticas actuales del ecosistema
- [ ] No hay vulnerabilidades de seguridad en los ejemplos
- [ ] Los placeholders son claros (`{{variable}}` o `ejemplo.com`)
- [ ] Los fragmentos de código tienen el lenguaje especificado

### 4.4 Multiplataforma
- [ ] Existe versión en `.opencode/skills/<name>/` y `.github/skills/<name>/`
- [ ] La versión `.github/` incluye `context: inline|fork` en frontmatter
- [ ] La versión `.github/` es un subconjunto funcional (más conciso)
- [ ] `references/` tiene los mismos archivos en ambas ubicaciones

## 5. Proceso Paso a Paso

### 5.1 Autoevaluación (Autor)
1. Ejecutar la [Skill Review Checklist](./SKILL_REVIEW_CHECKLIST.md) contra el skill
2. Corregir todos los puntos críticos antes de solicitar revisión
3. Abrir un PR o issue con etiqueta `skill-review`

### 5.2 Revisión (Revisor)
1. Clonar/descargar el skill
2. Verificar cada punto del checklist
3. Probar el skill en un contexto real (cargarlo en OpenCode/VS Code)
4. Documentar hallazgos en el PR/issue
5. Decidir: **Aprobar**, **Aprobar con cambios menores**, o **Rechazar**

### 5.3 Iteración (Autor)
- Si es rechazado: corregir según feedback y volver a 5.1
- Si es aprobado con cambios: realizar cambios y notificar al revisor
- Si es aprobado: pasar a 5.4

### 5.4 Publicación (Mantenedor)
1. Fusionar el PR a la rama principal
2. Actualizar `Docs/LOG.md` con entrada del nuevo skill
3. Actualizar `Docs/project/roadmap.md`
4. Publicar en `skills.sh` (si aplica)
5. Actualizar la configuración del proyecto (`opencode.json` o `.github/copilot-instructions.md`)

## 6. Prioridad de Defectos

| Severidad | Definición | Acción |
|---|---|---|
| **Crítico** | El skill no carga, keywords incorrectas, estructura faltante | Bloqueante — debe corregirse antes de aprobar |
| **Mayor** | Información incorrecta, ejemplos que no funcionan, omisiones importantes | Debe corregirse, pero no bloquea la revisión |
| **Menor** | Estilo, formato, errores tipográficos | Se documenta pero no bloquea |

## 7. Métricas de Calidad

| Métrica | Objetivo |
|---|---|
| Checklist compliance | 100% en críticos, >90% total |
| Keywords match rate | >80% de los triggers sugeridos por el skill |
| Tiempo de revisión | < 48 horas hábiles |
| Iteraciones promedio | ≤ 2 por skill |

## 8. Plantillas

- [Skill Review Checklist](./SKILL_REVIEW_CHECKLIST.md) — Checklist imprimible usado en cada revisión.

---
*Última actualización: 2026-05-16 | Modelo: opencode/deepseek-v4-flash-free*
