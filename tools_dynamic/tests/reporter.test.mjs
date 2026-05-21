import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Reporter } from '../core/reporter.mjs';

describe('Reporter', () => {
  const mockResults = [
    {
      platform: 'opencode',
      platformVersion: '1.0',
      detected: true,
      nativeCapabilities: { subagents: false, agentTeams: false, parallelExecution: false, hooks: false, mcp: false, customTools: true },
      agents: [
        { name: 'test-agent', role: 'Tester', keywords: ['test', 'spec'], mode: 'subagent', filePath: '/a.md', permissions: { edit: 'allow', bash: 'allow' }, sections: ['Core', 'Behavior'], hasHandoff: true },
        { name: 'review-agent', role: 'Reviewer', keywords: ['review', 'audit', 'quality', 'security', 'perf', 'lint', 'style', 'refactor', 'best-practices', 'standards'], mode: 'subagent', filePath: '/b.md', permissions: { edit: 'deny', bash: 'allow' }, sections: ['Core', 'Behavior', 'Constraints', 'Handoff'], hasHandoff: true },
      ],
      skills: [
        { name: 'testing', keywords: ['test', 'spec'], filePath: '/s.md', references: [], crossPlatformSynced: false },
      ],
      workflows: [
        { name: 'review-pipeline', steps: 3, agents: ['review-agent', 'test-agent'], filePath: '/w.json' },
      ],
      existingTools: ['testing'],
      configPaths: ['.opencode', 'AGENTS.md'],
      platformMeta: {},
    },
  ];

  test('toJSON returns valid JSON string', () => {
    const reporter = new Reporter();
    const json = reporter.toJSON(mockResults, '/test/path');
    const parsed = JSON.parse(json);
    assert.equal(parsed.projectPath, '/test/path');
    assert.equal(parsed.platforms.length, 1);
    assert.equal(parsed.summary.totalAgents, 2);
  });

  test('toHTML returns HTML string', () => {
    const reporter = new Reporter();
    const html = reporter.toHTML(mockResults, '/test/path');
    assert.ok(html.startsWith('<!DOCTYPE html>'));
    assert.ok(html.includes('opencode'));
    assert.ok(html.includes('test-agent'));
    assert.ok(html.includes('testing'));
  });

  test('printAnalysis does not throw', async () => {
    const reporter = new Reporter();
    await reporter.printAnalysis(mockResults, '/test/path');
  });

  test('printAnalysis handles empty results', async () => {
    const reporter = new Reporter();
    await reporter.printAnalysis([], '/empty');
  });

  test('diagnose returns issues for agents with few keywords', () => {
    const reporter = new Reporter();
    const issues = reporter.diagnose(mockResults);
    const keywordIssues = issues.filter(i => i.message.includes('TRIGGER KEYWORDS'));
    assert.ok(keywordIssues.length >= 1);
  });

  test('diagnose returns no issues for well-configured agents', () => {
    const reporter = new Reporter();
    const cleanResults = [
      {
        platform: 'opencode',
        platformVersion: '1.0',
        detected: true,
        nativeCapabilities: { subagents: false, agentTeams: false, parallelExecution: false, hooks: false, mcp: false, customTools: true },
        agents: [
          {
            name: 'good-agent',
            role: 'Good',
            keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
            mode: 'subagent',
            filePath: '/a.md',
            permissions: { edit: 'allow', bash: 'allow' },
            sections: ['Core', 'Behavior', 'Constraints', 'Handoff'],
            hasHandoff: true,
          },
        ],
        skills: [],
        workflows: [],
        existingTools: [],
        configPaths: [],
        platformMeta: {},
      },
    ];
    const issues = reporter.diagnose(cleanResults);
    const relevantIssues = issues.filter(i => i.agent === 'good-agent');
    assert.equal(relevantIssues.length, 0);
  });

  test('printDiagnosis does not throw', () => {
    const reporter = new Reporter();
    reporter.printDiagnosis(mockResults, '/test/path');
  });

  test('printPlatforms does not throw', () => {
    const reporter = new Reporter();
    reporter.printPlatforms();
  });

  test('_healthColor returns green for healthy platform', () => {
    const reporter = new Reporter();
    const healthy = {
      agents: [
        { hasHandoff: true, keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] },
        { hasHandoff: true, keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] },
      ],
    };
    assert.equal(reporter._healthColor(healthy), 'green');
  });
});
