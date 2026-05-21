import { Scanner } from '../scanners/scanner.mjs';
import { Validator } from '../core/validator.mjs';

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

export async function runValidate(targetPath, options) {
  const scanner = new Scanner();
  const validator = new Validator();
  const results = scanner.scanAll(targetPath);

  const issues = validator.validate(results);

  if (options.json) {
    console.log(JSON.stringify({
      projectPath: targetPath,
      timestamp: new Date().toISOString(),
      issues,
      summary: {
        total: issues.length,
        blockers: issues.filter(i => i.severity === 'blocker').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        infos: issues.filter(i => i.severity === 'info').length,
      },
    }, null, 2));
    return;
  }

  console.log(`\n  ${BOLD}🔍 Validate: ${targetPath}${RESET}\n`);

  if (issues.length === 0) {
    console.log(`  ${GREEN}✅ No issues found. Configuration looks good!${RESET}\n`);
    return;
  }

  const blockers = issues.filter(i => i.severity === 'blocker');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  if (blockers.length > 0) {
    console.log(`  ${BOLD}🔴 Blockers (${blockers.length}):${RESET}`);
    for (const issue of blockers) {
      console.log(`    • ${CYAN}[${issue.platform}${issue.agent ? '/' + issue.agent : ''}]${RESET} ${issue.message}`);
      if (issue.suggestion) console.log(`      → ${GREEN}${issue.suggestion}${RESET}`);
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`  ${BOLD}🟡 Warnings (${warnings.length}):${RESET}`);
    for (const issue of warnings) {
      console.log(`    • ${CYAN}[${issue.platform}${issue.agent ? '/' + issue.agent : ''}${issue.skill ? '/' + issue.skill : ''}]${RESET} ${issue.message}`);
      if (issue.suggestion) console.log(`      → ${YELLOW}${issue.suggestion}${RESET}`);
    }
    console.log();
  }

  if (infos.length > 0) {
    console.log(`  ${BOLD}ℹ️  Info (${infos.length}):${RESET}`);
    for (const issue of infos) {
      console.log(`    • ${CYAN}[${issue.platform}${issue.agent ? '/' + issue.agent : ''}]${RESET} ${issue.message}`);
      if (issue.suggestion) console.log(`      → ${CYAN}${issue.suggestion}${RESET}`);
    }
    console.log();
  }

  console.log(`  ${BOLD}── Summary ──${RESET}`);
  console.log(`  🔴 ${blockers.length} blocker(s) | 🟡 ${warnings.length} warning(s) | ℹ️ ${infos.length} info`);
  if (blockers.length > 0) {
    console.log(`  ${RED}❌ ${blockers.length} blocker(s) must be resolved before workflows can be generated.${RESET}`);
  }
  console.log();
}
