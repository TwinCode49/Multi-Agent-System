# Antigravity Project Rules — {{projectName}}

## Tech Stack
- Language: {{language}}
- Framework: {{framework}}

## Code Quality
- Follow project conventions defined in `AGENTS.md`
- Keep functions focused and under 30 lines where possible
- Prefer clarity over cleverness

## Agent Behavior
- Read agent definitions from `.agent/rules/` for specialized instructions
- Use `AGENTS.md` dispatch matrix for task routing
- Report findings back with clear rationale

## Workflow Integration
- Workflow definitions: `.agent/workflows/*.md`
- Testing framework: `tools/agent-testing/run.mjs`
- Performance metrics: `tools/agent-metrics/report.mjs`
- Multi-agent execution: `tools/agent-workflows/executor.mjs`

## Constraints
- Do NOT modify `AGENTS.md` without explicit user request
- Do NOT delete existing `.agent/rules/` files
- Always check existing rules before making assumptions about project patterns
