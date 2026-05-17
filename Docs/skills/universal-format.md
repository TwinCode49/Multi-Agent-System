# Universal SKILL.md Format

Every skill follows this Markdown structure with YAML frontmatter.

## Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Unique identifier, lowercase, hyphens for spaces. Max 64 chars. Must match parent directory name. |
| `description` | Yes | What the skill does AND when to trigger it. Include `TRIGGER KEYWORDS:` with comma-separated terms. Write in third person. |
| `license` | No | License type (e.g., MIT, Apache-2.0) |

## Example

```markdown
---
name: api-doc-generator
description: >
  TRIGGER KEYWORDS: API, endpoint, REST, OpenAPI, Swagger, documentation.
  Generates and updates API documentation from code annotations.
  MUST be used when creating or modifying API endpoints.
  Proactively scans for undocumented endpoints.
---

# API Documentation Generator

## Goal
Automatically generate and maintain API documentation.

## Instructions
1. Scan source files for route definitions and controller annotations
2. Extract endpoint paths, HTTP methods, request/response schemas
3. Generate OpenAPI 3.0 compatible specification
4. Update existing documentation without removing manual additions

## Constraints
- Do NOT overwrite manually written documentation sections
- Do NOT include internal/private endpoints
```

## Best Practices

1. **Description is critical** — it's the trigger. Include keywords and imperative verbs (`MUST`, `ALWAYS`, `PROACTIVELY`)
2. **Keep SKILL.md under 500 lines** — use `references/` for deep content
3. **Progressive disclosure**: Metadata → Core instructions → Deep references
4. **Use relative paths** to reference `scripts/`, `references/`, `examples/`
5. **One skill per directory** — atomic design

---
*Model: opencode/deepseek-v4-flash-free*
