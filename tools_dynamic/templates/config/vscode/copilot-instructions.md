# {{projectName}} — VS Code Copilot Instructions

## Tech Stack
- Language: {{language}}
- Framework: {{framework}}

## Agent Configuration
- Agent definitions are in `.github/agents/`
- Skill definitions are in `.github/skills/`
- Dispatch matrix: `AGENTS.md`

## Workflow Integration
- Testing framework: `tools/agent-testing/run.mjs`
- Performance metrics: `tools/agent-metrics/report.mjs`
- Multi-agent execution: `tools/agent-workflows/executor.mjs`

## Constraints
- Do NOT modify `AGENTS.md` without explicit user request
- Always check agent definitions before making assumptions
- Report findings back with clear rationale
