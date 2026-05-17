#!/usr/bin/env node
import { Command } from 'commander';
import { Scanner } from './scanners/scanner.mjs';
import { Reporter } from './core/reporter.mjs';
import { WorkflowGenerator } from './core/workflow-generator.mjs';
import { TestGenerator } from './core/test-generator.mjs';
import { Differ } from './core/differ.mjs';
import { Injector } from './core/injector.mjs';
import { runInject } from './commands/inject.mjs';
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
      if (results.length === 0) {
        try {
          const { VanillaDetector } = await import('./core/vanilla-detector.mjs');
          const detector = new VanillaDetector();
          const vanilla = detector.detect(targetPath);
          if (vanilla.detected) {
            console.log(`  ${CYAN}ℹ️  Vanilla project detected: ${vanilla.language}${RESET}`);
            if (vanilla.framework) console.log(`  ${CYAN}   Framework: ${vanilla.framework}${RESET}`);
            console.log(`  ${CYAN}   Recommended skills: ${detector.suggestSkills(vanilla).slice(0, 5).join(', ')}${RESET}`);
            console.log(`  ${CYAN}   Run 'init --yes' to bootstrap with agent config and tools.${RESET}\n`);
          }
        } catch {}
      }
    }
  });

program
  .command('list-platforms')
  .description('List detectable platforms and their indicators')
  .action(() => {
    const reporter = new Reporter();
    reporter.printPlatforms();
  });

function makeSyntheticResult(platformName, targetPath) {
  const platformDirMap = {
    opencode: '.opencode',
    vscode: '.github',
    claude: '.claude',
    antigravity: '.agent',
  };
  const agentsDirMap = {
    opencode: '.opencode/agents',
    vscode: '.github/agents',
    claude: '.claude/agents',
    antigravity: '.agent/rules',
  };
  const skillsDirMap = {
    opencode: '.opencode/skills',
    vscode: '.github/skills',
    claude: '.claude/skills',
    antigravity: '.agent/rules',
  };
  const configPathsMap = {
    opencode: ['.opencode', 'AGENTS.md'],
    vscode: ['.github/copilot-instructions.md'],
    claude: ['CLAUDE.md'],
    antigravity: ['antigravity.yaml'],
  };
  return {
    platform: platformName,
    platformVersion: '1.0',
    detected: true,
    configPaths: configPathsMap[platformName] || [],
    agents: [],
    skills: [],
    workflows: [],
    existingTools: [],
    nativeCapabilities: {
      subAgents: platformName === 'claude',
      agentTeams: platformName === 'claude',
      hooks: platformName === 'claude',
      mcp: platformName === 'claude',
      parallelExecution: platformName === 'claude',
      customTools: true,
    },
    agentsDir: agentsDirMap[platformName] || '.opencode/agents',
    skillsDir: skillsDirMap[platformName] || '.opencode/skills',
    platformDir: platformDirMap[platformName] || '.opencode',
  };
}

