import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { WorkflowGenerator } from './workflow-generator.mjs';
import { TestGenerator } from './test-generator.mjs';
import { VanillaDetector } from './vanilla-detector.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = join(__dirname, '..', 'templates');

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

export class Injector {
  constructor(templateRoot) {
    this.templateRoot = templateRoot || TEMPLATES_ROOT;
  }

  substitute(content, variables) {
    return content.replace(VARIABLE_PATTERN, (match, key) => {
      if (variables[key] !== undefined) {
        return variables[key];
      }
      return match;
    });
  }

  stripFrontmatter(content) {
    return content.replace(/^---[\s\S]*?---\s*\n*/m, '');
  }

  isAntigravityPlatform(scanResults) {
    return scanResults.some(p => p.platform === 'antigravity');
  }

  loadTemplate(relativePath) {
    const fullPath = join(this.templateRoot, relativePath);
    if (!existsSync(fullPath)) return null;
    return readFileSync(fullPath, 'utf-8');
  }

  listTemplates(subdir) {
    const dir = join(this.templateRoot, subdir);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && !dirent.name.startsWith('.'))
      .map(dirent => ({ name: dirent.name, relativePath: join(subdir, dirent.name) }));
  }

  listTemplatesNested(baseSubdir) {
    const dir = join(this.templateRoot, baseSubdir);
    if (!existsSync(dir)) return [];
    const result = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDir = join(dir, entry.name);
        const files = readdirSync(skillDir, { withFileTypes: true })
          .filter(f => f.isFile() && !f.name.startsWith('.'))
          .map(f => ({ name: f.name, relativePath: join(baseSubdir, entry.name, f.name), subdir: entry.name }));
        result.push(...files);
      }
    }
    return result;
  }

  resolveVariablesFromScan(scanResults, targetPath) {
    const platform = scanResults.length > 0 ? scanResults[0] : null;
    let agentsDir = '.opencode/agents';
    let skillsDir = '.opencode/skills';
    let githubSkillsDir = '.github/skills';
    let platformDir = '.opencode';
    let projectName = basename(targetPath);

    if (platform) {
      const pName = platform.platform;
      if (pName === 'vscode') {
        agentsDir = '.github/agents';
        skillsDir = '.github/skills';
        githubSkillsDir = '.opencode/skills';
        platformDir = '.github';
      } else if (pName === 'claude') {
        agentsDir = '.claude/agents';
        skillsDir = '.claude/skills';
        githubSkillsDir = '.github/skills';
        platformDir = '.claude';
      } else if (pName === 'antigravity') {
        agentsDir = '.agent/rules';
        skillsDir = '.agent/rules';
        githubSkillsDir = '.github/skills';
        platformDir = '.agent';
      }
    }

    let language = 'Unknown';
    let framework = '';

    try {
      const detector = new VanillaDetector();
      const info = detector.detect(targetPath);
      language = info.language || language;
      framework = info.framework || '';
    } catch {}

    try {
      const pkgPath = join(targetPath, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.name) projectName = pkg.name;
      }
    } catch {}

    return {
      agentsDir,
      skillsDir,
      githubSkillsDir,
      platformDir,
      projectName,
      language,
      framework,
      year: new Date().getFullYear().toString(),
    };
  }

  plan(scanResults, targetPath, components, options = {}) {
    const plan = { directories: [], create: [], modify: [] };

    const includeConfig = components.includes('config');
    const includeProcesses = components.includes('processes');
    const includeTesting = components.includes('testing');
    const includeMetrics = components.includes('metrics');
    const includeWorkflows = components.includes('workflows');
    const includeContext = components.includes('context');

    if (includeConfig) {
      const agDir = join('config', 'agents-skills');
      const platformsForConfig = scanResults.length > 0 ? scanResults : [];

      for (const platform of platformsForConfig) {
        const variables = this.resolveVariablesFromScan([platform], targetPath);
        const pName = platform.platform;
        const isAntigravity = pName === 'antigravity';
        const platformConfigDir = join('config', pName);

        const agFiles = this.listTemplates(join(agDir, 'agents'));
        for (const file of agFiles) {
          let content = this.loadTemplate(file.relativePath);
          if (content === null) continue;
          if (isAntigravity) content = this.stripFrontmatter(content);
          const substituted = this.substitute(content, variables);
          const targetFile = join(variables.agentsDir, file.name);
          plan.directories.push(`${variables.agentsDir}/`);
          plan.create.push({ path: targetFile, content: substituted });
        }

        const skillFiles = this.listTemplatesNested(join(agDir, 'skills'));
        for (const file of skillFiles) {
          let content = this.loadTemplate(file.relativePath);
          if (content === null) continue;
          if (isAntigravity) content = this.stripFrontmatter(content);
          const substituted = this.substitute(content, variables);
          const targetFile = isAntigravity
            ? join(variables.skillsDir, `${file.subdir}.md`)
            : join(variables.skillsDir, file.subdir, file.name);
          plan.directories.push(isAntigravity
            ? `${variables.skillsDir}/`
            : `${variables.skillsDir}/${file.subdir}/`);
          plan.create.push({ path: targetFile, content: substituted });
        }

        const agentsMd = this.loadTemplate(join(platformConfigDir, 'AGENTS.md'));
        if (agentsMd) {
          const substituted = this.substitute(agentsMd, variables);
          const agentsMdTarget = 'AGENTS.md';
          if (existsSync(join(targetPath, agentsMdTarget))) {
            plan.modify.push({ path: agentsMdTarget, content: substituted });
          } else {
            plan.create.push({ path: agentsMdTarget, content: substituted });
          }
        }

        if (pName === 'opencode') {
          const configJson = this.loadTemplate(join(platformConfigDir, 'opencode.json'));
          if (configJson) {
            const substituted = this.substitute(configJson, variables);
            const jsonTarget = join(variables.platformDir, 'opencode.json');
            plan.directories.push(`${variables.platformDir}/`);
            plan.create.push({ path: jsonTarget, content: substituted });
          }
        } else if (isAntigravity) {
          const geminiMd = this.loadTemplate(join(platformConfigDir, 'GEMINI.md'));
          if (geminiMd) {
            const substituted = this.substitute(geminiMd, variables);
            plan.directories.push(`${variables.platformDir}/`);
            plan.create.push({ path: 'GEMINI.md', content: substituted });
          }
        } else if (pName === 'vscode') {
          const copilotMd = this.loadTemplate(join(platformConfigDir, 'copilot-instructions.md'));
          if (copilotMd) {
            const substituted = this.substitute(copilotMd, variables);
            const copilotTarget = join(variables.platformDir, 'copilot-instructions.md');
            plan.directories.push(`${variables.platformDir}/`);
            plan.create.push({ path: copilotTarget, content: substituted });
          }
        } else if (pName === 'claude') {
          const claudeMd = this.loadTemplate(join(platformConfigDir, 'CLAUDE.md'));
          if (claudeMd) {
            const substituted = this.substitute(claudeMd, variables);
            plan.directories.push(`${variables.platformDir}/`);
            plan.create.push({ path: 'CLAUDE.md', content: substituted });
          }
        }
      }
    }

    const variables = this.resolveVariablesFromScan(scanResults, targetPath);

    if (includeTesting) {
      const toolDir = join('tools', 'agent-testing');
      const files = this.listTemplates(toolDir);
      for (const file of files) {
        const content = this.loadTemplate(file.relativePath);
        if (content === null) continue;
        const substituted = this.substitute(content, variables);
        const targetFile = join('tools', 'agent-testing', file.name);
        plan.directories.push('tools/agent-testing/');
        plan.create.push({ path: targetFile, content: substituted });
      }
      plan.directories.push('tools/agent-testing/cases/');
    }

    if (includeWorkflows) {
      const toolDir = join('tools', 'agent-workflows');
      const files = this.listTemplates(toolDir);
      for (const file of files) {
        const content = this.loadTemplate(file.relativePath);
        if (content === null) continue;
        const substituted = this.substitute(content, variables);
        const targetFile = join('tools', 'agent-workflows', file.name);
        plan.directories.push('tools/agent-workflows/');
        plan.directories.push('tools/agent-workflows/definitions/');
        plan.directories.push('tools/agent-workflows/runs/');
        plan.create.push({ path: targetFile, content: substituted });
      }
    }

    if (includeMetrics) {
      const toolDir = join('tools', 'agent-metrics');
      const files = this.listTemplates(toolDir);
      for (const file of files) {
        const content = this.loadTemplate(file.relativePath);
        if (content === null) continue;
        const substituted = this.substitute(content, variables);
        const targetFile = join('tools', 'agent-metrics', file.name);
        plan.directories.push('tools/agent-metrics/');
        plan.create.push({ path: targetFile, content: substituted });
      }
    }

    if (includeContext) {
      const toolDir = join('tools', 'context-manager');
      const files = this.listTemplates(toolDir);
      for (const file of files) {
        const content = this.loadTemplate(file.relativePath);
        if (content === null) continue;
        const substituted = this.substitute(content, variables);
        const targetFile = join('tools', 'context-manager', file.name);
        plan.directories.push('tools/context-manager/');
        plan.create.push({ path: targetFile, content: substituted });
      }
    }

    if (includeProcesses) {
      const pFiles = this.listTemplates('processes');
      for (const file of pFiles) {
        const content = this.loadTemplate(file.relativePath);
        if (content === null) continue;
        const substituted = this.substitute(content, variables);
        const targetFile = join('Docs', 'processes', file.name);
        plan.directories.push('Docs/processes/');
        plan.create.push({ path: targetFile, content: substituted });
      }

      const agentesFiles = this.listTemplates(join('processes', 'agentes'));
      for (const file of agentesFiles) {
        const content = this.loadTemplate(file.relativePath);
        if (content === null) continue;
        const substituted = this.substitute(content, variables);
        const targetFile = join('Docs', 'processes', 'agentes', file.name);
        plan.directories.push('Docs/processes/agentes/');
        plan.create.push({ path: targetFile, content: substituted });
      }
    }

    if (includeWorkflows) {
      for (const platform of scanResults) {
        const wfg = new WorkflowGenerator();
        const wfs = wfg.generate(platform, { orchestratorSynthesis: true });
        for (const wf of wfs) {
          const content = JSON.stringify(wf, null, 2);
          const targetFile = join('tools', 'agent-workflows', 'definitions', `${wf.name}.json`);
          plan.create.push({ path: targetFile, content });
        }
      }
    }

    if (includeTesting) {
      for (const platform of scanResults) {
        const tg = new TestGenerator();
        const cases = tg.generate(platform.agents);
        for (const tc of cases) {
          const content = tg.generateTestCaseFile(tc, 'json');
          const targetFile = join('tools', 'agent-testing', 'cases', `${tc.name}.json`);
          plan.create.push({ path: targetFile, content });
        }
      }
    }

    plan.directories = [...new Set(plan.directories)];
    return plan;
  }

  backup(basePath, filePath) {
    const fullPath = join(basePath, filePath);
    if (!existsSync(fullPath)) return null;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = `${fullPath}.bak.${timestamp}`;
    copyFileSync(fullPath, backupPath);
    return backupPath;
  }

  execute(plan, basePath, options = {}) {
    const { dryRun = false, onBackup, onFileCreate, onFileModify } = options;
    const result = { created: [], modified: [], backedUp: [], directories: [], errors: [] };

    for (const dir of plan.directories || []) {
      const fullPath = join(basePath, dir);
      if (!existsSync(fullPath)) {
        if (!dryRun) {
          try {
            mkdirSync(fullPath, { recursive: true });
          } catch (e) {
            result.errors.push({ type: 'directory', path: dir, error: e.message });
            continue;
          }
        }
        result.directories.push(dir);
      }
    }

    for (const file of plan.create || []) {
      const fullPath = join(basePath, file.path);
      const isNew = !existsSync(fullPath);
      if (!isNew && existingContentMatches(file, fullPath)) {
        continue;
      }
      if (!isNew && !dryRun) {
        const backupPath = this.backup(basePath, file.path);
        if (backupPath) {
          result.backedUp.push({ path: file.path, backupPath });
          if (onBackup) onBackup(file.path, backupPath);
        }
      }
      if (!dryRun) {
        try {
          writeFileSync(fullPath, file.content, 'utf-8');
        } catch (e) {
          result.errors.push({ type: 'write', path: file.path, error: e.message });
          continue;
        }
      }
      if (isNew) {
        result.created.push(file.path);
        if (onFileCreate) onFileCreate(file.path);
      } else {
        result.modified.push(file.path);
        if (onFileModify) onFileModify(file.path);
      }
    }

    return result;
  }
}

function existingContentMatches(file, fullPath) {
  try {
    const existing = readFileSync(fullPath, 'utf-8');
    return existing === file.content;
  } catch {
    return false;
  }
}
