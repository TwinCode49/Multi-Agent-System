# Multi-Agent System

Structured agent and skill definitions for AI-assisted software engineering, built on [OpenCode](https://opencode.ai). Orchestrates 9 agents (1 primary + 8 specialized secondary) through keyword-based dispatch and multi-step workflows, backed by a portable CLI toolchain (`tools_dynamic`) for automated analysis, validation, injection, and updates.

## Architecture

```
User request → Orchestrator → Dispatch Matrix → Secondary Agent(s) → Synthesized Response
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
             Sequential chain              Parallel fan-out
          (step depends on step)      (independent agents run together)
```

Dispatch is rule-based: keywords in the user request map to agents via `AGENTS.md`. Skill-aware classification (Jaccard similarity) assigns roles (reviewer, writer, tester, builder) when skills are present.

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

## Skills

8 domain skills in `.opencode/skills/<name>/` (OpenCode) and `.github/skills/<name>/` (VS Code):

backend • containerization • database • documentation • frontend • prompt-optimization • terminal • testing

Each skill includes a `SKILL.md` with platform-specific instructions and `references/` with templates and examples. Skills can declare a `role` in frontmatter for explicit classification, or be scored via Jaccard similarity against built-in profiles.

## Workflows

Three predefined multi-agent workflows in `tools/agent-workflows/definitions/`:

- **docs-generation**: code-reviewer → doc-agent (API inventory → README + API docs + changelog)
- **feature-pipeline**: database-specialist → ui-specialist → test-engineer + doc-agent
- **full-review-pipeline**: code-reviewer + security-reviewer + perf-engineer → doc-agent

Workflow steps include a `step.skill` field for skill-aware routing. Definitions and test cases can be regenerated automatically from the current scan via the `update` command.

---

## `tools_dynamic` — Portable CLI Toolchain

`tools_dynamic/` is a portable agent orchestration CLI that detects platforms, analyzes agent/skill configurations, bootstraps projects, validates consistency, and keeps workflows up to date.

### Installation

```bash
cd tools_dynamic
npm install
```

### Commands

| Command | Description |
|---|---|
| `analyze [path]` | Discover platform, agents, and skills in a project |
| `report [path]` | Generate diagnostic report (JSON or HTML) |
| `doctor [path]` | Diagnose existing configuration and suggest improvements |
| `validate [path]` | Check agent-skill consistency (8 checks) |
| `update [path]` | Regenerate workflow definitions and test cases from current scan |
| `init [path]` | Full interactive bootstrap (analyze + inject + post-scan feedback) |
| `inject [path]` | Inject selected tools into a project |
| `list-platforms` | List detectable platforms and their indicators |

All commands accept `--help` for flags.

### Key Features

**Skill-Aware Classification** (`core/role-profiles.mjs`)
- 4 role profiles: reviewer, writer, tester, builder
- Jaccard similarity scoring (threshold: 5% overlap)
- Fallback to keyword-based regex when no skills or no match
- Explicit `role` override in SKILL.md frontmatter (100% confidence)

**Validator** (`core/validator.mjs`) — 8 consistency checks:

| # | Check | Severity |
|---|---|---|
| 1 | Orphan skills (unreferenced by agents) | 🟡 warning |
| 2 | Broken skill references (agent references nonexistent skill) | 🔴 blocker |
| 3 | Subagents without assigned skills | 🟡 warning |
| 4 | Workflow agents that no longer exist | 🟡 warning |
| 5 | Keyword-skill mismatch (low classification confidence) | ℹ️ info |
| 6 | Unclassified agents | ℹ️ info |
| 7 | Low-confidence agents (< 30%) | ℹ️ info |
| 8 | Cross-platform drift (same-named skills differ) | 🟡 warning |

**Update Command** (`commands/update.mjs`)
- Scans project → regenerates workflow definitions + test cases
- Diffs against existing files → backups originals → writes changes
- `--dry-run` shows what would change without writing

**Post-Scan Feedback** (`core/reporter.mjs`)
- "📊 Agent-Skill Mapping" section with unclassified agent count
- "⚡ Suggested Workflows" with confidence percentages
- `_printNextSteps()` suggests `validate` when issues exist
- Feedback integrated into `analyze`, `init`, `inject` commands

## Quick Start

```bash
# Analyze the current project
node tools_dynamic/index.mjs analyze .

# Validate agent-skill consistency
node tools_dynamic/index.mjs validate .

# Regenerate workflows and test cases (dry run first)
node tools_dynamic/index.mjs update . --dry-run

# Bootstrap a new project interactively
node tools_dynamic/index.mjs init .

# Run all 178 tests
node --test tools_dynamic/tests/*.test.mjs

# Legacy: validate agent definitions
node tools/agent-testing/run.mjs

# Submit a background workflow
node tools/agent-workflows/executor.mjs --submit docs-generation
```

## Test Suite

| Suite | Tests |
|---|---|
| Scanner orchestration | 10 |
| VanillaDetector | 6 |
| OpenCodeScanner | 17 |
| VSCodeScanner | 9 |
| ClaudeScanner | 15 |
| AntigravityScanner | 16 |
| Reporter | 9 |
| Reporter Phase 3 | 9 |
| WorkflowGenerator | 14 |
| TestGenerator | 8 |
| Injector | 20 |
| Differ | 5 |
| jaccardSimilarity | 5 |
| classifyBySkill | 7 |
| Validator | 13 |
| Update command integration | 4 |
| **Total** | **178** |

## Documentation

Developer documentation (processes, architecture, testing) is in **Spanish** at `Docs/`. AI-facing files (skills, agents, orchestration) are in **English**.

## Project Structure

```
.opencode/             OpenCode platform configuration
├── agents/            Agent definitions (.md)
├── skills/            Skill definitions (SKILL.md + references/)
└── opencode.json      OpenCode config

.github/               VS Code / Copilot platform
├── agents/
├── skills/
└── copilot-instructions.md

tools/                 Legacy tooling
├── agent-testing/     Agent definition tests
├── agent-metrics/     Structural and health metrics
└── agent-workflows/   Workflow definitions and executor

tools_dynamic/         Portable CLI toolchain
├── commands/          CLI commands (analyze, validate, update, ...)
├── core/              Core modules (parser, injector, reporter, validator, ...)
├── scanners/          Platform detectors (opencode, vscode, claude, antigravity)
├── templates/         Bootstrap templates
└── tests/             178 unit and integration tests

Docs/                  Developer documentation (Spanish)
├── processes/
├── agents/
├── skills/
├── roadmaps/
└── ...
```

---

<div align="center">

**Author** · **Raúl Tuyin** · *Software Engineer*

[GitHub](https://github.com/raul40) · [Email](mailto:rtuyin@gmail.com)

Built with [OpenCode](https://opencode.ai) · Model `opencode/deepseek-v4-flash-free`

</div>