program
  .command('init [path]')
  .description('Full interactive bootstrap (combines analyze + inject)')
  .option('--dry-run', 'Show diff without writing')
  .option('--yes', 'Non-interactive mode (use defaults)')
  .option('--platform <name>', 'Target platform for --yes mode (opencode, vscode, claude, antigravity)')
  .action(async (path, options) => {
    const targetPath = path || '.';
    const scanner = new Scanner();
    const reporter = new Reporter();
    const differ = new Differ();
    const injector = new Injector();

    let results = scanner.scanAll(targetPath);

    if (options.yes) {
      await reporter.printAnalysis(results, targetPath);
      if (results.length === 0) {
        const platformName = options.platform || 'opencode';
        results = [makeSyntheticResult(platformName, targetPath)];
        console.log(`  ${CYAN}ℹ️  Using platform: ${platformName}${RESET}\n`);
      }
      const defaultComponents = ['config', 'testing', 'metrics', 'workflows', 'processes', 'context'];
      console.log(`  ${CYAN}⚡ Non-interactive mode: injecting with defaults...${RESET}\n`);
      const plan = injector.plan(results, targetPath, defaultComponents);
      const executeResult = injector.execute(plan, targetPath, {
        onFileCreate: (p) => console.log(`  ${GREEN}✅ Created: ${p}${RESET}`),
        onFileModify: (p) => console.log(`  ${CYAN}📝 Modified: ${p}${RESET}`),
      });
      console.log(`\n  ${GREEN}✅ Injection complete. ${executeResult.created.length} created, ${executeResult.modified.length} modified.${RESET}\n`);
      return;
    }

    console.log(`\n  ${CYAN}⚡ Interactive Bootstrap${RESET}\n`);

    const summary = reporter._buildSummary(results);
    console.log(`  Project: ${BOLD}${targetPath}${RESET}`);
    console.log(`  Platforms: ${summary.totalPlatforms} | Agents: ${summary.totalAgents} | Skills: ${summary.totalSkills} | Workflows: ${summary.totalWorkflows}\n`);

    if (results.length === 0) {
      await reporter.printAnalysis(results, targetPath);
      console.log(`\n  ${YELLOW}No agent platforms detected.${RESET}`);
      const { platforms } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'platforms',
        message: 'Select target platform(s) to configure:',
        choices: [
          { name: 'OpenCode (.opencode/, AGENTS.md)', value: 'opencode', checked: true },
          { name: 'VS Code / Copilot (.github/copilot-instructions.md)', value: 'vscode', checked: false },
          { name: 'Claude Code (CLAUDE.md, .claude/)', value: 'claude', checked: false },
          { name: 'Antigravity (antigravity.yaml)', value: 'antigravity', checked: false },
        ],
      }]);
      if (platforms.length === 0) {
        console.log(`\n  ${YELLOW}No platform selected. Skipping.${RESET}\n`);
        return;
      }
      results = platforms.map(p => makeSyntheticResult(p, targetPath));
      console.log(`\n  ${CYAN}ℹ️  Configuring ${platforms.length} platform(s): ${platforms.join(', ')}${RESET}\n`);
    }

    const { components } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'components',
      message: 'Select components to bootstrap:',
      choices: [
        { name: '🤖 Agents + Skills + Config (AGENTS.md, opencode.json, agent/skill definitions)', value: 'config', checked: true },
        { name: '📦 Agent Testing Framework (run.mjs + cases)', value: 'testing', checked: true },
        { name: '📊 Agent Performance Metrics (report.mjs)', value: 'metrics', checked: true },
        { name: '⚡ Multi-Agent Workflows (definitions + executor)', value: 'workflows', checked: true },
        { name: '📋 Docs/Processes (documentation templates)', value: 'processes', checked: false },
        { name: '🧠 Context Manager (token estimation + compaction tool)', value: 'context', checked: true },
      ],
    }]);

    if (components.length === 0) {
      console.log(`\n  ${YELLOW}No components selected. Skipping.${RESET}\n`);
      return;
    }

    const plan = injector.plan(results, targetPath, components, options);

    if (plan.create.length > 0 || plan.directories.length > 0) {
      console.log(`\n  ${BOLD}📋 Injection Plan${RESET}`);
      differ.print(differ.diff(targetPath, plan));
    }

    if (options.dryRun) {
      console.log(`\n  ${YELLOW}${BOLD}Dry run complete. No files were written.${RESET}\n`);
      return;
    }

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Proceed with injection of ${components.length} component(s)?`,
      default: false,
    }]);

    if (confirm) {
      const executeResult = injector.execute(plan, targetPath, {
        onBackup: (filePath, backupPath) => {
          console.log(`  ${YELLOW}💾 Backed up: ${filePath} → ${backupPath}${RESET}`);
        },
        onFileCreate: (filePath) => {
          console.log(`  ${GREEN}✅ Created: ${filePath}${RESET}`);
        },
        onFileModify: (filePath) => {
          console.log(`  ${CYAN}📝 Modified: ${filePath}${RESET}`);
        },
      });

      console.log(`\n  ${BOLD}📊 Summary${RESET}`);
      console.log(`  ${GREEN}✅ ${executeResult.created.length} file(s) created${RESET}`);
      console.log(`  ${CYAN}📝 ${executeResult.modified.length} file(s) modified${RESET}`);
      if (executeResult.backedUp.length > 0) {
        console.log(`  ${YELLOW}💾 ${executeResult.backedUp.length} file(s) backed up${RESET}`);
      }
      if (executeResult.errors.length > 0) {
        console.log(`  ${YELLOW}⚠️  ${executeResult.errors.length} error(s)${RESET}`);
      }
      console.log(`\n  ${GREEN}✅ Bootstrap complete.${RESET}`);
      console.log(`  Run ${CYAN}tools-dynamic doctor .${RESET} to verify the setup.\n`);
    } else {
      console.log(`\n  ${YELLOW}Injection cancelled.${RESET}\n`);
    }
  });

program
  .command('inject [path]')
  .description('Inject selected tools into project')
  .option('--dry-run', 'Show diff without writing')
  .option('--config', 'Inject agent/skill/config definitions only')
  .option('--tools', 'Inject tools only (testing + metrics + workflows)')
  .option('--processes', 'Inject processes only')
  .option('--context', 'Inject context-manager tool')
  .option('--all', 'Inject everything (default)')
  .action(async (path, options) => {
    const targetPath = path || '.';
    options.all = options.all || (!options.config && !options.tools && !options.processes);
    await runInject(targetPath, options);
  });

program.parse(process.argv);
