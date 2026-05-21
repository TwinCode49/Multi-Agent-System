---
name: context-management
description: >
  TRIGGER KEYWORDS: context, token, compact, summarize, truncate, window,
  limit, usage, compression, pruning, conversation, history, memory,
  buffer, threshold, conservation, token-count, estimation, context-window,
  overflow, budget, utilization, headroom, squeeze, reclaim, steward.
  MUST be used when managing LLM context utilization, estimating token
  usage, or performing context compaction across any platform.
---

# Context Management Skill

## Goal
Maintain optimal LLM context utilization by monitoring token usage, triggering compaction near limits, and preserving critical task state across platform boundaries.

## Context Window Reference

| Model Family | Default Limit | Notes |
|---|---|---|
| GPT-4 / GPT-4 Turbo | 128K tokens | Auto-compact in some platforms |
| Claude 3 / 3.5 / 4 | 200K tokens | Claude Code manages automatically |
| Gemini 1.5 / 2.0 | 1M tokens | Largest available window |
| DeepSeek V3 / R1 / V4 | 128K-131K tokens | Varies by version |
| Llama 3.1 / Mistral | 128K-131K tokens | Open-weight models |

## Compaction Thresholds

- **Safe** (< 50%): No action needed
- **Elevated** (50-80%): Monitor, avoid unnecessary file reads
- **Warning** (80-95%): Yellow — prepare compaction, summarize completed items
- **Critical** (> 95%): Red — compact immediately, block new tasks until headroom available

## Compaction Strategies

### 1. Summarization (Preferred)
Condense early conversation turns into a structured preamble:
```
--- Compressed Context ---
Objective: [original goal]
Completed: [list of done items]
Key Decisions: [decisions that affect future work]
Active Tasks: [in-progress work]
--- End Compressed Context ---
```

### 2. Pruning
Remove tool outputs that are no longer relevant:
- Completed `read` results
- Closed tickets or fixed issues
- Resolved error messages
- Superseded code snippets

### 3. Consolidation
Merge multiple agent responses into a single decision log:
- Combine review findings
- Aggregate status updates
- Merge handoff contexts

## Platform-Specific Notes

| Platform | Auto-Compact | Context-Monitoring |
|---|---|---|
| OpenCode | ✅ Automatic | Native (built-in) |
| Claude Code | ✅ Sits+compact | Native (implicit) |
| VS Code Copilot | ❌ Not exposed | Manual via context-steward |
| Antigravity | ❌ Not exposed | Manual via context-steward |

## Constraints

- Do NOT compact context during an active task execution
- Do NOT discard pending decisions or unresolved conflicts
- Do NOT use compression that loses task-critical information
- Do NOT estimate context without considering model-specific tokenization
