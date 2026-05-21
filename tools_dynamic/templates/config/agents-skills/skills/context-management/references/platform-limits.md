# Platform Context Window Limits

## OpenCode
- Default model: deepseek-v4-flash-free (131K tokens)
- Auto-compaction: ✅ Built-in (automatic when nearing limit)
- Monitoring: Native — tracks token usage internally
- Best practice: Let OpenCode handle compaction; context-steward is passive observer

## Claude Code
- Default model: claude-3.5-sonnet (200K tokens)
- Auto-compaction: ✅ Built-in (/compact command)
- Monitoring: Native — shows context usage on request
- Best practice: Use `/compact` manually when context-steward warns near limit

## VS Code / GitHub Copilot
- Default model: gpt-4o (128K tokens)
- Auto-compaction: ❌ Not available
- Monitoring: ❌ Not exposed via API
- Best practice: Context-steward must estimate and compact manually via summarization

## Antigravity
- Default model: gemini-2.0-flash (1M tokens)
- Auto-compaction: ❌ Not available
- Monitoring: ❌ Not exposed via API
- Best practice: Context-steward must use the context-manager tool to estimate and compact
