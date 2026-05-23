import { OpenCodeScanner } from './opencode-scanner.mjs';
import { VSCodeScanner } from './vscode-scanner.mjs';
import { ClaudeScanner } from './claude-scanner.mjs';
import { AntigravityScanner } from './antigravity-scanner.mjs';
import { VanillaScanner } from './vanilla-scanner.mjs';

export class Scanner {
  constructor() {
    this.scanners = [
      new OpenCodeScanner(),
      new VSCodeScanner(),
      new ClaudeScanner(),
      new AntigravityScanner(),
      new VanillaScanner(),
    ];
  }

  scan(basePath) {
    const results = [];
    for (const scanner of this.scanners) {
      if (scanner.detect(basePath)) {
        results.push(scanner.scan(basePath));
      }
    }
    return results;
  }

  scanPrimary(basePath) {
    const priority = ['opencode', 'vscode', 'claude', 'antigravity', 'vanilla'];
    const all = this.scan(basePath);
    for (const name of priority) {
      const found = all.find(r => r.platform === name && r.detected);
      if (found) return found;
    }
    return null;
  }

  scanAll(basePath) {
    return this.scan(basePath).filter(r => r.detected);
  }
}
