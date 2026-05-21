import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Injector } from '../core/injector.mjs';
import { existsSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_ROOT = join(__dirname, '..');
const testTarget = join(TEST_ROOT, 'tests', 'fixtures', 'update-target');

const mockPlatform = {
  platform: 'opencode',
  agents: [
    { name: 'test-agent', keywords: ['test', 'spec'], mode: 'subagent', permissions: { edit: 'allow' }, sections: ['Core'], hasHandoff: true, filePath: '', skills: ['testing'] },
    { name: 'review-agent', keywords: ['review', 'quality', 'audit'], mode: 'subagent', permissions: { edit: 'deny' }, sections: ['Core'], hasHandoff: true, filePath: '', skills: ['code-review'] },
    { name: 'doc-agent', keywords: ['doc', 'readme', 'changelog'], mode: 'subagent', permissions: { edit: 'allow' }, sections: ['Core'], hasHandoff: true, filePath: '', skills: ['doc-gen'] },
  ],
  skills: [
    { name: 'testing', keywords: ['test', 'spec', 'coverage'], agents: ['test-agent'], filePath: '', references: [], crossPlatformSynced: false },
    { name: 'code-review', keywords: ['review', 'quality', 'audit', 'lint'], agents: ['review-agent'], filePath: '', references: [], crossPlatformSynced: false },
    { name: 'doc-gen', keywords: ['doc', 'readme', 'changelog', 'apidoc'], agents: ['doc-agent'], filePath: '', references: [], crossPlatformSynced: false },
  ],
  workflows: [],
  existingTools: ['testing', 'workflows'],
  configPaths: ['.opencode'],
  nativeCapabilities: { agentTeams: false },
  platformMeta: {},
};

describe('Update command integration', () => {
  before(() => {
    if (!existsSync(testTarget)) {
      mkdirSync(testTarget, { recursive: true });
    }
    writeFileSync(join(testTarget, 'package.json'), JSON.stringify({ name: 'update-test' }), 'utf-8');
  });

  after(() => {
    try { rmSync(testTarget, { recursive: true, force: true }); } catch {}
  });

  test('regenerateWorkflows produces definitions and cases', () => {
    const injector = new Injector();
    const entries = injector.regenerateWorkflows([mockPlatform]);
    assert.ok(entries.length > 0);
    const hasDef = entries.some(e => e.path.includes('definitions'));
    const hasCase = entries.some(e => e.path.includes('cases'));
    assert.ok(hasDef);
    assert.ok(hasCase);
  });

  test('regenerateWorkflows definitions include step.skill field', () => {
    const injector = new Injector();
    const entries = injector.regenerateWorkflows([mockPlatform]);
    const defEntries = entries.filter(e => e.path.includes('definitions'));
    for (const entry of defEntries) {
      const parsed = JSON.parse(entry.content);
      for (const step of parsed.steps || []) {
        assert.ok('skill' in step, `Step ${step.id} should have skill field`);
      }
    }
  });

  test('execute with dry-run does not write files', () => {
    const injector = new Injector();
    const entries = injector.regenerateWorkflows([mockPlatform]);
    const plan = {
      directories: ['tools/agent-workflows/definitions/', 'tools/agent-testing/cases/'],
      create: entries,
      modify: [],
    };
    const result = injector.execute(plan, testTarget, { dryRun: true });
    assert.equal(result.created.length, entries.length, 'Should report all as planned');
    for (const entry of entries) {
      const fullPath = join(testTarget, entry.path);
      assert.ok(!existsSync(fullPath), `Should not create ${entry.path}`);
    }
  });

  test('execute writes files and skips backup when content matches', () => {
    const injector = new Injector();
    const entries = injector.regenerateWorkflows([mockPlatform]);
    const plan = {
      directories: ['tools/agent-workflows/definitions/', 'tools/agent-testing/cases/'],
      create: entries,
      modify: [],
    };

    // First run: create all files
    const result1 = injector.execute(plan, testTarget);
    assert.ok(result1.created.length > 0, 'First run should create files');
    assert.equal(result1.backedUp.length, 0, 'First run should not backup (files are new)');

    // Second run: content matches existing, should skip (no backup, no modification)
    const result2 = injector.execute(plan, testTarget);
    assert.equal(result2.backedUp.length, 0, 'No backup needed when content matches');
    assert.equal(result2.modified.length, 0, 'No modification when content matches');

    // Verify files still exist from first run
    for (const entry of entries) {
      const fullPath = join(testTarget, entry.path);
      assert.ok(existsSync(fullPath), `File should exist: ${entry.path}`);
      rmSync(fullPath, { force: true });
    }
  });
});
