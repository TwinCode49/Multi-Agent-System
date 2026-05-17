#!/usr/bin/env node
import { Command } from 'commander';
import { Scanner } from './scanners/scanner.mjs';
import { Reporter } from './core/reporter.mjs';
import { WorkflowGenerator } from './core/workflow-generator.mjs';
import { TestGenerator } from './core/test-generator.mjs';
import { Differ } from './core/differ.mjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('tools-dynamic')
  .description('Portable agent orchestration system — analyze and supercharge any project')
  .version(pkg.version);

program
  .command('analyze [path]')
  .description('Discover platform, agents, and skills in a project')
  .option('--json', 'Output in JSON format')
  .action(async (path, options) => {
    const targetPath = path || '.';
    const scanner = new Scanner();
    const results = scanner.scanAll(targetPath);
    const reporter = new Reporter();

    if (options.json) {
      console.log(reporter.toJSON(results, targetPath));
    } else {
      reporter.printAnalysis(results, targetPath);
    }
  });

program
  .command('report [path]')
  .description('Generate diagnostic report (JSON)')
  .option('--html', 'Output in HTML format')
  .action(async (path, options) => {
    const targetPath = path || '.';
    const scanner = new Scanner();
    const results = scanner.scanAll(targetPath);
    const reporter = new Reporter();

    if (options.html) {
      console.log(reporter.toHTML(results, targetPath));
    } else {
      console.log(reporter.toJSON(results, targetPath));
    }
  });

program
  .command('doctor [path]')
  .description('Diagnose existing configuration')
  .option('--json', 'Output in JSON format')
  .action(async (path, options) => {
    const targetPath = path || '.';
    const scanner = new Scanner();
    const results = scanner.scanAll(targetPath);
    const reporter = new Reporter();

    if (options.json) {
      console.log(JSON.stringify(reporter.diagnose(results), null, 2));
    } else {
      reporter.printDiagnosis(results, targetPath);
    }
  });

program
  .command('list-platforms')
  .description('List detectable platforms and their indicators')
  .action(() => {
    const reporter = new Reporter();
    reporter.printPlatforms();
  });

program
  .command('init [path]')
  .description('Full interactive bootstrap (combines analyze + inject)')
  .option('--dry-run', 'Show diff without writing')
  .option('--yes', 'Non-interactive mode (use defaults)')
  .action(async (path, options) => {
    const targetPath = path || '.';
    console.log(`\n  ⚡ init not yet implemented (Phase 4)\n`);
  });

program
  .command('inject [path]')
  .description('Inject selected tools into project')
  .option('--dry-run', 'Show diff without writing')
  .option('--tools', 'Inject tools only')
  .option('--processes', 'Inject processes only')
  .option('--all', 'Inject everything (default)')
  .action(async (path, options) => {
    const targetPath = path || '.';
    console.log(`\n  ⚡ inject not yet implemented (Phase 4)\n`);
  });

program.parse(process.argv);
