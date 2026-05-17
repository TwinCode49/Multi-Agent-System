# {{projectName}} — Claude Code Instructions

## Tech Stack
- Language: {{language}}
- Framework: {{framework}}

## Agent Configuration
- Agent definitions are in `.claude/agents/`
- Skill definitions are in `.claude/skills/`
- Dispatch matrix: `AGENTS.md`

## Workflow Integration
- Testing framework: `tools/agent-testing/run.mjs`
- Performance metrics: `tools/agent-metrics/report.mjs`
- Multi-agent execution: `tools/agent-workflows/executor.mjs`

## Constraints
- Do NOT modify `AGENTS.md` without explicit user request
- Do NOT delete existing `.claude/agents/` files
- Always check agent definitions before making assumptions
- Report findings back with clear rationale
