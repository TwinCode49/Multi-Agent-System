import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Injector } from '../core/injector.mjs';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'fs';
import { join, dirname, sep } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_ROOT = join(__dirname, '..');

function norm(p) { return p.replace(/\\/g, '/'); }

describe('Injector', () => {
  let injector;
  let testTarget;

  before(() => {
    injector = new Injector();
    testTarget = join(TEST_ROOT, 'tests', 'fixtures', 'inject-target');
    if (!existsSync(testTarget)) {
      mkdirSync(testTarget, { recursive: true });
    }
    writeFileSync(join(testTarget, 'package.json'), JSON.stringify({ name: 'test-project' }), 'utf-8');
  });

  after(() => {
    try { rmSync(testTarget, { recursive: true, force: true }); } catch {}
  });

  describe('substitute', () => {
    it('replaces known variables', () => {
      assert.strictEqual(injector.substitute('Hello {{name}}!', { name: 'World' }), 'Hello World!');
    });

    it('leaves unknown variables unchanged', () => {
      assert.strictEqual(injector.substitute('{{a}} + {{b}}', { a: '1' }), '1 + {{b}}');
    });

    it('handles multiple occurrences', () => {
      assert.strictEqual(injector.substitute('{{x}}-{{x}}-{{x}}', { x: 'foo' }), 'foo-foo-foo');
    });

    it('handles empty variable map', () => {
      assert.strictEqual(injector.substitute('plain text', {}), 'plain text');
    });
  });

  describe('loadTemplate', () => {
    it('loads existing template file', () => {
      const content = injector.loadTemplate(join('tools', 'agent-testing', 'run.mjs'));
      assert.ok(content);
      assert.ok(content.includes('{{agentsDir}}'));
    });

    it('returns null for non-existent template', () => {
      assert.strictEqual(injector.loadTemplate('nonexistent/file.txt'), null);
    });
  });

  describe('resolveVariablesFromScan', () => {
    it('returns opencode defaults when no platforms', () => {
      const vars = injector.resolveVariablesFromScan([], '/some/path');
      assert.strictEqual(vars.agentsDir, '.opencode/agents');
      assert.strictEqual(vars.projectName, 'path');
    });

    it('returns claude paths for claude platform', () => {
      const vars = injector.resolveVariablesFromScan(
        [{ platform: 'claude', agents: [], skills: [] }],
        '/project'
      );
      assert.strictEqual(vars.agentsDir, '.claude/agents');
      assert.strictEqual(vars.skillsDir, '.claude/skills');
      assert.strictEqual(vars.platformDir, '.claude');
    });

    it('reads package.json for project name', () => {
      const vars = injector.resolveVariablesFromScan([], testTarget);
      assert.strictEqual(vars.projectName, 'test-project');
    });

    it('includes current year', () => {
      assert.strictEqual(injector.resolveVariablesFromScan([], '/path').year, '2026');
    });
  });

  describe('plan', () => {
    const mockScan = [{
      platform: 'opencode',
      agents: [
        { name: 'test-agent', keywords: ['test', 'spec'], mode: 'subagent', permissions: { edit: 'allow' }, sections: ['Core Responsibilities', 'Behavior Rules'], hasHandoff: true, filePath: '' },
        { name: 'review-agent', keywords: ['review', 'audit'], mode: 'subagent', permissions: { edit: 'deny' }, sections: ['Core Responsibilities'], hasHandoff: false, filePath: '' },
        { name: 'builder-agent', keywords: ['database', 'api', 'backend', 'server'], mode: 'subagent', permissions: { edit: 'allow' }, sections: ['Core Responsibilities'], hasHandoff: false, filePath: '' },
      ],
      skills: [{ name: 'testing', keywords: ['test'], filePath: '', references: [], crossPlatformSynced: false }],
      workflows: [],
      existingTools: [],
      configPaths: [],
      nativeCapabilities: { subagents: false, agentTeams: false, parallelExecution: false, hooks: false, mcp: false, customTools: true },
    }];
    let planTesting;
    let planAll;

    before(() => {
      planTesting = injector.plan(mockScan, testTarget, ['testing']);
      planAll = injector.plan(mockScan, testTarget, ['testing', 'metrics', 'workflows', 'processes']);
    });

    it('includes run.mjs for testing component', () => {
      const runMjs = planTesting.create.find(e => norm(e.path).endsWith('run.mjs'));
      assert.ok(runMjs, 'Should include run.mjs');
      assert.ok(runMjs.content.includes('.opencode/agents'), 'Should have substituted agentsDir');
    });

    it('includes cases directory for testing', () => {
      assert.ok(planTesting.directories.some(d => norm(d).includes('cases')), 'Should include cases dir');
    });

    it('generates test case files', () => {
      const cases = planTesting.create.filter(e => norm(e.path).includes('cases'));
      assert.ok(cases.length > 0, 'Should generate test case JSON files');
    });

    it('includes workflow executor for workflows component', () => {
      const executor = planAll.create.find(e => norm(e.path).endsWith('executor.mjs'));
      assert.ok(executor, 'Should include executor.mjs');
    });

    it('generates workflow definition files', () => {
      const wfDefs = planAll.create.filter(e => norm(e.path).includes('/definitions/'));
      assert.ok(wfDefs.length > 0, 'Should generate workflow definitions');
    });

    it('includes processes README', () => {
      const procReadme = planAll.create.find(e => norm(e.path).endsWith('processes/README.md'));
      assert.ok(procReadme, 'Should include processes README');
    });

    it('includes agentes documentation', () => {
      const agentesFiles = planAll.create.filter(e => norm(e.path).includes('/agentes/'));
      assert.ok(agentesFiles.length >= 4, 'Should include agentes docs');
    });

    it('includes agent-metrics files', () => {
      const metricsFiles = planAll.create.filter(e => norm(e.path).includes('agent-metrics'));
      assert.ok(metricsFiles.length > 0, 'Should include metrics files');
    });

    it('deduplicates directory entries', () => {
      const unique = new Set(planAll.directories.map(d => norm(d)));
      assert.strictEqual(planAll.directories.length, unique.size, 'Directories should be deduplicated');
    });

    it('produces Differ-compatible plan structure', () => {
      assert.ok(Array.isArray(planAll.create), 'Should have create array');
      assert.ok(Array.isArray(planAll.directories), 'Should have directories array');
      assert.ok(Array.isArray(planAll.modify), 'Should have modify array');
      for (const entry of planAll.create) {
        assert.ok(entry.path, 'Each create entry should have path');
        assert.ok(entry.content !== undefined, 'Each create entry should have content');
      }
    });

    it('plan with agents only does not inject skills', () => {
      const testPlan = injector.plan(mockScan, testTarget, ['agents']);
      const hasSkills = testPlan.create.some(e => norm(e.path).includes('/skills/') || norm(e.path).includes('SKILL.md'));
      const hasConfig = testPlan.create.some(e => norm(e.path).includes('opencode.json'));
      assert.ok(!hasSkills, 'Should not inject skill files');
      assert.ok(!hasConfig, 'Should not inject platform config');
    });

    it('plan with skills only does not inject agents', () => {
      const testPlan = injector.plan(mockScan, testTarget, ['skills']);
      const hasAgents = testPlan.create.some(e => norm(e.path).includes('/agents/'));
      assert.ok(!hasAgents, 'Should not inject agent files');
    });

    it('plan with config bundle produces same result as agents+skills+platformConfig', () => {
      const bundlePlan = injector.plan(mockScan, testTarget, ['config']);
      const individualPlan = injector.plan(mockScan, testTarget, ['agents', 'skills', 'platformConfig']);
      const bundleCreatePaths = bundlePlan.create.map(e => norm(e.path)).sort();
      const individualCreatePaths = individualPlan.create.map(e => norm(e.path)).sort();
      assert.deepStrictEqual(bundleCreatePaths, individualCreatePaths, 'config bundle should match agents+skills+platformConfig');
    });

    it('combines AGENTS.md dynamically for multiple platforms', () => {
      const multiPlatformScan = [
        { platform: 'opencode', agents: [], skills: [], configPaths: [], nativeCapabilities: {} },
        { platform: 'antigravity', agents: [], skills: [], configPaths: [], nativeCapabilities: {} }
      ];
      const testPlan = injector.plan(multiPlatformScan, testTarget, ['config']);
      
      // Should modify or create AGENTS.md exactly once
      const agentsMdEntries = [...testPlan.create, ...testPlan.modify].filter(e => e.path === 'AGENTS.md');
      assert.strictEqual(agentsMdEntries.length, 1, 'Should schedule AGENTS.md exactly once');
      
      const agentsMdContent = agentsMdEntries[0].content;
      assert.ok(agentsMdContent.includes('opencode.json'), 'Should include opencode.json reference');
      assert.ok(agentsMdContent.includes('GEMINI.md'), 'Should include GEMINI.md reference');
      assert.ok(agentsMdContent.includes('Antigravity & Multi-Platform Project Rules'), 'Should have multi-platform title');
      assert.ok(agentsMdContent.includes('@context-steward'), 'Should have context-steward row');
    });
  });

  describe('regenerateWorkflows', () => {
    const mockPlatform = {
      platform: 'opencode',
      agents: [
        { name: 'test-agent', keywords: ['test', 'spec'], mode: 'subagent', permissions: { edit: 'allow' }, sections: ['Core'], hasHandoff: true, filePath: '', skills: [] },
        { name: 'review-agent', keywords: ['review', 'quality', 'audit'], mode: 'subagent', permissions: { edit: 'deny' }, sections: ['Core'], hasHandoff: true, filePath: '', skills: [] },
        { name: 'doc-agent', keywords: ['doc', 'readme', 'changelog'], mode: 'subagent', permissions: { edit: 'allow' }, sections: ['Core'], hasHandoff: true, filePath: '', skills: [] },
      ],
      skills: [{ name: 'testing', keywords: ['test'], filePath: '', references: [], crossPlatformSynced: false }],
      workflows: [],
      existingTools: ['testing', 'workflows'],
      configPaths: ['.opencode'],
      nativeCapabilities: { agentTeams: false },
      platformMeta: {},
    };

    it('produces workflow definition entries', () => {
      const entries = injector.regenerateWorkflows([mockPlatform]);
      const workflowEntries = entries.filter(e => e.path.includes('definitions'));
      assert.ok(workflowEntries.length >= 1, 'Should produce at least one workflow definition');
      for (const entry of workflowEntries) {
        const parsed = JSON.parse(entry.content);
        assert.ok(parsed.name, 'Each definition should have a name');
        assert.ok(Array.isArray(parsed.steps), 'Each definition should have steps');
      }
    });

    it('produces test case entries', () => {
      const entries = injector.regenerateWorkflows([mockPlatform]);
      const caseEntries = entries.filter(e => e.path.includes('cases'));
      assert.ok(caseEntries.length >= 1, 'Should produce at least one test case');
      for (const entry of caseEntries) {
        const parsed = JSON.parse(entry.content);
        assert.ok(parsed.name, 'Each test case should have a name');
        assert.ok(Array.isArray(parsed.skills), 'Each test case should have skills array');
      }
    });

    it('handles empty scan results', () => {
      const entries = injector.regenerateWorkflows([]);
      assert.equal(entries.length, 0);
    });
  });

  describe('execute', () => {
    const mockScan = [{
      platform: 'opencode',
      agents: [{ name: 'test-agent', keywords: ['test'], mode: 'subagent', permissions: { edit: 'allow' }, sections: ['Core'], hasHandoff: false, filePath: '' }],
      skills: [],
      workflows: [],
      existingTools: [],
      configPaths: [],
      nativeCapabilities: {},
    }];

    it('dry run does not create actual files on disk', () => {
      const plan = { directories: ['test-dir/'], create: [{ path: 'test-dir/file.txt', content: 'hello' }], modify: [] };
      const result = injector.execute(plan, testTarget, { dryRun: true });
      assert.ok(!existsSync(join(testTarget, 'test-dir', 'file.txt')), 'Should not create files on disk');
      assert.ok(!existsSync(join(testTarget, 'test-dir')), 'Should not create directories on disk');
      assert.strictEqual(result.directories.length, 1, 'Should report directory as planned');
      assert.strictEqual(result.created.length, 1, 'Should report file as planned');
      assert.strictEqual(result.modified.length, 0, 'Should not report modified files');
    });

    it('creates directories and files', () => {
      const plan = injector.plan(mockScan, testTarget, ['testing']);
      const result = injector.execute(plan, testTarget, { dryRun: false });

      assert.ok(result.created.length > 0, 'Should create files');
      assert.ok(result.directories.length > 0, 'Should create directories');

      for (const filePath of result.created) {
        const fullPath = join(testTarget, filePath);
        assert.ok(existsSync(fullPath), `File should exist: ${filePath}`);
      }

      rmSync(join(testTarget, 'tools'), { recursive: true, force: true });
    });

    it('can execute full plan (all components)', () => {
      const plan = injector.plan(mockScan, testTarget, ['testing', 'metrics', 'workflows', 'processes']);
      const result = injector.execute(plan, testTarget, { dryRun: false });

      assert.ok(result.created.length > 0, 'Should create files');
      assert.ok(result.directories.length > 0, 'Should create directories');

      rmSync(join(testTarget, 'tools'), { recursive: true, force: true });
      rmSync(join(testTarget, 'Docs'), { recursive: true, force: true });
    });

    it('backup works when modifying existing files', () => {
      const testFile = join(testTarget, 'existing.txt');
      writeFileSync(testFile, 'original content', 'utf-8');

      const plan = { directories: [], create: [{ path: 'existing.txt', content: 'modified content' }], modify: [] };
      const result = injector.execute(plan, testTarget, { dryRun: false });

      assert.ok(result.modified.includes('existing.txt'), 'Should show as modified');
      assert.ok(result.backedUp.length > 0, 'Should have backup');
      assert.ok(existsSync(result.backedUp[0].backupPath), 'Backup file should exist');

      const backupContent = readFileSync(result.backedUp[0].backupPath, 'utf-8');
      assert.strictEqual(backupContent, 'original content', 'Backup should preserve original');

      rmSync(testFile, { force: true });
      for (const b of result.backedUp) rmSync(b.backupPath, { force: true });
    });

    it('skips backup when content matches existing', () => {
      const testFile = join(testTarget, 'same.txt');
      writeFileSync(testFile, 'same content', 'utf-8');

      const plan = { directories: [], create: [{ path: 'same.txt', content: 'same content' }], modify: [] };
      const result = injector.execute(plan, testTarget, { dryRun: false });

      assert.strictEqual(result.modified.length, 0, 'Should not modify when content matches');

      rmSync(testFile, { force: true });
    });
  });
});
