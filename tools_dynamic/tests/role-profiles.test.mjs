import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { jaccardSimilarity, classifyBySkill, ROLE_PROFILES } from '../core/role-profiles.mjs';

describe('jaccardSimilarity', () => {
  test('identical sets return 1', () => {
    const a = new Set(['test', 'spec']);
    const b = new Set(['test', 'spec']);
    assert.equal(jaccardSimilarity(a, b), 1);
  });

  test('disjoint sets return 0', () => {
    const a = new Set(['test']);
    const b = new Set(['doc']);
    assert.equal(jaccardSimilarity(a, b), 0);
  });

  test('partial overlap returns correct ratio', () => {
    const a = new Set(['test', 'spec', 'coverage']);
    const b = new Set(['test', 'doc', 'readme']);
    assert.equal(jaccardSimilarity(a, b), 0.2);
  });

  test('empty sets return 1', () => {
    assert.equal(jaccardSimilarity(new Set(), new Set()), 1);
  });

  test('one empty set returns 0', () => {
    assert.equal(jaccardSimilarity(new Set(['test']), new Set()), 0);
    assert.equal(jaccardSimilarity(new Set(), new Set(['test'])), 0);
  });
});

describe('classifyBySkill', () => {
  test('skill with explicit role field returns 100% confidence', () => {
    const skill = { name: 'security-audit', keywords: ['review'], role: 'reviewer' };
    const result = classifyBySkill(skill);
    assert.equal(result.role, 'reviewer');
    assert.equal(result.confidence, 1.0);
    assert.equal(result.method, 'explicit');
    assert.equal(result.classified, true);
  });

  test('skill with review keywords classified as reviewer', () => {
    const skill = { name: 'code-review', keywords: ['review', 'quality', 'audit', 'lint'] };
    const result = classifyBySkill(skill);
    assert.equal(result.role, 'reviewer');
    assert.ok(result.confidence >= 0.05);
    assert.equal(result.method, 'jaccard');
    assert.equal(result.classified, true);
  });

  test('skill with doc keywords classified as writer', () => {
    const skill = { name: 'doc-generator', keywords: ['doc', 'readme', 'changelog', 'documentation'] };
    const result = classifyBySkill(skill);
    assert.equal(result.role, 'writer');
    assert.ok(result.confidence >= 0.05);
    assert.equal(result.classified, true);
  });

  test('skill with test keywords classified as tester', () => {
    const skill = { name: 'unit-tester', keywords: ['test', 'spec', 'coverage', 'unittest', 'jest'] };
    const result = classifyBySkill(skill);
    assert.equal(result.role, 'tester');
    assert.ok(result.confidence >= 0.05);
    assert.equal(result.classified, true);
  });

  test('skill with builder keywords classified as builder', () => {
    const skill = { name: 'api-builder', keywords: ['api', 'backend', 'database', 'server'] };
    const result = classifyBySkill(skill);
    assert.equal(result.role, 'builder');
    assert.ok(result.confidence >= 0.05);
    assert.equal(result.classified, true);
  });

  test('skill with no matching keywords returns classified: false', () => {
    const skill = { name: 'custom-thing', keywords: ['xyz', 'abc', 'foo'] };
    const result = classifyBySkill(skill);
    assert.equal(result.classified, false);
    assert.equal(result.confidence, 0);
    assert.equal(result.method, 'jaccard');
  });

  test('skill with empty keywords returns classified: false', () => {
    const skill = { name: 'empty-skill', keywords: [] };
    const result = classifyBySkill(skill);
    assert.equal(result.classified, false);
    assert.equal(result.method, 'fallback');
  });
});
