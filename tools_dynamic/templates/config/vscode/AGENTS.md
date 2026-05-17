# Project Orchestration Rules

## Language Standard
- **AI-facing files** (SKILL.md, agent.md, .agent.md, this file, .github/copilot-instructions.md): written in **English**.
- **Developer documentation** (Docs/): written in **Spanish**.

## Keyword-to-Agent Dispatch Matrix

When a user request matches any trigger keyword, the primary agent MUST dispatch to the corresponding secondary agent.

| Trigger Keywords | Secondary Agent | Dispatch Mode |
|---|---|---|
| database, SQL, query, schema, migration, ORM, PostgreSQL, MongoDB, data-model | @database-specialist | auto |
| test, coverage, spec, pytest, jest, unittest, TDD, BDD, test-suite | @test-engineer | auto |
| document, readme, docs, API-doc, changelog, migration-guide, comment | @doc-agent | auto |
| security, vulnerability, auth, CVE, OWASP, threat-model, audit, penetration | @security-reviewer | auto |
| performance, optimize, bottleneck, profile, caching, lazy-load, memory, latency | @perf-engineer | auto |
| deploy, CI/CD, pipeline, docker, kubernetes, release, infra, terraform, helm | @devops-agent | auto |
| review, PR, code-quality, lint, style, refactor, standards, best-practices | @code-reviewer | auto |
| UI, UX, component, layout, responsive, styling, accessibility, design-system, theme | @ui-specialist | auto |
| context, token, compact, summarize, window, limit, usage, memory, conversation, history | @context-steward | auto |

## Auto-Dispatch Rules

1. When a task context matches one or more keyword rows, the primary agent MUST dispatch to the matching secondary agent(s)
2. Multiple agents can be dispatched if the task spans multiple domains
3. If no keywords match, the primary agent handles the task directly
4. Manual invocation via `@agent-name` always overrides auto-routing
5. Secondary agents inherit task context from the primary but operate in their own session

## Secondary Agent Guidelines

- Each secondary agent has restricted permissions based on its role
- Read-only agents (security-reviewer, code-reviewer) have `edit: deny`
- Full-access agents (database-specialist, test-engineer) have `edit: allow`
- Agents must report results back to the primary when complete

## Prohibited Patterns

- Do NOT dispatch to an agent whose keywords don't match the task
- Do NOT skip dispatching when keywords match
- Do NOT modify files outside the secondary agent's domain
