import { describe, it } from 'node:test';
import assert from 'node:assert';
import { VanillaDetector } from '../core/vanilla-detector.mjs';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('VanillaDetector', () => {
  it('detects Node.js project with package.json', () => {
    const result = new VanillaDetector().detect('tools_dynamic');
    assert.equal(result.hasPackageJson, true);
    assert.equal(result.language, 'Node.js');
    assert.equal(result.detected, true);
    assert.equal(result.recommendedPlatform, 'opencode');
  });

  it('detects no project in empty directory', () => {
    const dir = join(tmpdir(), `vd-test-empty-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      const result = new VanillaDetector().detect(dir);
      assert.equal(result.detected, false);
      assert.equal(result.language, 'Unknown');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects Python project with requirements.txt', () => {
    const dir = join(tmpdir(), `vd-test-py-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(join(dir, 'requirements.txt'), 'flask\nrequests\n');
      const result = new VanillaDetector().detect(dir);
      assert.equal(result.detected, true);
      assert.equal(result.language, 'Python');
      assert.equal(result.hasRequirementsTxt, true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects Rust project with Cargo.toml', () => {
    const dir = join(tmpdir(), `vd-test-rs-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(join(dir, 'Cargo.toml'), '[package]\nname = "test"\n');
      const result = new VanillaDetector().detect(dir);
      assert.equal(result.detected, true);
      assert.equal(result.language, 'Rust');
      assert.equal(result.hasCargoToml, true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects Go project with go.mod', () => {
    const dir = join(tmpdir(), `vd-test-go-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(join(dir, 'go.mod'), 'module test\ngo 1.21\n');
      const result = new VanillaDetector().detect(dir);
      assert.equal(result.detected, true);
      assert.equal(result.language, 'Go');
      assert.equal(result.hasGoMod, true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects framework from package.json dependencies', () => {
    const dir = join(tmpdir(), `vd-test-fw-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        dependencies: { express: '^4.18.0' },
      }));
      const result = new VanillaDetector().detect(dir);
      assert.equal(result.detected, true);
      assert.equal(result.language, 'Node.js');
      assert.ok(result.framework);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects .NET project with .csproj', () => {
    const dir = join(tmpdir(), `vd-test-cs-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(join(dir, 'test.csproj'), '<Project Sdk="Microsoft.NET.Sdk.Web">');
      const result = new VanillaDetector().detect(dir);
      assert.equal(result.detected, true);
      assert.equal(result.language, 'C# (.NET)');
      assert.equal(result.hasCsproj, true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
