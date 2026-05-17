# Skill Creation Best Practices

## 1. Write Killer Descriptions

The `description` is the ONLY thing the agent sees initially. Front-load keywords:

```yaml
description: >
  TRIGGER KEYWORDS: database, SQL, query, migration, ORM, PostgreSQL.
  Executes read-only database queries and schema analysis.
  MUST be used when debugging data issues.
```

## 2. Structure: Progressive Disclosure

```
SKILL.md (core instructions, < 500 lines)
├── Goal
├── Instructions (step-by-step)
├── Examples (few-shot)
└── Constraints (do NOT rules)

references/ (deep content, loaded only if needed)
├── api-docs.md
└── templates/

scripts/ (black boxes — run with --help)
└── validate.py

examples/
└── good-pattern.ts
```

## 3. Decision Trees

For complex skills, guide the model:

```markdown
## Decision Tree
- If user mentions "production" → use deploy-prod.sh
- If user mentions "staging" → use deploy-staging.sh
- Otherwise → ask which environment
```

## 4. Atomic Design

One skill per directory. Each skill does ONE thing well.

## 5. Version Your Skills

```yaml
---
name: my-skill
description: ...
metadata:
  version: 1.0.0
  author: team-name
---
```

## 6. Idioma

- **`SKILL.md`** (instrucciones para IA): **Inglés** obligatorio. Estándar para compatibilidad multiplataforma y rendimiento óptimo del LLM.
- **Documentación del proyecto** (`Docs/`): **Español** (orientada a desarrolladores del equipo)

---
*Model: opencode/deepseek-v4-flash-free*
