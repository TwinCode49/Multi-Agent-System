import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Validator } from '../core/validator.mjs';

function makeAgent(overrides = {}) {
  return {
    name: overrides.name || 'test-agent',
    role: overrides.role || 'Tester',
    mode: overrides.mode || 'subagent',
    keywords: overrides.keywords || ['test', 'spec'],
    sections: overrides.sections || ['Core'],
    hasHandoff: overrides.hasHandoff ?? true,
    permissions: overrides.permissions || { edit: 'allow', bash: 'allow' },
    filePath: overrides.filePath || '.opencode/agents/test-agent.md',
    skills: overrides.skills || [],
  };
}

function makeSkill(overrides = {}) {
  return {
    name: overrides.name || 'testing',
    keywords: overrides.keywords || ['test', 'spec', 'coverage'],
    references: overrides.references || [],
    filePath: overrides.filePath || '.opencode/skills/testing/SKILL.md',
    crossPlatformSynced: overrides.crossPlatformSynced ?? false,
    agents: overrides.agents || [],
  };
}

function makeWorkflow(overrides = {}) {
  return {
    name: overrides.name || 'test-wf',
    steps: overrides.steps ?? 2,
    agents: overrides.agents || ['test-agent'],
    filePath: overrides.filePath || 'definitions/test-wf.json',
  };
}

function makePlatform(overrides = {}) {
  return {
    platform: overrides.platform || 'opencode',
    platformVersion: overrides.platformVersion || '1.0',
    detected: overrides.detected ?? true,
    agents: overrides.agents || [],
    skills: overrides.skills || [],
    workflows: overrides.workflows || [],
    existingTools: overrides.existingTools || [],
    configPaths: overrides.configPaths || ['.opencode'],
    nativeCapabilities: overrides.nativeCapabilities || {},
    platformMeta: overrides.platformMeta || {},
  };
}

