import { join, basename, dirname } from 'path';
import { existsSync } from 'fs';
import { PlatformScanner } from '../core/types.mjs';
import { Parser, scanDotAgent, buildCrossIndex, resolveSkillRefs } from '../core/parser.mjs';

function parseKeywords(value) {
  if (Array.isArray(value)) return value.map(k => k.toLowerCase().trim());
  if (typeof value === 'string') return value.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  return [];
}

export class OpenCodeScanner extends PlatformScanner {
  static platformName = 'opencode';

  detect(basePath) {
    return existsSync(join(basePath, '.opencode'));
  }

  scan(basePath) {
    const result = {
      platform: 'opencode',
      platformVersion: '1.0',
      detected: true,
      nativeCapabilities: {
        subagents: false,
        agentTeams: false,
        parallelExecution: false,
        hooks: false,
        mcp: false,
        customTools: true,
      },
      agents: [],
      skills: [],
      workflows: [],
      existingTools: [],
      configPaths: [],
      platformMeta: {},
    };

    const opencodeDir = join(basePath, '.opencode');

    result.configPaths.push(opencodeDir);

    const opencodeJsonPath = join(opencodeDir, 'opencode.json');
    const opencodeJsonContent = Parser.readFileSafe(opencodeJsonPath);
    if (opencodeJsonContent) {
      result.configPaths.push(opencodeJsonPath);
      try {
        const config = JSON.parse(opencodeJsonContent);
        result.platformVersion = config.version || '1.0';
      } catch { }
    }

    const agentsDir = join(opencodeDir, 'agents');
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
        keywords: parseKeywords(frontmatter['TRIGGER KEYWORDS']),
        mode: frontmatter.mode === 'primary' ? 'primary' : 'subagent',
        filePath,
        permissions: {
          edit: frontmatter['edit'] || (frontmatter.mode === 'read-only' ? 'deny' : 'allow'),
          bash: frontmatter['bash'] || 'allow',
        },
        sections: body.split('\n').filter(l => l.startsWith('## ')).map(l => l.replace(/^##\s+/, '').trim()),
        hasHandoff: body.includes('Handoff Protocol'),
        skills: [],
        _skillRefs: rawRefs,
      });
    }

    const agendsMdPath = join(basePath, 'AGENTS.md');
    const agendsMdContent = Parser.readFileSafe(agendsMdPath);
    if (agendsMdContent) {
      result.configPaths.push(agendsMdPath);
      result.platformMeta.dispatchMatrix = Parser.parseDispatchMatrix(agendsMdContent);
    }

    const skillsDir = join(opencodeDir, 'skills');
    const skillDirs = Parser.findFiles(skillsDir, 'SKILL.md');
    for (const skillPath of skillDirs) {
      const content = Parser.readFileSafe(skillPath);
      if (!content) continue;
      const { frontmatter } = Parser.parseFrontmatter(content);
      const skillName = frontmatter.name || basename(dirname(skillPath));
      result.skills.push({
        name: skillName,
        keywords: parseKeywords(frontmatter['TRIGGER KEYWORDS']),
        filePath: skillPath,
        references: Parser.findFiles(join(dirname(skillPath), 'references'), '.md'),
        crossPlatformSynced: false,
        role: frontmatter.role || undefined,
      });
    }

    const toolsDir = join(basePath, 'tools');
    if (existsSync(join(toolsDir, 'agent-testing'))) result.existingTools.push('testing');
    if (existsSync(join(toolsDir, 'agent-metrics'))) result.existingTools.push('metrics');
    if (existsSync(join(toolsDir, 'agent-workflows'))) result.existingTools.push('workflows');

    const workflowsDefDir = join(basePath, 'tools', 'agent-workflows', 'definitions');
    const workflowFiles = Parser.findFiles(workflowsDefDir, '.json');
    for (const wfPath of workflowFiles) {
      const content = Parser.readFileSafe(wfPath);
      if (!content) continue;
      try {
        const wf = JSON.parse(content);
        result.workflows.push({
          name: wf.name || basename(wfPath, '.json'),
          steps: (wf.steps || []).length,
          agents: [...new Set((wf.steps || []).map(s => s.agent))],
          filePath: wfPath,
        });
      } catch { }
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
