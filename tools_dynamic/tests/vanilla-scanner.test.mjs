import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { VanillaScanner } from '../scanners/vanilla-scanner.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('VanillaScanner', () => {
  test('detect returns true for vanilla project', () => {
    const scanner = new VanillaScanner();
    const result = scanner.detect(join(fixturesDir, 'vanilla-project'));
    assert.equal(result, true);
  });

  test('detect returns false for opencode project', () => {
    const scanner = new VanillaScanner();
    const result = scanner.detect(join(fixturesDir, 'opencode-project'));
    assert.equal(result, false);
  });

  test('scan returns correct platform name', () => {
    const scanner = new VanillaScanner();
    const result = scanner.scan(join(fixturesDir, 'vanilla-project'));
    assert.equal(result.platform, 'vanilla');
    assert.equal(result.detected, true);
  });

  test('scan returns agents from .agents/agents/', () => {
    const scanner = new VanillaScanner();
    const result = scanner.scan(join(fixturesDir, 'vanilla-project'));
    assert.ok(result.agents.length >= 2);
    const names = result.agents.map(a => a.name);
    assert.ok(names.includes('code-reviewer'));
    assert.ok(names.includes('database-specialist'));
  });

  test('scan returns skills from .agents/skills/', () => {
    const scanner = new VanillaScanner();
    const result = scanner.scan(join(fixturesDir, 'vanilla-project'));
    assert.ok(result.skills.length >= 1);
    assert.ok(result.skills.some(s => s.name === 'testing'));
  });

  test('scan returns config paths', () => {
    const scanner = new VanillaScanner();
    const result = scanner.scan(join(fixturesDir, 'vanilla-project'));
    assert.ok(result.configPaths.length > 0);
    assert.ok(result.configPaths.some(p => p.endsWith('.agents')));
  });

  test('scan returns native capabilities for vanilla', () => {
    const scanner = new VanillaScanner();
    const result = scanner.scan(join(fixturesDir, 'vanilla-project'));
    assert.equal(result.nativeCapabilities.customTools, true);
    assert.equal(result.nativeCapabilities.mcp, false);
  });

  test('scan populates agent.skills field', () => {
    const scanner = new VanillaScanner();
    const result = scanner.scan(join(fixturesDir, 'vanilla-project'));
    for (const agent of result.agents) {
      assert.ok(Array.isArray(agent.skills));
    }
  });

  test('scan populates skill.agents field', () => {
    const scanner = new VanillaScanner();
    const result = scanner.scan(join(fixturesDir, 'vanilla-project'));
    for (const skill of result.skills) {
      assert.ok(Array.isArray(skill.agents));
    }
  });
});
