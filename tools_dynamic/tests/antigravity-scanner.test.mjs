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

  test('detect returns true for antigravity rules dir project', () => {
    const scanner = new AntigravityScanner();
    assert.equal(scanner.detect(join(fixturesDir, 'antigravity-rules-project')), true);
  });

  test('scan discovers agents from .agent/rules/ .md files', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-rules-project'));
    assert.ok(result.agents.length >= 2);
    assert.ok(result.agents.some(a => a.name === 'general'));
    assert.ok(result.agents.some(a => a.name === 'database-specialist'));
  });

  test('scan discovers skills from .agent/rules/ subdirectories with SKILL.md', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-rules-project'));
    assert.ok(result.skills.length >= 2);
    assert.ok(result.skills.some(s => s.name === 'testing'));
    assert.ok(result.skills.some(s => s.name === 'general'));
  });

  test('scan discovers skill references from .agent/rules/', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-rules-project'));
    const testingSkill = result.skills.find(s => s.name === 'testing');
    assert.ok(testingSkill);
    assert.ok(testingSkill.references.length >= 1);
  });

  test('scan returns configPaths containing .agent/', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-rules-project'));
    assert.ok(result.configPaths.some(p => p.includes('.agent')));
  });

  test('scan discovers agents from .agent/agents/', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-rules-project'));
    assert.ok(result.agents.some(a => a.name === 'deployment'));
  });

  test('scan discovers skills from .agent/skills/', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-rules-project'));
    assert.ok(result.skills.some(s => s.name === 'logging'));
  });

  test('scan discovers skill references from .agent/skills/', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-rules-project'));
    const logSkill = result.skills.find(s => s.name === 'logging');
    assert.ok(logSkill);
    assert.ok(logSkill.references.length >= 1);
  });

  test('scan hybrid merges agents/skills from both .agent and .agents', () => {
    const scanner = new AntigravityScanner();
    const result = scanner.scan(join(fixturesDir, 'antigravity-rules-project'));

    // Agents from .agent still found
    assert.ok(result.agents.some(a => a.name === 'database-specialist'), 'database-specialist from .agent');
    assert.ok(result.agents.some(a => a.name === 'deployment'), 'deployment from .agent/agents/');

    // Agents from .agents found
    assert.ok(result.agents.some(a => a.name === 'architect'), 'architect from .agents');

    // Plural takes precedence for duplicate names
    const generalAgent = result.agents.find(a => a.name === 'general');
    assert.ok(generalAgent, 'general agent exists');
    assert.ok(generalAgent.role.includes('plural'), 'general agent role is from .agents (plural convention)');

    // Skills from .agents
    assert.ok(result.skills.some(s => s.name === 'database'), 'database skill from .agents');
    assert.ok(result.skills.some(s => s.name === 'devops'), 'devops skill from .agents');

    // Skills from .agent still found
    assert.ok(result.skills.some(s => s.name === 'testing'), 'testing skill from .agent');
    assert.ok(result.skills.some(s => s.name === 'logging'), 'logging skill from .agent');

    // configPaths uses .agents (unified path)
    assert.ok(result.configPaths.some(p => p.includes('.agents')), 'configPaths contains .agents');
  });
});
