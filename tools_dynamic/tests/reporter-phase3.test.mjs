import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Reporter } from '../core/reporter.mjs';

function makeAgent(overrides = {}) {
  return {
    name: overrides.name || 'test-agent',
    role: overrides.role || 'Tester',
    mode: overrides.mode || 'subagent',
    keywords: overrides.keywords || ['test', 'spec'],
    sections: overrides.sections || ['Core Responsibilities', 'Constraints'],
    hasHandoff: overrides.hasHandoff ?? false,
    permissions: overrides.permissions || { edit: 'allow', bash: 'allow' },
    filePath: overrides.filePath || '.opencode/agents/test-agent.md',
  };
}

function makeSkill(overrides = {}) {
  return {
    name: overrides.name || 'testing',
    keywords: overrides.keywords || ['test'],
    references: overrides.references || [],
    filePath: overrides.filePath || '.opencode/skills/testing/SKILL.md',
    crossPlatformSynced: overrides.crossPlatformSynced ?? false,
  };
}

function makeWorkflow(overrides = {}) {
  return {
    name: overrides.name || 'test-wf',
    steps: overrides.steps ?? 2,
    agents: overrides.agents || ['agent1', 'agent2'],
    filePath: overrides.filePath || 'definitions/test-wf.json',
  };
}

function makePlatform(overrides = {}) {
  return {
    platform: overrides.platform || 'opencode',
    platformVersion: overrides.platformVersion || '1.0',
    detected: overrides.detected ?? true,
    agents: overrides.agents || [makeAgent({ name: 'agent1', hasHandoff: true, keywords: ['review', 'audit', 'quality', 'security', 'perf', 'lint', 'style', 'refactor', 'code', 'check'] })],
    skills: overrides.skills || [],
    workflows: overrides.workflows || [],
    existingTools: overrides.existingTools || [],
    configPaths: overrides.configPaths || ['.opencode'],
    nativeCapabilities: overrides.nativeCapabilities || { subagents: false, agentTeams: false, parallelExecution: false, hooks: false, mcp: false, customTools: true },
    platformMeta: overrides.platformMeta || {},
  };
}

describe('Reporter Phase 3', () => {
  it('toJSON includes per-agent recommendations', () => {
    const reporter = new Reporter();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'test-agent', keywords: ['test'], sections: ['Core'], hasHandoff: false })],
    });
    const json = JSON.parse(reporter.toJSON([platform], '/test'));
    const agentData = json.platforms[0].agents.list[0];
    assert.ok(agentData.recommendations);
    assert.ok(agentData.recommendations.length > 0);
    assert.ok(agentData.recommendations.some(r => r.includes('TRIGGER KEYWORDS')));
  });

  it('toJSON includes per-skill recommendations', () => {
    const reporter = new Reporter();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'agent1', hasHandoff: true, keywords: Array(10).fill('kw') })],
      skills: [makeSkill({ name: 'test-skill', keywords: ['test'], references: [] })],
    });
    const json = JSON.parse(reporter.toJSON([platform], '/test'));
    const skillData = json.platforms[0].skills.list[0];
    assert.ok(skillData.recommendations);
    assert.ok(skillData.recommendations.some(r => r.includes('TRIGGER KEYWORDS')));
  });

  it('toJSON includes suggested workflows', () => {
    const reporter = new Reporter();
    const platform = makePlatform({
      agents: [
        makeAgent({ name: 'reviewer1', keywords: Array(10).fill('review'), hasHandoff: true }),
        makeAgent({ name: 'writer1', keywords: Array(10).fill('doc'), hasHandoff: true }),
      ],
    });
    const json = JSON.parse(reporter.toJSON([platform], '/test'));
    assert.ok(json.platforms[0].workflows.suggested);
    assert.ok(json.platforms[0].workflows.suggested.length >= 1);
  });

  it('toJSON summary includes blockers/warnings/suggestions', () => {
    const reporter = new Reporter();
    const platform = makePlatform();
    const json = JSON.parse(reporter.toJSON([platform], '/test'));
    assert.ok(typeof json.summary.blockers === 'number');
    assert.ok(typeof json.summary.warnings === 'number');
    assert.ok(typeof json.summary.suggestions === 'number');
    assert.equal(json.summary.blockers, 0);
  });

  it('toJSON includes issues array', () => {
    const reporter = new Reporter();
    const platform = makePlatform();
    const json = JSON.parse(reporter.toJSON([platform], '/test'));
    assert.ok(Array.isArray(json.issues));
    assert.ok(Array.isArray(json.recommendations));
  });

  it('diagnose detects bloqueante for dispatch matrix mismatch', () => {
    const reporter = new Reporter();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'existing-agent', hasHandoff: true, keywords: Array(10).fill('kw') })],
      platformMeta: {
        dispatchMatrix: {
          somekey: 'nonexistent-agent',
        },
      },
    });
    const issues = reporter.diagnose([platform]);
    const blocker = issues.find(i => i.severity === 'blocker');
    assert.ok(blocker, 'Should have a blocker issue');
    assert.ok(blocker.message.includes('nonexistent-agent'));
  });

  it('diagnose adds info for agents with few keywords', () => {
    const reporter = new Reporter();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'minimal', keywords: ['test'], hasHandoff: false })],
    });
    const issues = reporter.diagnose([platform]);
    const kwIssue = issues.find(i => i.message.includes('dispatch matching'));
    assert.ok(kwIssue);
    assert.equal(kwIssue.severity, 'info');
  });

  it('diagnose detects missing tools', () => {
    const reporter = new Reporter();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'agent1', hasHandoff: true, keywords: Array(10).fill('kw') })],
      existingTools: [],
    });
    const issues = reporter.diagnose([platform]);
    const toolIssue = issues.find(i => i.message.includes('Missing recommended tools'));
    assert.ok(toolIssue);
    assert.equal(toolIssue.severity, 'info');
  });

  it('_buildSummary includes blocker/warning/suggestion counts', () => {
    const reporter = new Reporter();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'bad-agent', keywords: ['test'], sections: ['Core'], hasHandoff: false })],
    });
    const summary = reporter._buildSummary([platform]);
    assert.ok(typeof summary.blockers === 'number');
    assert.ok(typeof summary.warnings === 'number');
    assert.ok(typeof summary.suggestions === 'number');
    assert.ok(summary.warnings >= 2);
  });

  it('toHTML includes recommendations section', () => {
    const reporter = new Reporter();
    const platform = makePlatform();
    const html = reporter.toHTML([platform], '/test');
    assert.ok(html.includes('Recommendations'));
    assert.ok(html.includes('<!DOCTYPE html>'));
  });
});
