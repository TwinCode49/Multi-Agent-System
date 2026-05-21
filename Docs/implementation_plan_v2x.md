# Implementation Plan — Establishing `.agents/` Plural Convention & Hybrid Scanning

This plan aims to establish `.agents/` as the primary, plural folder convention for AI agents and skills in the `tools_dynamic` project, aligning it with emerging industry standards like the **[agentskills.io](https://agentskills.io)** specification. It details the implementation of a robust hybrid scanner that seamlessly scans, merges, and unifies findings from both `.agent/` and `.agents/` directories.

## User Review Required

> [!IMPORTANT]
> **Key Architectural Decision — Plural by Default, Backward Compatible by Design:**
> - Going forward, newly bootstrapped `antigravity` configurations will generate `.agents/` folders (specifically `.agents/rules/` and `.agents/workflows/`) instead of `.agent/`.
> - Existing projects with singular `.agent/` directories will continue to be fully supported and scanned, with zero breaking changes for existing users.
> - The CLI and scanners will report all local AI configurations as unified under the `.agents/` path in scanner outputs (`configPaths`), which preserves backward compatibility with tests checking `.includes('.agent')`.

## Proposed Changes

---

### Core Engine

#### [MODIFY] [parser.mjs](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/tools_dynamic/core/parser.mjs)
- Modify `scanDotAgent(basePath)` to support hybrid scanning:
  - Define paths for both `.agents` and `.agent` subdirectories in the project workspace.
  - Scan the plural `.agents` folder first, followed by the singular `.agent` folder.
  - Merge the scanned agents and skills. When merging, ensure deduplication based on unique names, prioritizing definitions found in `.agents` over `.agent`.
  - Return the unified `{ agents, skills }` payload.

#### [MODIFY] [injector.mjs](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/tools_dynamic/core/injector.mjs)
- In `resolveVariablesFromScan(scanResults, targetPath)`:
  - Update the `antigravity` platform configuration block:
    - Change `platformDir` to `'.agents'` (previously `'.agent'`).
    - Change `agentsDir` to `'.agents/rules'` (previously `'.agent/rules'`).
    - Change `skillsDir` to `'.agents/rules'` (previously `'.agent/rules'`).

---

### Platform Scanners

#### [MODIFY] [antigravity-scanner.mjs](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/tools_dynamic/scanners/antigravity-scanner.mjs)
- In `detect(basePath)`:
  - Add detection of plural paths: `.agents/rules`, `.agents/agents`, and `.agents/skills`.
- In `scan(basePath)`:
  - If hybrid scanner results (`dotAgent`) contain any agents or skills, push the unified path `join(basePath, '.agents')` to `result.configPaths` (instead of the singular `.agent` path).

#### [MODIFY] [claude-scanner.mjs](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/tools_dynamic/scanners/claude-scanner.mjs)
- In `scan(basePath)`:
  - If hybrid scanner results contain agents/skills, push `join(basePath, '.agents')` to `result.configPaths` as the unified config path.

#### [MODIFY] [opencode-scanner.mjs](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/tools_dynamic/scanners/opencode-scanner.mjs)
- In `scan(basePath)`:
  - If hybrid scanner results contain agents/skills, push `join(basePath, '.agents')` to `result.configPaths` as the unified config path.

#### [MODIFY] [vscode-scanner.mjs](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/tools_dynamic/scanners/vscode-scanner.mjs)
- In `scan(basePath)`:
  - If hybrid scanner results contain agents/skills, push `join(basePath, '.agents')` to `result.configPaths` as the unified config path.

---

### Configuration & Templates

#### [MODIFY] [GEMINI.md](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/tools_dynamic/templates/config/antigravity/GEMINI.md)
- Update text references to point to the plural convention:
  - Change `.agent/rules/` to `.agents/rules/`.
  - Change `.agent/workflows/` to `.agents/workflows/`.

---

### Documentation & Logs

#### [MODIFY] [LOG_v2.md](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/Docs/logs/LOG_v2.md)
- Add a new log entry for `2026-05-21` documenting:
  - Decision to establish the plural `.agents/` convention.
  - Implementation of robust hybrid scanning to ensure complete backward compatibility.

---

### Automated Tests

#### [MODIFY] [antigravity-scanner.test.mjs](file:///D:/Proyectos/Multi-Agent-System/Multi-Agent-System/tools_dynamic/tests/antigravity-scanner.test.mjs)
- Add a new test case:
  - **`scan hybrid merges agents/skills from both .agent and .agents`**: Mock a setup (or define programmatically/physically in temporary space or using scanner scan mocks) that contains both `.agent/rules` and `.agents/rules` to assert they merge correctly with plural taking precedence.

## Verification Plan

### Automated Tests
- Run all unit tests to verify that scanner results are backwards compatible and all existing 136 tests pass perfectly:
  ```powershell
  node --test (Get-ChildItem tools_dynamic/tests/*.test.mjs).FullName
  ```

### Manual Verification
- Bootstrap a mock project using the modified injector with the `antigravity` platform, verifying that it now creates the plural `.agents/` folder structure.
- Verify that scanning a project with only `.agent/` still correctly parses and reports its agents and skills.
