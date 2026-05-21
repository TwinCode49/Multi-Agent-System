import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TestGenerator } from '../core/test-generator.mjs';

describe('TestGenerator', () => {
  const mockAgents = [
    { name: 'database-specialist', keywords: ['database', 'sql', 'query'], mode: 'subagent', permissions: { edit: 'allow', bash: 'allow' }, sections: ['Core Responsibilities', 'Behavior Rules', 'Constraints'] },
    { name: 'code-reviewer', keywords: ['review', 'quality'], mode: 'subagent', permissions: { edit: 'deny', bash: 'allow' }, sections: ['Core Responsibilities', 'Behavior Rules', 'Handoff Protocol'] },
  ];

  test('generate produces test cases for each agent', () => {
    const tg = new TestGenerator();
    const cases = tg.generate(mockAgents);
    assert.equal(cases.length, 2);
  });

  test('generate includes expectedKeywords minimum of 10', () => {
    const tg = new TestGenerator();
    const cases = tg.generate(mockAgents);
    assert.ok(cases.every(c => c.expectedKeywords >= 10));
  });

  test('generate sets modeExpected from agent', () => {
    const tg = new TestGenerator();
    const cases = tg.generate(mockAgents);
    assert.equal(cases.every(c => c.modeExpected === 'subagent'), true);
  });

  test('generate sets permissionsExpected from agent', () => {
    const tg = new TestGenerator();
    const cases = tg.generate(mockAgents);
    const reviewer = cases.find(c => c.name === 'code-reviewer');
    assert.equal(reviewer.permissionsExpected.edit, 'deny');
  });

  test('generate includes only existing sections in sectionsRequired', () => {
    const tg = new TestGenerator();
    const cases = tg.generate(mockAgents);
    const db = cases.find(c => c.name === 'database-specialist');
    assert.ok(db.sectionsRequired.includes('Core Responsibilities'));
    assert.ok(db.sectionsRequired.includes('Behavior Rules'));
    assert.ok(!db.sectionsRequired.includes('Handoff Protocol'));
  });

  test('generateTestCaseFile returns JSON string', () => {
    const tg = new TestGenerator();
    const json = tg.generateTestCaseFile(mockAgents[0], 'json');
    const parsed = JSON.parse(json);
    assert.equal(parsed.name, 'database-specialist');
  });

  test('generateTestCaseFile returns object for non-JSON format', () => {
    const tg = new TestGenerator();
    const obj = tg.generateTestCaseFile(mockAgents[0], 'object');
    assert.equal(obj.name, 'database-specialist');
    assert.equal(obj.hasHandoffExpected, true);
  });

  test('generate handles empty agents', () => {
    const tg = new TestGenerator();
    const cases = tg.generate([]);
    assert.equal(cases.length, 0);
  });
});
