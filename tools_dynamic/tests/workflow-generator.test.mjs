import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowGenerator } from '../core/workflow-generator.mjs';

describe('WorkflowGenerator', () => {
  const mockAgents = [
    { name: 'code-reviewer', role: 'Reviewer', keywords: ['review', 'quality', 'audit'], mode: 'subagent' },
    { name: 'security-reviewer', role: 'Security', keywords: ['security', 'vulnerability'], mode: 'subagent' },
    { name: 'doc-agent', role: 'Writer', keywords: ['doc', 'readme', 'changelog'], mode: 'subagent' },
    { name: 'database-specialist', role: 'DB', keywords: ['database', 'sql', 'schema'], mode: 'subagent' },
    { name: 'test-engineer', role: 'Tester', keywords: ['test', 'spec', 'coverage'], mode: 'subagent' },
  ];

  test('classifyAgents categorizes correctly', () => {
    const wfg = new WorkflowGenerator();
    const roles = wfg.classifyAgents(mockAgents);
    assert.equal(roles.reviewers.length, 2);
    assert.equal(roles.writers.length, 1);
    assert.equal(roles.builders.length, 1);
    assert.equal(roles.testers.length, 1);
  });

  test('generate produces review pipeline when reviewers + writers exist', () => {
    const wfg = new WorkflowGenerator();
    const scanResult = { agents: mockAgents, platform: 'opencode', nativeCapabilities: { agentTeams: false } };
    const workflows = wfg.generate(scanResult);
    assert.ok(workflows.some(w => w.name === 'review-pipeline'));
  });

  test('generate produces feature pipeline when builders + testers exist', () => {
    const wfg = new WorkflowGenerator();
    const scanResult = { agents: mockAgents, platform: 'opencode', nativeCapabilities: { agentTeams: false } };
    const workflows = wfg.generate(scanResult);
    assert.ok(workflows.some(w => w.name === 'feature-pipeline'));
  });

  test('generate produces docs generation when builders + writers exist', () => {
    const wfg = new WorkflowGenerator();
    const scanResult = { agents: mockAgents, platform: 'opencode', nativeCapabilities: { agentTeams: false } };
    const workflows = wfg.generate(scanResult);
    assert.ok(workflows.some(w => w.name === 'docs-generation'));
  });

  test('generate adds synthesizer when option is set', () => {
    const wfg = new WorkflowGenerator();
    const scanResult = { agents: mockAgents, platform: 'opencode', nativeCapabilities: { agentTeams: false } };
    const workflows = wfg.generate(scanResult, { orchestratorSynthesis: true });
    const reviewWf = workflows.find(w => w.name === 'review-pipeline');
    assert.ok(reviewWf.synthesizer);
    assert.equal(reviewWf.synthesizer.enabled, true);
  });

  test('generate returns executor-json format by default', () => {
    const wfg = new WorkflowGenerator();
    const scanResult = { agents: mockAgents, platform: 'opencode', nativeCapabilities: { agentTeams: false } };
    const workflows = wfg.generate(scanResult);
    assert.equal(workflows[0].format, 'executor-json');
  });

  test('suggestWorkflows returns suggestions', () => {
    const wfg = new WorkflowGenerator();
    const scanResult = { agents: mockAgents, platform: 'opencode' };
    const suggestions = wfg.suggestWorkflows(scanResult);
    assert.ok(suggestions.length >= 1);
    assert.ok(suggestions.some(s => s.name === 'full-review'));
  });

  test('generate handles empty agents', () => {
    const wfg = new WorkflowGenerator();
    const scanResult = { agents: [], platform: 'opencode', nativeCapabilities: { agentTeams: false } };
    const workflows = wfg.generate(scanResult);
    assert.equal(workflows.length, 0);
  });

  test('buildReviewPipeline creates correct step structure', () => {
    const wfg = new WorkflowGenerator();
    const roles = wfg.classifyAgents(mockAgents);
    const scanResult = { agents: mockAgents, platform: 'opencode' };
    const wf = wfg.buildReviewPipeline(roles, scanResult);
    assert.ok(wf.steps.length >= 2);
    const reviewSteps = wf.steps.filter(s => s.id.includes('review'));
    assert.ok(reviewSteps.length >= 1);
    const synthStep = wf.steps.find(s => s.id === 'synthesis');
    assert.ok(synthStep);
    assert.ok(synthStep.depends_on.length > 0);
  });

  test('buildFeaturePipeline creates builder → tester chain', () => {
    const wfg = new WorkflowGenerator();
    const roles = wfg.classifyAgents(mockAgents);
    const scanResult = { agents: mockAgents, platform: 'opencode' };
    const wf = wfg.buildFeaturePipeline(roles, scanResult);
    const buildStep = wf.steps.find(s => s.id.includes('build'));
    const testStep = wf.steps.find(s => s.id.includes('test'));
    assert.ok(buildStep);
    assert.ok(testStep);
    assert.ok(testStep.depends_on.includes(buildStep.id));
  });
});
