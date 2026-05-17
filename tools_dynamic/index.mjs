#!/usr/bin/env node
import { Command } from 'commander';
import { Scanner } from './scanners/scanner.mjs';
import { Reporter } from './core/reporter.mjs';
import { WorkflowGenerator } from './core/workflow-generator.mjs';
import { TestGenerator } from './core/test-generator.mjs';
import { Differ } from './core/differ.mjs';
import inquirer from 'inquirer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

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
      await reporter.printAnalysis(results, targetPath);
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
    const scanner = new Scanner();
    const reporter = new Reporter();
    const differ = new Differ();

    const results = scanner.scanAll(targetPath);

    if (options.yes) {
      reporter.printAnalysis(results, targetPath);
      console.log(`\n  ${GREEN}✅ Non-interactive mode: use 'inject' command for actual injection (Phase 4)${RESET}\n`);
      return;
    }

    console.log(`\n  ${CYAN}⚡ Interactive Bootstrap${RESET}\n`);

    const summary = reporter._buildSummary(results);
    console.log(`  Project: ${BOLD}${targetPath}${RESET}`);
    console.log(`  Platforms: ${summary.totalPlatforms} | Agents: ${summary.totalAgents} | Skills: ${summary.totalSkills} | Workflows: ${summary.totalWorkflows}\n`);

    if (results.length === 0) {
      console.log(`  ${YELLOW}No agent platforms detected in this project.${RESET}`);
      console.log(`  💡 Run ${CYAN}tools-dynamic list-platforms${RESET} to see what we can detect.\n`);
      return;
    }

    const { components } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'components',
      message: 'Select components to bootstrap:',
      choices: [
        { name: '📦 Agent Testing Framework (run.mjs + cases)', value: 'testing', checked: true },
        { name: '📊 Agent Performance Metrics (report.mjs)', value: 'metrics', checked: true },
        { name: '⚡ Multi-Agent Workflows (definitions + executor)', value: 'workflows', checked: true },
        { name: '📋 Docs/Processes (documentation templates)', value: 'processes', checked: false },
      ],
    }]);

    if (components.length === 0) {
      console.log(`\n  ${YELLOW}No components selected. Skipping.${RESET}\n`);
      return;
    }

    const plan = {
      directories: [],
      createFiles: [],
      modifyFiles: [],
    };

    for (const platform of results) {
      const wfg = new WorkflowGenerator();
      if (components.includes('workflows')) {
        const wfDir = `tools/agent-workflows/definitions/`;
        plan.directories.push(wfDir);
        const wfs = wfg.generate(platform, { orchestratorSynthesis: true });
        for (const wf of wfs) {
          plan.createFiles.push({ path: `${wfDir}${wf.name}.json`, content: JSON.stringify(wf, null, 2) });
        }
      }

      if (components.includes('testing')) {
        const tDir = `tools/agent-testing/cases/`;
        plan.directories.push(tDir);
        const tg = new TestGenerator();
        const cases = tg.generate(platform.agents);
        for (const tc of cases) {
          plan.createFiles.push({ path: `${tDir}${tc.agent}.json`, content: tg.generateTestCaseFile(tc, 'json') });
        }
      }
    }

    if (plan.createFiles.length > 0 || plan.directories.length > 0) {
      console.log(`\n  ${BOLD}📋 Injection Plan${RESET}`);
      differ.print(differ.diff(targetPath, plan));
    }

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Proceed with injection of ${components.length} component(s)?`,
      default: false,
    }]);

    if (confirm) {
      console.log(`\n  ${GREEN}✅ Injection preview complete. Use 'inject' command for actual file operations (Phase 4).${RESET}\n`);
    } else {
      console.log(`\n  ${YELLOW}Injection cancelled.${RESET}\n`);
    }
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
