---
name: prompt-optimization
description: >
  TRIGGER KEYWORDS: prompt, prompt-engineering, LLM-prompt, AI-prompt,
  system-prompt, few-shot, chain-of-thought, RAG, structured-output,
  token-optimization, context-optimization, prompt-evaluation,
  prompt-template, persona-prompt. MUST be used when writing or
  optimizing any LLM or AI agent prompt.
context: fork
---

# Prompt Optimization Skill

## Goal
Token-efficient prompts that produce reliable, structured LLM outputs.

## Structure
```
ROLE → CONTEXT → TASK → CONSTRAINTS → OUTPUT FORMAT → EXAMPLE
```

## Rules
- Be specific, not verbose: "List exactly 3 items" not "maybe think about..."
- Always specify output format (JSON schema preferred)
- Use constraints: "Max 5 bullets", "If uncertain, say null"
- Role definition first: "You are a senior backend engineer..."

## Token Optimization
- Shorten instructions → saves 20-50%
- Bullet points over paragraphs → saves 20-40%
- Remove greetings and pleasantries → saves 5-10%
- 1-2 examples over 3-5 → saves 30-50%

## Temperature Guide
| Task | Temp |
|---|---|
| Code / Classification | 0.0 - 0.2 |
| Creative | 0.7 - 0.9 |
| Structured output | 0.0 - 0.1 |
| Summarization | 0.3 - 0.5 |

## Anti-Patterns
- ❌ Vague instructions ("improve this code")
- ❌ No output format (free-form parsing pain)
- ❌ Critical constraint at the end (recency bias)
- ❌ Contradictory instructions
- ❌ Over-prompting (>1500 tokens = ignored tail)

## Patterns
- **Chain-of-Thought**: Step-by-step reasoning before answer
- **RAG**: `<context>...</context>\n\n Question: ...`
- **Few-shot**: 1-2 input → output examples
- **Persona**: "You are a..."

## Evaluation
Per variant: 10 inputs, track format compliance, token count, correctness.

## Constraints
- No vague instructions
- No skipped output format
- No contradictory rules
- No critical constraints at the end
- No ambiguous terms ("etc.")

## References
- `references/REFINEMENT_WORKFLOW.md`
- `examples/`
