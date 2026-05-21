import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { ClaudeScanner } from '../scanners/claude-scanner.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('ClaudeScanner', () => {
  test('detect returns true for claude project', () => {
    const scanner = new ClaudeScanner();
    assert.equal(scanner.detect(join(fixturesDir, 'claude-project')), true);
  });

  test('detect returns false for vanilla project', () => {
    const scanner = new ClaudeScanner();
    assert.equal(scanner.detect(join(fixturesDir, 'vanilla-project')), false);
  });

  test('scan returns correct platform name', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.equal(result.platform, 'claude');
    assert.equal(result.detected, true);
  });

  test('scan discovers agents from .claude/agents/', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.agents.length >= 1);
    assert.ok(result.agents.some(a => a.name === 'database-specialist'));
  });

  test('scan discovers skills from .claude/skills/', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.skills.length >= 1);
    assert.ok(result.skills.some(s => s.name === 'database'));
  });

  test('scan parses settings.json', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.platformMeta.settings);
    assert.equal(result.platformMeta.settings.autoMemoryEnabled, true);
  });

  test('scan discovers rules', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.platformMeta.rules.length >= 1);
  });

  test('scan detects MCP servers from mcp.json', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.platformMeta.mcpServers);
    assert.ok(result.platformMeta.mcpServers.includes('filesystem'));
  });

  test('scan parses CLAUDE.md sections', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.platformMeta.claudeMdSections.includes('Tools'));
    assert.ok(result.platformMeta.claudeMdSections.includes('Guidelines'));
    assert.ok(result.platformMeta.claudeMdSections.includes('Skills'));
  });

  test('scan returns native capabilities for claude', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.equal(result.nativeCapabilities.subagents, true);
    assert.equal(result.nativeCapabilities.agentTeams, true);
    assert.equal(result.nativeCapabilities.parallelExecution, true);
    assert.equal(result.nativeCapabilities.hooks, true);
    assert.equal(result.nativeCapabilities.mcp, true);
    assert.equal(result.nativeCapabilities.customTools, true);
  });

  test('scan returns config paths', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.configPaths.length >= 3);
    assert.ok(result.configPaths.some(p => p.endsWith('CLAUDE.md')));
    assert.ok(result.configPaths.some(p => p.endsWith('settings.json')));
    assert.ok(result.configPaths.some(p => p.endsWith('mcp.json')));
  });

  test('scan discovers agents from .agent/rules/', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.agents.some(a => a.name === 'reviewer'));
  });

  test('scan discovers skills from .agent/skills/', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.skills.some(s => s.name === 'security'));
  });

  test('scan discovers skill references from .agent/skills/', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    const secSkill = result.skills.find(s => s.name === 'security');
    assert.ok(secSkill);
    assert.ok(secSkill.references.length >= 1);
  });

  test('scan includes .agent in configPaths', () => {
    const scanner = new ClaudeScanner();
    const result = scanner.scan(join(fixturesDir, 'claude-project'));
    assert.ok(result.configPaths.some(p => p.includes('.agent')));
  });
});
