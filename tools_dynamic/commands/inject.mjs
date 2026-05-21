import { Scanner } from '../scanners/scanner.mjs';
import { Reporter } from '../core/reporter.mjs';
import { Injector } from '../core/injector.mjs';
import { Differ } from '../core/differ.mjs';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

export async function runInject(targetPath, options) {
  const scanner = new Scanner();
  const injector = new Injector();
  const differ = new Differ();

  const results = scanner.scanAll(targetPath);

  const components = [];
  if (options.config || options.all) {
    components.push('config');
  }
  if (options.tools || options.all) {
    components.push('testing', 'metrics', 'workflows');
  }
  if (options.processes || options.all) {
    components.push('processes');
  }
  if (options.context || options.all) {
    components.push('context');
  }
  if (components.length === 0) {
    components.push('config', 'testing', 'metrics', 'workflows', 'processes', 'context');
  }

  console.log(`\n  ${BOLD}🔧 Generating injection plan...${RESET}\n`);

  const plan = injector.plan(results, targetPath, components, options);

  if (options.dryRun) {
    console.log(`  ${BOLD}📋 Dry Run — Injection Plan${RESET}`);
    differ.print(differ.diff(targetPath, plan));
    console.log(`\n  ${YELLOW}${BOLD}Dry run complete. No files were written.${RESET}`);
    console.log(`  Run without --dry-run to execute.\n`);
    return;
  }

  console.log(`  ${BOLD}📋 Plan${RESET}`);
  differ.print(differ.diff(targetPath, plan));

  const executeResult = injector.execute(plan, targetPath, {
    dryRun: false,
    onBackup: (path, backupPath) => {
      console.log(`  ${YELLOW}💾 Backed up: ${path} → ${backupPath}${RESET}`);
    },
    onFileCreate: (path) => {
      console.log(`  ${GREEN}✅ Created: ${path}${RESET}`);
    },
    onFileModify: (path) => {
      console.log(`  ${CYAN}📝 Modified: ${path}${RESET}`);
    },
  });

  console.log(`\n  ${BOLD}📊 Injection Summary${RESET}`);
  console.log(`  ${GREEN}✅ Created: ${executeResult.created.length} file(s)${RESET}`);
  console.log(`  ${CYAN}📝 Modified: ${executeResult.modified.length} file(s)${RESET}`);
  if (executeResult.backedUp.length > 0) {
    console.log(`  ${YELLOW}💾 Backed up: ${executeResult.backedUp.length} file(s)${RESET}`);
  }
  console.log(`  📁 Directories: ${executeResult.directories.length}${RESET}`);
  if (executeResult.errors.length > 0) {
    console.log(`  ${YELLOW}⚠️  Errors: ${executeResult.errors.length}${RESET}`);
    for (const err of executeResult.errors) {
      console.log(`    • [${err.type}] ${err.path}: ${err.error}`);
    }
  }

  const reporter = new Reporter();
  const summary = reporter._buildSummary(results);
  if (summary.unclassifiedAgents > 0 || summary.blockers > 0) {
    console.log(`  ${YELLOW}⚠️  ${summary.unclassifiedAgents} agent(s) not classified, ${summary.blockers} blocker(s) found${RESET}`);
    console.log(`  💡 Run ${CYAN}tools-dynamic validate .${RESET} for detailed diagnostics.\n`);
  }

  console.log(`  ${GREEN}✅ Injection complete.${RESET}\n`);
}
