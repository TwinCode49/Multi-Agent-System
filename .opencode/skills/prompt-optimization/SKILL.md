---
name: prompt-optimization
description: >
  TRIGGER KEYWORDS: prompt, prompt-engineering, prompt-optimization,
  LLM-prompt, AI-prompt, system-prompt, few-shot, chain-of-thought,
  COT, RAG, structured-output, json-mode, token-optimization, context,
  temperature, top-p, instruction-tuning, system-message, output-format,
  persona-prompt, role-prompt, prompt-template, prompt-evaluation,
  A/B-test-prompt, prompt-iteration, prompt-chaining.
  MUST be used when writing, reviewing, or optimizing prompts for LLMs,
  AI agents, or any system-prompt engineering task.
---

# Prompt Optimization Skill

## Goal
Write precise, token-efficient prompts that produce reliable, structured outputs from LLMs. Every prompt must be clear, constrained, and evaluation-ready.

## Core Principles

### 1. Structure Before Content
```
[ROLE] → [CONTEXT] → [TASK] → [CONSTRAINTS] → [OUTPUT FORMAT] → [EXAMPLE]
```

| Section | Purpose | Required |
|---|---|---|
| Role | Who the AI is acting as | Yes |
| Context | Background information | Conditional |
| Task | What to do (precise verb) | Yes |
| Constraints | Rules, boundaries, don'ts | Yes |
| Output Format | Exact response structure | Strongly recommended |
| Example | Few-shot demonstration | Recommended |

### 2. Be Specific, Not Verbose
```markdown
❌ "Please think about this carefully and maybe try to come up with some ideas..."
✅ "List exactly 3 refactoring candidates with: file, line, reason."
```

### 3. Use Constraints Liberally
```
- Return ONLY valid JSON (no markdown fences)
- Maximum 5 bullet points
- Each point must reference a specific line number
- Output language: Spanish
- If uncertain, respond with null
```

### 4. Output Format Always
```markdown
Respond in this exact JSON structure:
{
  "summary": "string (max 100 chars)",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "file_path": "string",
      "line": number,
      "description": "string (max 200 chars)",
      "suggestion": "string (max 200 chars)"
    }
  ]
}
```

## Pattern Library

### Persona/Role Prompt
```
You are a senior backend engineer reviewing a Pull Request.
Follow strict TypeScript best practices and Node.js conventions.
Be concise. Criticize constructively with specific code references.
```

### Chain-of-Thought (for reasoning tasks)
```
Work through this step by step:
1. First, understand the data structure
2. Identify all edge cases
3. Propose a solution for each case
4. Choose the optimal approach
5. Explain why alternatives were rejected
```

### RAG Context Injection
```
Use ONLY the following context to answer.
If the context does not contain the answer, say "I don't know".

<context>
{{chunked_documents}}
</context>

Question: {{user_query}}
```

### Few-Shot (by example)
```
Convert these natural language commands to shell scripts.

Input: "find all large log files and compress them"
Output:
  find /var/log -name "*.log" -size +100M -exec gzip {} \;

Input: "list docker containers sorted by memory usage"
Output:
  docker ps --format "table {{.Names}}\t{{.MemUsage}}" | sort -k2 -rh

Input: "{{user_input}}"
Output:
```

## Token Optimization

| Technique | Token Saved | Impact |
|---|---|---|
| Shorten instructions | 20-50% | High |
| Use abbreviations | 10-20% | Medium |
| Remove redundant phrases | 15-30% | High |
| Single-letter variables in examples | 5-10% | Low |
| Compress few-shot to 1-2 examples | 30-50% | Medium |
| Use bullet points over paragraphs | 20-40% | High |
| Remove "please", "thank you", etc. | 5-10% | Negligible |

## Temperature & Parameter Guidelines

| Task | Temperature | top_p | Max Tokens |
|---|---|---|---|
| Code generation | 0.0 - 0.2 | 0.9 | 2048 |
| Classification | 0.0 - 0.1 | 0.95 | 128 |
| Creative writing | 0.7 - 0.9 | 0.95 | 4096 |
| Summarization | 0.3 - 0.5 | 0.9 | 512 |
| Translation | 0.1 - 0.3 | 0.9 | 1024 |
| Structured output (JSON) | 0.0 - 0.1 | 0.95 | Depends |

## Prompt Evaluation Metrics

| Metric | What to Measure |
|---|---|
| Precision | % of outputs matching expected format |
| Recall | % of required elements present |
| Token efficiency | Input tokens / information density |
| Consistency | Variance across 5+ runs (temperature 0) |
| Edge case handling | Response to missing/invalid input |
| Hallucination rate | % of fabricated facts |

## A/B Testing Prompt Template
```
When iterating prompts, track:

Variant A: [prompt text]
Variant B: [prompt text]

Metric: output_format_compliance | token_count | correctness

Test: run 10 inputs per variant
Result:
  A: 8/10 pass, avg 150 tokens
  B: 9/10 pass, avg 120 tokens ← winner
```

## Anti-Patterns

| Anti-Pattern | Why | Fix |
|---|---|---|
| Over-constraining | Rigid output breaks on edge cases | Use defaults + fallbacks |
| Vague role | Inconsistent persona drift | Explicit role definition |
| Buried instruction | Key constraint missed | Front-load crucial rules |
| No output spec | Free-form text = parsing pain | Enforce structured output |
| Over-prompting | Model ignores late instructions | Keep prompt under ~1500 tokens |
| False assumptions | Model fills gaps incorrectly | Provide all necessary context |
| Mixing languages | Confuses model | Set language explicitly upfront |

## Constraints
- Do NOT use vague instructions — be specific
- Do NOT skip output format for production prompts
- Do NOT assume the model knows recent data (use RAG if needed)
- Do NOT include contradictory instructions
- Do NOT put critical constraints at the end (recency bias)
- Do NOT use ambiguous terms ("etc.", "and so on")

## References
- `references/REFINEMENT_WORKFLOW.md` — Iterative prompt improvement process
- `examples/` — Real-world prompt templates for common tasks
