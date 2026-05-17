import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { VSCodeScanner } from '../scanners/vscode-scanner.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('VSCodeScanner', () => {
  test('detect returns true for vscode project', () => {
    const scanner = new VSCodeScanner();
    assert.equal(scanner.detect(join(fixturesDir, 'vscode-project')), true);
  });

  test('detect returns false for vanilla project', () => {
    const scanner = new VSCodeScanner();
    assert.equal(scanner.detect(join(fixturesDir, 'vanilla-project')), false);
  });

  test('scan returns correct platform name', () => {
    const scanner = new VSCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'vscode-project'));
    assert.equal(result.platform, 'vscode');
    assert.equal(result.detected, true);
  });

  test('scan discovers agents from .github/agents/', () => {
    const scanner = new VSCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'vscode-project'));
    assert.ok(result.agents.length >= 1);
    assert.ok(result.agents.some(a => a.name === 'database-specialist'));
  });

  test('scan discovers skills from .github/skills/', () => {
    const scanner = new VSCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'vscode-project'));
    assert.ok(result.skills.length >= 1);
    assert.ok(result.skills.some(s => s.name === 'database'));
  });

  test('scan detects copilot-instructions.md', () => {
    const scanner = new VSCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'vscode-project'));
    assert.equal(result.platformMeta.hasCopilotInstructions, true);
  });

  test('scan returns native capabilities for vscode', () => {
    const scanner = new VSCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'vscode-project'));
    assert.equal(result.nativeCapabilities.subagents, false);
    assert.equal(result.nativeCapabilities.mcp, false);
    assert.equal(result.nativeCapabilities.customTools, false);
  });
});
