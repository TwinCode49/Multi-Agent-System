import { join, basename, dirname } from 'path';
import { existsSync } from 'fs';
import { PlatformScanner } from '../core/types.mjs';
import { Parser, scanDotAgent, buildCrossIndex, resolveSkillRefs } from '../core/parser.mjs';

export class VSCodeScanner extends PlatformScanner {
  static platformName = 'vscode';

  detect(basePath) {
    return existsSync(join(basePath, '.github'));
  }

  scan(basePath) {
    const result = {
      platform: 'vscode',
      platformVersion: '1.0',
      detected: true,
      nativeCapabilities: {
        subagents: false,
        agentTeams: false,
        parallelExecution: false,
        hooks: false,
        mcp: false,
        customTools: false,
      },
      agents: [],
      skills: [],
      workflows: [],
      existingTools: [],
      configPaths: [],
      platformMeta: {},
    };

    const githubDir = join(basePath, '.github');
    result.configPaths.push(githubDir);

    const copilotPath = join(githubDir, 'copilot-instructions.md');
    const copilotContent = Parser.readFileSafe(copilotPath);
    if (copilotContent) {
      result.configPaths.push(copilotPath);
      result.platformMeta.hasCopilotInstructions = true;
    }

    const agentsDir = join(githubDir, 'agents');
    const agentFiles = Parser.findFiles(agentsDir, '.md');
    for (const filePath of agentFiles) {
      const content = Parser.readFileSafe(filePath);
      if (!content) continue;
      const { frontmatter, body } = Parser.parseFrontmatter(content);
      const name = frontmatter.name || frontmatter.role || basename(filePath, '.md');
      const rawRefs = Array.isArray(frontmatter.paths) ? frontmatter.paths : [];
      result.agents.push({
        name,
        role: frontmatter.description || frontmatter.role || '',
        keywords: [],
        mode: 'subagent',
        filePath,
        permissions: { edit: 'allow', bash: 'allow' },
        sections: body.split('\n').filter(l => l.startsWith('## ')).map(l => l.replace(/^##\s+/, '').trim()),
        hasHandoff: body.includes('Handoff Protocol'),
        skills: [],
        _skillRefs: rawRefs,
      });
    }

    const skillsDir = join(githubDir, 'skills');
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
        role: frontmatter.role || undefined,
      });
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

    resolveSkillRefs(result.agents, result.skills);
    buildCrossIndex(result.agents, result.skills);
    return result;
  }
}
