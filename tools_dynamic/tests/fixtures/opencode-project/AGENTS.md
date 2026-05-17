# Project Orchestration Rules

## Keyword-to-Agent Dispatch Matrix

| Trigger Keywords | Secondary Agent | Dispatch Mode |
|---|---|---|
| database, SQL, query, schema, migration | @database-specialist | auto |
| test, coverage, spec, pytest, jest | @test-engineer | auto |
| UI, UX, component, layout, responsive | @ui-specialist | auto |

## Auto-Dispatch Rules

1. When a task context matches one or more keyword rows, the primary agent MUST dispatch
2. Multiple agents can be dispatched if the task spans multiple domains
3. If no keywords match, the primary agent handles the task directly