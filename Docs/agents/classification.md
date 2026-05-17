# Agent Classification: Primary vs Secondary

## Primary Agents

| Role | Description | Tools |
|---|---|---|
| **Orchestrator** | Entry point agent. Routes tasks to secondary agents based on keyword matching. Handles non-specialized work directly. | All tools |
| **Build** | Default coding agent. Full tool access for implementation. | All tools |
| **Plan** | Strategy agent. Restricted to read-only. Analyzes before execution. | Read only |

## Secondary Agents (Specialists)

| Agent | Trigger Keywords | Permission |
|---|---|---|
| **database-specialist** | database, SQL, query, migration, ORM, schema, PostgreSQL, MongoDB | edit: allow |
| **test-engineer** | test, coverage, spec, pytest, jest, unittest, TDD, BDD | edit: allow |
| **doc-agent** | document, readme, docs, API, changelog, migration-guide | edit: allow |
| **security-reviewer** | security, vulnerability, auth, CVE, OWASP, threat, audit | edit: deny |
| **perf-engineer** | performance, optimize, bottleneck, profile, caching, memory | edit: allow |
| **devops-agent** | deploy, CI/CD, pipeline, docker, kubernetes, release, infra | edit: allow |
| **code-reviewer** | review, PR, code-quality, lint, style, refactor, standards | edit: deny |
| **ui-specialist** | UI, UX, component, layout, responsive, styling, accessibility | edit: allow |

## Dispatch Rules

1. Primary agent detects trigger keywords in user request
2. Routes to matching secondary agent(s) via `@agent-name`
3. Multiple agents can be dispatched in parallel (requires plugin)
4. If no keyword matches, primary handles directly
5. User can always override with explicit `@mention`

---
*Model: opencode/deepseek-v4-flash-free*
