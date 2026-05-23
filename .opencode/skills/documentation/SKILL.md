---
name: documentation
description: >
  TRIGGER KEYWORDS: document, documentation, README, CHANGELOG, changelog,
  migration-guide, API-doc, api-docs, swagger, openapi, JSDoc, mermaid,
  diagram, ADR, architecture-decision, code-comment, user-guide, docstring.
  MUST be used when creating or updating any project documentation.
  Guides the generation of README files, CHANGELOG entries, API documentation,
  Mermaid diagrams, migration guides, and code comments following industry
  best practices and project conventions.
---

# Documentation Skill

## Goal
Create clear, maintainable documentation that serves both end users and contributors effectively.

## Documentation Types
- **README** — Project overview, setup, usage, contributing
- **API Docs** — Endpoint specs, request/response schemas, auth
- **Architecture** — ADRs, system diagrams, data flow
- **Changelog** — Version history, breaking changes, migration notes
- **Code Docs** — JSDoc, docstrings, inline comments

## Structure Guidelines
- Keep README focused on getting started
- Maintain a single source of truth, avoid duplication
- Use Mermaid for diagrams (flowcharts, sequence diagrams, class diagrams)
- Write for the target audience level

## Constraints
- Do NOT document implementation details that change frequently
- Do NOT duplicate information across multiple files
- Do NOT use jargon without explanation
- Do NOT generate placeholder documentation
