import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Differ } from '../core/differ.mjs';

describe('Differ', () => {
  test('diff returns create entries for new files', () => {
    const differ = new Differ();
    const plan = {
      create: [{ path: 'new-file.mjs', content: '// content' }],
      directories: [],
      modify: [],
    };
    const entries = differ.diff('/tmp/test', plan);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].type, 'create');
    assert.equal(entries[0].path, 'new-file.mjs');
  });

  test('diff handles empty plan', () => {
    const differ = new Differ();
    const entries = differ.diff('/tmp/test', { create: [], modify: [], directories: [] });
    assert.equal(entries.length, 0);
  });

  test('diff returns directory entries', () => {
    const differ = new Differ();
    const plan = {
      create: [],
      modify: [],
      directories: ['tools', 'tools/agent-testing'],
    };
    const entries = differ.diff('/tmp/test', plan);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].type, 'directory');
    assert.equal(entries[0].path, 'tools/');
  });

  test('print does not throw with entries', () => {
    const differ = new Differ();
    const entries = [
      { type: 'directory', path: 'tools/' },
      { type: 'create', path: 'file.mjs', content: 'x', exists: false },
      { type: 'modify', path: 'old.mjs', before: 'a', after: 'b', exists: true },
    ];
    differ.print(entries);
  });

  test('print does not throw with empty entries', () => {
    const differ = new Differ();
    differ.print([]);
  });
});
