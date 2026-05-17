import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { AntigravityScanner } from '../scanners/antigravity-scanner.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('AntigravityScanner', () => {
  test('detect returns true for antigravity yaml project', () => {
    const scanner = new AntigravityScanner();
    assert.equal(scanner.detect(join(fixturesDir, 'antigravity-project')), true);
  });

  test('detect returns false for vanilla project', () => {
    const scanner = new AntigravityScanner();
    assert.equal(scanner.detect(join(fixturesDir, 'vanilla-project')), false);
  });

  test('scan returns correct platform name', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-project'));
    assert.equal(result.platform, 'antigravity');
    assert.equal(result.detected, true);
  });

  test('scan discovers agents from antigravity.yaml', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-project'));
    assert.ok(result.agents.length >= 2);
    assert.ok(result.agents.some(a => a.name === 'database-specialist'));
    assert.ok(result.agents.some(a => a.name === 'test-engineer'));
  });

  test('scan discovers skills from antigravity.yaml', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-project'));
    assert.ok(result.skills.length >= 2);
    assert.ok(result.skills.some(s => s.name === 'database'));
  });

  test('scan detects existing tools', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-project'));
    assert.ok(result.existingTools.includes('agent-testing'));
    assert.ok(result.existingTools.includes('agent-metrics'));
  });

  test('scan returns native capabilities for antigravity', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-project'));
    assert.equal(result.nativeCapabilities.subagents, false);
    assert.equal(result.nativeCapabilities.mcp, false);
    assert.equal(result.nativeCapabilities.customTools, false);
  });
});