describe('Validator', () => {
  test('check 1: detects orphan skills (not referenced by any agent)', () => {
    const validator = new Validator();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'agent-a', skills: [] })],
      skills: [makeSkill({ name: 'orphan-skill', agents: [] })],
    });
    const issues = validator.validate([platform]);
    const orphan = issues.find(i => i.type === 'orphan-skill');
    assert.ok(orphan);
    assert.equal(orphan.severity, 'warning');
    assert.equal(orphan.skill, 'orphan-skill');
  });

  test('check 1: does not flag referenced skills', () => {
    const validator = new Validator();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'agent-a', skills: ['referenced-skill'] })],
      skills: [makeSkill({ name: 'referenced-skill', agents: ['agent-a'] })],
    });
    const issues = validator.validate([platform]);
    const orphan = issues.find(i => i.type === 'orphan-skill');
    assert.ok(!orphan);
  });

  test('check 2: detects broken skill refs (blocker)', () => {
    const validator = new Validator();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'agent-a', skills: ['nonexistent-skill'] })],
      skills: [makeSkill({ name: 'existing-skill', agents: [] })],
    });
    const issues = validator.validate([platform]);
    const broken = issues.find(i => i.type === 'broken-skill-ref');
    assert.ok(broken);
    assert.equal(broken.severity, 'blocker');
    assert.equal(broken.agent, 'agent-a');
    assert.equal(broken.skill, 'nonexistent-skill');
  });

  test('check 3: detects subagents without skills', () => {
    const validator = new Validator();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'skilless-subagent', mode: 'subagent', skills: [] })],
    });
    const issues = validator.validate([platform]);
    const noSkill = issues.find(i => i.type === 'subagent-no-skills');
    assert.ok(noSkill);
    assert.equal(noSkill.severity, 'warning');
    assert.equal(noSkill.agent, 'skilless-subagent');
  });

  test('check 3: does not flag subagents with skills', () => {
    const validator = new Validator();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'skilled-subagent', mode: 'subagent', skills: ['some-skill'] })],
    });
    const issues = validator.validate([platform]);
    const noSkill = issues.find(i => i.type === 'subagent-no-skills');
    assert.ok(!noSkill);
  });

  test('check 4: detects workflow agents that no longer exist', () => {
    const validator = new Validator();
    const platform = makePlatform({
      agents: [makeAgent({ name: 'existing-agent', skills: [] })],
      workflows: [makeWorkflow({ name: 'old-wf', agents: ['existing-agent', 'ghost-agent'] })],
    });
    const issues = validator.validate([platform]);
    const ghost = issues.find(i => i.type === 'workflow-orphan-agent');
    assert.ok(ghost);
    assert.equal(ghost.severity, 'warning');
    assert.equal(ghost.agent, 'ghost-agent');
  });

  test('check 5: detects keyword-skill mismatch with low confidence', () => {
    const validator = new Validator();
    const agent = makeAgent({ name: 'mismatch-agent', skills: ['barely-match'], keywords: ['review', 'quality'] });
    const skill = makeSkill({ name: 'barely-match', keywords: ['test', 'xyz', 'zzz'], agents: ['mismatch-agent'] });
    const platform = makePlatform({ agents: [agent], skills: [skill] });
    const issues = validator.validate([platform]);
    const mismatch = issues.find(i => i.type === 'keyword-skill-mismatch');
    assert.ok(mismatch);
    assert.equal(mismatch.severity, 'info');
  });

  test('check 6: detects unclassified agents', () => {
    const validator = new Validator();
    const agent = makeAgent({ name: 'weird-agent', keywords: ['foo', 'bar'], skills: ['weird-skill'] });
    const skill = makeSkill({ name: 'weird-skill', keywords: ['xyz'], agents: ['weird-agent'] });
    const platform = makePlatform({ agents: [agent], skills: [skill] });
    const issues = validator.validate([platform]);
    const unclassified = issues.find(i => i.type === 'unclassified-agent');
    assert.ok(unclassified);
    assert.equal(unclassified.severity, 'info');
  });

  test('check 7: detects low confidence agents', () => {
    const validator = new Validator();
    const agent = makeAgent({ name: 'lowconf-agent', skills: ['barely-skill'], keywords: ['a', 'b'] });
    const skill = makeSkill({
      name: 'barely-skill',
      keywords: ['review', 'a', 'b'],
      agents: ['lowconf-agent'],
    });
    const platform = makePlatform({ agents: [agent], skills: [skill] });
    const issues = validator.validate([platform]);
    const lowConf = issues.find(i => i.type === 'low-confidence-agent');
    assert.ok(lowConf);
    assert.equal(lowConf.severity, 'info');
  });

  test('check 8: detects cross-platform drift', () => {
    const validator = new Validator();
    const agent = makeAgent({ name: 'agent-a', skills: ['drifted-skill'] });
    const skillA = makeSkill({
      name: 'drifted-skill',
      keywords: ['test', 'spec'],
      agents: ['agent-a'],
    });
    const skillB = makeSkill({
      name: 'drifted-skill',
      keywords: ['test', 'spec', 'coverage'],
      agents: [],
    });
    const platformA = makePlatform({ platform: 'opencode', agents: [agent], skills: [skillA] });
    const platformB = makePlatform({ platform: 'vscode', agents: [], skills: [skillB] });
    const issues = validator.validate([platformA, platformB]);
    const drift = issues.find(i => i.type === 'cross-platform-drift');
    assert.ok(drift);
    assert.equal(drift.severity, 'warning');
  });

  test('empty platforms produce no issues', () => {
    const validator = new Validator();
    const issues = validator.validate([]);
    assert.equal(issues.length, 0);
  });

  test('well-configured platform produces no issues', () => {
    const validator = new Validator();
    const agent = makeAgent({
      name: 'good-agent',
      skills: ['good-skill'],
      keywords: ['test', 'spec', 'coverage', 'unittest', 'jest', 'pytest', 'assert', 'tdd', 'bdd', 'integration'],
    });
    const skill = makeSkill({
      name: 'good-skill',
      keywords: ['test', 'spec', 'coverage', 'unittest', 'jest', 'pytest', 'assert', 'tdd', 'bdd', 'integration'],
      agents: ['good-agent'],
    });
    const platform = makePlatform({
      agents: [agent],
      skills: [skill],
      workflows: [makeWorkflow({ name: 'good-wf', agents: ['good-agent'] })],
    });
    const issues = validator.validate([platform]);
    const relevant = issues.filter(i => i.platform === 'opencode');
    assert.equal(relevant.length, 0);
  });

  test('--json output is parseable', () => {
    const validator = new Validator();
    const orphanSkill = makeSkill({ name: 'orphan', agents: [] });
    const platform = makePlatform({
      agents: [makeAgent({ name: 'no-skill-agent', mode: 'subagent', skills: [] })],
      skills: [orphanSkill],
    });
    const issues = validator.validate([platform]);
    const json = JSON.stringify({
      issues,
      summary: {
        total: issues.length,
        blockers: issues.filter(i => i.severity === 'blocker').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        infos: issues.filter(i => i.severity === 'info').length,
      },
    });
    const parsed = JSON.parse(json);
    assert.ok(parsed.issues.length >= 1);
    assert.equal(parsed.summary.blockers, 0);
    const hasSubagentIssue = parsed.issues.some(i => i.type === 'subagent-no-skills');
    assert.ok(hasSubagentIssue);
  });
});
