import { Scanner } from '../scanners/scanner.mjs';
import { Injector } from '../core/injector.mjs';
import { Differ } from '../core/differ.mjs';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

export async function runUpdate(targetPath, options) {
  const scanner = new Scanner();
  const injector = new Injector();
  const differ = new Differ();

  console.log(`\n  ${BOLD}🔍 Scanning ${targetPath}...${RESET}\n`);

  const results = scanner.scanAll(targetPath);

  if (results.length === 0) {
    console.log(`  ${YELLOW}No agent platforms detected. Nothing to update.${RESET}\n`);
    return;
  }

  const entries = injector.regenerateWorkflows(results);
  if (entries.length === 0) {
    console.log(`  ${YELLOW}No workflow definitions or test cases generated.${RESET}\n`);
    return;
  }

  const plan = {
    directories: [
      'tools/agent-workflows/definitions/',
      'tools/agent-testing/cases/',
    ],
    create: entries,
    modify: [],
  };

  if (options.dryRun) {
    console.log(`  ${BOLD}📋 Dry Run — Update Plan${RESET}`);
    differ.print(differ.diff(targetPath, plan));
    console.log(`\n  ${YELLOW}${BOLD}Dry run complete. ${entries.length} definition(s) would be written.${RESET}`);
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

  console.log(`\n  ${BOLD}📊 Update Summary${RESET}`);
  console.log(`  ${GREEN}✅ Created: ${executeResult.created.filter(p => !entries.find(e => e.path === p) || executeResult.backedUp.some(b => b.path === p)).length} new${RESET}`);
  const updated = executeResult.modified.length;
  console.log(`  ${CYAN}📝 Updated: ${updated}${RESET}`);
  if (executeResult.backedUp.length > 0) {
    console.log(`  ${YELLOW}💾 Backed up: ${executeResult.backedUp.length} file(s)${RESET}`);
  }
  if (executeResult.errors.length > 0) {
    console.log(`  ${YELLOW}⚠️  Errors: ${executeResult.errors.length}${RESET}`);
    for (const err of executeResult.errors) {
      console.log(`    • [${err.type}] ${err.path}: ${err.error}`);
    }
  }

  console.log(`\n  ${GREEN}✅ Update complete. ${entries.length} definition(s) written.${RESET}\n`);
}
