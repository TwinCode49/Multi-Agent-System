import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { Scanner } from '../scanners/scanner.mjs';
import { buildCrossIndex } from '../core/parser.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('Scanner orchestrator', () => {
  test('scan returns all detected platforms', () => {
    const scanner = new Scanner();
    const results = scanner.scan(join(fixturesDir, 'claude-project'));
    const detected = results.filter(r => r.detected);
    assert.ok(detected.length >= 1);
    assert.ok(detected.some(r => r.platform === 'claude'));
  });

  test('scanAll returns only detected platforms', () => {
    const scanner = new Scanner();
    const results = scanner.scanAll(join(fixturesDir, 'vanilla-project'));
    assert.equal(results.length, 0);
  });

  test('scanPrimary returns highest priority platform', () => {
    const scanner = new Scanner();
    const result = scanner.scanPrimary(join(fixturesDir, 'opencode-project'));
    assert.ok(result);
    assert.equal(result.platform, 'opencode');
  });

  test('scanPrimary falls through priority order', () => {
    const scanner = new Scanner();
    const result = scanner.scanPrimary(join(fixturesDir, 'claude-project'));
    assert.ok(result);
    assert.equal(result.platform, 'claude');
  });

  test('scanPrimary returns null for unknown project', () => {
    const scanner = new Scanner();
    const result = scanner.scanPrimary(join(fixturesDir, 'vanilla-project'));
    assert.equal(result, null);
  });

  test('scan handles project with multiple platforms', () => {
    const scanner = new Scanner();
    const results = scanner.scanAll(join(fixturesDir, 'opencode-project'));
    assert.equal(results.length, 2);
    assert.ok(results.some(r => r.platform === 'opencode'));
    assert.ok(results.some(r => r.platform === 'antigravity'));
  });

  test('scan returns empty array for vanilla project', () => {
    const scanner = new Scanner();
    const results = scanner.scan(join(fixturesDir, 'vanilla-project'));
    assert.equal(results.length, 0);
  });

  test('buildCrossIndex creates bidirectional links', () => {
    const agents = [
      { name: 'agent-a', skills: ['skill-1', 'skill-2'] },
      { name: 'agent-b', skills: ['skill-1'] },
    ];
    const skills = [
      { name: 'skill-1' },
      { name: 'skill-2' },
    ];
    buildCrossIndex(agents, skills);
    assert.deepEqual(agents[0].skills, ['skill-1', 'skill-2']);
    assert.deepEqual(agents[1].skills, ['skill-1']);
    assert.deepEqual(skills[0].agents, ['agent-a', 'agent-b']);
    assert.deepEqual(skills[1].agents, ['agent-a']);
  });

  test('buildCrossIndex handles empty inputs', () => {
    const agents = [];
    const skills = [];
    buildCrossIndex(agents, skills);
    assert.equal(agents.length, 0);
    assert.equal(skills.length, 0);
  });

  test('buildCrossIndex adds missing fields', () => {
    const agents = [{ name: 'test' }];
    const skills = [{ name: 'test-skill' }];
    buildCrossIndex(agents, skills);
    assert.ok(Array.isArray(agents[0].skills));
    assert.ok(Array.isArray(skills[0].agents));
    assert.equal(agents[0].skills.length, 0);
    assert.equal(skills[0].agents.length, 0);
  });
});
