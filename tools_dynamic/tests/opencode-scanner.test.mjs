import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { OpenCodeScanner } from '../scanners/opencode-scanner.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('OpenCodeScanner', () => {
  test('detect returns true for opencode project', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.detect(join(fixturesDir, 'opencode-project'));
    assert.equal(result, true);
  });

  test('detect returns false for vanilla project', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.detect(join(fixturesDir, 'vanilla-project'));
    assert.equal(result, false);
  });

  test('scan returns correct platform name', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.equal(result.platform, 'opencode');
    assert.equal(result.detected, true);
  });

  test('scan discovers agents from .opencode/agents/', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.ok(result.agents.length >= 3);
    const names = result.agents.map(a => a.name);
    assert.ok(names.includes('database-specialist'));
    assert.ok(names.includes('test-engineer'));
    assert.ok(names.includes('ui-specialist'));
  });

  test('scan discovers skills from .opencode/skills/', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.ok(result.skills.length >= 1);
    assert.ok(result.skills.some(s => s.name === 'database'));
  });

  test('scan parses dispatch matrix from AGENTS.md', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.ok(result.platformMeta.dispatchMatrix);
    assert.equal(result.platformMeta.dispatchMatrix['database'], 'database-specialist');
  });

  test('scan returns native capabilities for opencode', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.equal(result.nativeCapabilities.customTools, true);
    assert.equal(result.nativeCapabilities.subagents, false);
    assert.equal(result.nativeCapabilities.agentTeams, false);
  });

  test('scan detects agent keywords from frontmatter', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    const dbAgent = result.agents.find(a => a.name === 'database-specialist');
    assert.ok(dbAgent.keywords.includes('database'));
    assert.ok(dbAgent.keywords.includes('sql'));
  });

  test('scan detects handoff protocol in agents', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    const dbAgent = result.agents.find(a => a.name === 'database-specialist');
    assert.equal(dbAgent.hasHandoff, true);
  });

  test('scan returns config paths', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.ok(result.configPaths.length > 0);
    assert.ok(result.configPaths.some(p => p.endsWith('opencode.json')));
    assert.ok(result.configPaths.some(p => p.endsWith('AGENTS.md')));
  });

  test('scan discovers agents from .agent/rules/', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.ok(result.agents.some(a => a.name === 'architect'));
  });

  test('scan discovers agents from .agent/agents/', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.ok(result.agents.some(a => a.name === 'security-specialist'));
  });

  test('scan discovers skills from .agent/skills/', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.ok(result.skills.some(s => s.name === 'cli-tooling'));
  });

  test('scan discovers skill references from .agent/skills/', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    const cliSkill = result.skills.find(s => s.name === 'cli-tooling');
    assert.ok(cliSkill);
    assert.ok(cliSkill.references.length >= 1);
  });

  test('scan includes .agent in configPaths', () => {
    const scanner = new OpenCodeScanner();
    const result = scanner.scan(join(fixturesDir, 'opencode-project'));
    assert.ok(result.configPaths.some(p => p.includes('.agent')));
  });
});
