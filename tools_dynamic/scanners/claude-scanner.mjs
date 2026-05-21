import { join, basename, dirname } from 'path';
import { existsSync } from 'fs';
import { PlatformScanner } from '../core/types.mjs';
import { Parser, scanDotAgent } from '../core/parser.mjs';

export class ClaudeScanner extends PlatformScanner {
  static platformName = 'claude';

  detect(basePath) {
    return existsSync(join(basePath, 'CLAUDE.md')) || existsSync(join(basePath, '.claude'));
  }

  scan(basePath) {
    const result = {
      platform: 'claude',
      platformVersion: '1.0',
      detected: true,
      nativeCapabilities: {
        subagents: true,
        agentTeams: true,
        parallelExecution: true,
        hooks: true,
        mcp: true,
        customTools: true,
      },
      agents: [],
      skills: [],
      workflows: [],
      existingTools: [],
      configPaths: [],
      platformMeta: {},
    };

    const claudeMdPath = join(basePath, 'CLAUDE.md');
    const claudeMdContent = Parser.readFileSafe(claudeMdPath);
    if (claudeMdContent) {
      result.configPaths.push(claudeMdPath);
      const sections = claudeMdContent.split('\n').filter(l => l.startsWith('## ')).map(l => l.replace(/^##\s+/, '').trim());
      result.platformMeta.claudeMdSections = sections;
    }

    const claudeDir = join(basePath, '.claude');
    if (!existsSync(claudeDir)) return result;
    result.configPaths.push(claudeDir);

    const settingsPath = join(claudeDir, 'settings.json');
    const settingsContent = Parser.readFileSafe(settingsPath);
    if (settingsContent) {
      result.configPaths.push(settingsPath);
      try {
        result.platformMeta.settings = JSON.parse(settingsContent);
      } catch {}
    }

    const agentsDir = join(claudeDir, 'agents');
    const agentFiles = Parser.findFiles(agentsDir, '.md');
    for (const filePath of agentFiles) {
      const content = Parser.readFileSafe(filePath);
      if (!content) continue;
      const { frontmatter, body } = Parser.parseFrontmatter(content);
      const name = frontmatter.name || frontmatter.role || basename(filePath, '.md');
      result.agents.push({
        name,
        role: frontmatter.description || frontmatter.role || '',
        keywords: [],
        mode: 'subagent',
        filePath,
        permissions: { edit: 'allow', bash: 'allow' },
        sections: body.split('\n').filter(l => l.startsWith('## ')).map(l => l.replace(/^##\s+/, '').trim()),
        hasHandoff: body.includes('Handoff Protocol'),
      });
    }

    const skillsDir = join(claudeDir, 'skills');
    const skillDirs = Parser.findFiles(skillsDir, 'SKILL.md');
    for (const skillPath of skillDirs) {
      const content = Parser.readFileSafe(skillPath);
      if (!content) continue;
      const { frontmatter } = Parser.parseFrontmatter(content);
      const skillName = frontmatter.name || basename(dirname(skillPath));
      result.skills.push({
        name: skillName,
        keywords: [],
        filePath: skillPath,
        references: [],
        crossPlatformSynced: false,
      });
    }

    const rulesDir = join(claudeDir, 'rules');
    const ruleFiles = Parser.findFiles(rulesDir, '.md');
    result.platformMeta.rules = ruleFiles;

    const mcpPath = join(claudeDir, 'mcp.json');
    if (Parser.exists(mcpPath)) {
      result.configPaths.push(mcpPath);
      const mcpContent = Parser.readFileSafe(mcpPath);
      if (mcpContent) {
        try {
          result.platformMeta.mcpServers = Object.keys(JSON.parse(mcpContent).mcpServers || {});
        } catch {}
      }
    }

    const dotAgent = scanDotAgent(basePath);
    for (const agent of dotAgent.agents) {
      if (!result.agents.some(a => a.name === agent.name)) result.agents.push(agent);
    }
    for (const skill of dotAgent.skills) {
      if (!result.skills.some(s => s.name === skill.name)) result.skills.push(skill);
    }
    if (dotAgent.agents.length > 0 || dotAgent.skills.length > 0) {
      const dotAgentsDir = join(basePath, '.agents');
      if (!result.configPaths.includes(dotAgentsDir)) result.configPaths.push(dotAgentsDir);
    }

    return result;
  }
}
