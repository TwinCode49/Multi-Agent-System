---
name: customize-opencode
description: >
  TRIGGER KEYWORDS: opencode, opencode.json, opencode.jsonc, .opencode/,
  agent-config, skill-config, opencode-plugin, opencode-mcp, mcp-server,
  opencode-settings, opencode-agent, opencode-skill, opencode-permissions,
  opencode-rules, opencode-auth, opencode-api, opencode-hooks,
  opencode-lifecycle, opencode-events, opencode-tools, opencode-extension.
  Use ONLY when the user is editing or creating opencode's own configuration:
  opencode.json, opencode.jsonc, files under .opencode/, or files under
  ~/.config/opencode/. Also use when creating or fixing opencode agents,
  subagents, skills, plugins, MCP servers, or permission rules.
---

# Customize OpenCode Skill

## Goal
Properly configure and extend OpenCode's behavior through its configuration system.

## Configuration Files
- `opencode.json` — Main config (agents, skills, tools, permissions)
- `.opencode/agents/*.md` — Agent definitions
- `.opencode/skills/*/SKILL.md` — Skill definitions
- `AGENTS.md` — Dispatch matrix and orchestration rules

## Key Concepts
- Agents are defined with `mode`, `permission`, `skills.paths`, `model`
- Skills use YAML frontmatter with `name` and `description`
- Dispatch matrix maps keywords to agent roles
- Tools are project-local executables

## Constraints
- Do NOT modify opencode.json syntax or schema
- Do NOT create agents without proper frontmatter
- Do NOT reference non-existent skill paths
- Do NOT override system-level config in project config
