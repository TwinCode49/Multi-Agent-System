import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { Scanner } from '../scanners/scanner.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('Scanner orchestrator', () => {
  test('scan returns all detected platforms', () => {
    const scanner = new Scanner();
    const results = scanner.scan(join(fixturesDir, 'claude-project'));
    const detected = results.filter(r => r.detected);
    assert.ok(detected.length >= 1);
    assert.ok(detected.some(r => r.platform === 'claude'));
  });

  test('scanAll returns only detected platforms', () => {
    const scanner = new Scanner();
    const results = scanner.scanAll(join(fixturesDir, 'vanilla-project'));
    assert.equal(results.length, 0);
  });

  test('scanPrimary returns highest priority platform', () => {
    const scanner = new Scanner();
    const result = scanner.scanPrimary(join(fixturesDir, 'opencode-project'));
    assert.ok(result);
    assert.equal(result.platform, 'opencode');
  });

  test('scanPrimary falls through priority order', () => {
    const scanner = new Scanner();
    const result = scanner.scanPrimary(join(fixturesDir, 'claude-project'));
    assert.ok(result);
    assert.equal(result.platform, 'claude');
  });

  test('scanPrimary returns null for unknown project', () => {
    const scanner = new Scanner();
    const result = scanner.scanPrimary(join(fixturesDir, 'vanilla-project'));
    assert.equal(result, null);
  });

  test('scan handles project with multiple platforms', () => {
    const scanner = new Scanner();
    const results = scanner.scanAll(join(fixturesDir, 'opencode-project'));
    assert.equal(results.length, 2);
    assert.ok(results.some(r => r.platform === 'opencode'));
    assert.ok(results.some(r => r.platform === 'antigravity'));
  });

  test('scan returns empty array for vanilla project', () => {
    const scanner = new Scanner();
    const results = scanner.scan(join(fixturesDir, 'vanilla-project'));
    assert.equal(results.length, 0);
  });
});
