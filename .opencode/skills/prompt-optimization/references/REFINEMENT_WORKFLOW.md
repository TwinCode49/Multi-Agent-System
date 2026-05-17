# Prompt Refinement Workflow

## Iterative Process

```
v1: [draft prompt] → Test (5 inputs)
v2: [fix top 3 issues] → Test (10 inputs)
v3: [token optimize] → Test (10 inputs)
v4: [A/B with v2] → Compare metrics → Final
```

## Self-Critique Loop

After writing a prompt, check:

1. **Clarity**: Is the task a single imperative sentence?
2. **Constraints**: Are boundaries explicit?
3. **Format**: Is the output shape described or templated?
4. **Conciseness**: Can I remove 20% of tokens without losing meaning?
5. **Edge cases**: What happens on empty input? Invalid input? Missing context?

## Example: Refining a Code Review Prompt

### v1 (verbose, unstructured)
```
Please look at this code and tell me if there are any problems with it. Think about best practices and potential bugs. Maybe also check the naming conventions. Thanks!
```

### v2 (structured)
```
Review this TypeScript code. List issues in order of severity:
- Critical: bugs or security
- Major: best practice violations
- Minor: style or naming

For each: file, line, problem, suggestion.
Skip issues you are not confident about.
```

### v3 (optimized, production)
```
Review this TypeScript code. Return JSON array:
[{
  "severity": "critical"|"major"|"minor",
  "line": number,
  "problem": "string (max 100 chars)",
  "suggestion": "string (max 100 chars)"
}]

Rules:
- Skip if uncertain
- Max 10 items
- Reference exact line numbers
```

## Evaluation Template

```markdown
## Prompt Evaluation

### Variant: [name]
### Test runs: 10

| Metric | Result | Target |
|---|---|---|
| Format compliance | 90% (9/10) | 100% |
| Avg input tokens | 142 | <200 |
| Avg output tokens | 86 | <150 |
| Correctness | 80% (8/10) | 90% |
| Hallucinations | 0 | 0 |

### Issues Found
1. [issue and fix]
2. [issue and fix]

### Verdict: [accept | iterate | reject]
```
