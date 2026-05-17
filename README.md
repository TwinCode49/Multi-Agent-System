# OpenCode Multi-Agent System

Structured agent and skill definitions for AI-assisted software engineering, built on [OpenCode](https://opencode.ai). Orchestrates 8 specialized secondary agents through keyword-based dispatch and multi-step workflows.

## Architecture

```
User request → Orchestrator → Dispatch Matrix → Secondary Agent(s) → Synthesized Response
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
             Sequential chain              Parallel fan-out
          (step depends on step)      (independent agents run together)
```

## Agents

| Agent | Role | Permissions |
|---|---|---|
| **orchestrator** | Entry point, dispatch, synthesis | edit + bash |
| **database-specialist** | Schema, queries, migrations, ORM | edit + bash |
| **test-engineer** | Tests, coverage, CI integration | edit + bash |
| **doc-agent** | README, API docs, changelogs, ADRs | edit only |
| **security-reviewer** | Vulnerability assessment, threat model | read-only |
| **perf-engineer** | Optimization, profiling, load testing | edit + bash |
| **devops-agent** | Docker, k8s, CI/CD, infra | edit + bash |
| **code-reviewer** | Code quality, lint, PR review | read-only |
| **ui-specialist** | Components, accessibility, responsive | edit + bash |

Dispatch is rule-based: keywords in the user request map to agents via `AGENTS.md`.

## Skills

8 domain skills in `.opencode/skills/<name>/` (OpenCode) and `.github/skills/<name>/` (VS Code):

backend • containerization • database • documentation • frontend • prompt-optimization • terminal • testing

Each skill includes a `SKILL.md` with platform-specific instructions, plus `references/` with templates and examples.

## Tools

| Tool | Purpose |
|---|---|
| `tools/agent-testing/run.mjs` | Validates all agent definitions and skills (144 tests) |
| `tools/agent-metrics/report.mjs` | Structural, functional, and system health metrics |
| `tools/agent-workflows/run.mjs` | Validates and plans multi-step workflow execution |
| `tools/agent-workflows/executor.mjs` | Background workflow runner with status polling and handoff tracking |

## Workflows

Three predefined multi-agent workflows in `tools/agent-workflows/definitions/`:

- **docs-generation**: code-reviewer → doc-agent (API inventory → README + API docs + changelog)
- **feature-pipeline**: database-specialist → ui-specialist → test-engineer + doc-agent
- **full-review-pipeline**: code-reviewer + security-reviewer + perf-engineer → doc-agent

## Quick Start

```bash
# Validate everything
node tools/agent-testing/run.mjs

# Run metrics
node tools/agent-metrics/report.mjs

# Validate and inspect workflows
node tools/agent-workflows/run.mjs

# Submit a background workflow
node tools/agent-workflows/executor.mjs --submit docs-generation
```

## Documentation

Developer documentation (processes, architecture, testing) is in **Spanish** at `Docs/processes/`. AI-facing files (skills, agents, orchestration) are in **English**.

---

<div align="center">

**Author** · **Raúl Tuyin** · *Software Engineer*

[GitHub](https://github.com/raul40) · [Email](mailto:rtuyin@gmail.com)

Built with [OpenCode](https://opencode.ai) · Model `opencode/deepseek-v4-flash-free`

</div>
