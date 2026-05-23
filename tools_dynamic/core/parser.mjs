import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';

function readFileSafe(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function parseAgentFromMd(filePath, content) {
  const { frontmatter, body } = Parser.parseFrontmatter(content);
  const fmName = frontmatter.name || frontmatter.role || basename(filePath, '.md');
  const rawSkills = Array.isArray(frontmatter.skills)
    ? frontmatter.skills
    : (Array.isArray(frontmatter.paths) ? frontmatter.paths : []);
  return {
    name: fmName,
    role: frontmatter.description || frontmatter.role || '',
    keywords: [],
    mode: frontmatter.mode === 'primary' ? 'primary' : 'subagent',
    filePath,
    permissions: { edit: frontmatter.permission?.edit || frontmatter.edit || 'allow', bash: frontmatter.permission?.bash || frontmatter.bash || 'allow' },
    sections: body.split('\n').filter(l => l.startsWith('## ')).map(l => l.replace(/^##\s+/, '').trim()),
    hasHandoff: body.includes('Handoff Protocol'),
    skills: [],
    _skillRefs: rawSkills,
    model: frontmatter.model === 'auto' ? undefined : (frontmatter.model || undefined),
  };
}

function parseSkillFromDir(skillDir) {
  const skillPath = join(skillDir, 'SKILL.md');
  const content = readFileSafe(skillPath);
  if (!content) return null;
  const { frontmatter } = Parser.parseFrontmatter(content);
  const refsDir = join(skillDir, 'references');
  return {
    name: frontmatter.name || basename(skillDir),
    keywords: [],
    filePath: skillPath,
    references: existsSync(refsDir) ? readdirSync(refsDir).filter(f => f.endsWith('.md')).map(f => join(refsDir, f)) : [],
    crossPlatformSynced: false,
    role: frontmatter.role || undefined,
  };
}

export function buildCrossIndex(agents, skills) {
  const skillMap = {};
  for (const skill of skills) {
    skillMap[skill.name.toLowerCase()] = skill;
    if (!skill.agents) skill.agents = [];
  }
  for (const agent of agents) {
    if (!agent.skills) agent.skills = [];
    for (const skillName of agent.skills) {
      const key = skillName.toLowerCase();
      if (skillMap[key] && !skillMap[key].agents.includes(agent.name)) {
        skillMap[key].agents.push(agent.name);
      }
    }
  }
  for (const skill of skills) {
    for (const agentName of skill.agents) {
      const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
      if (agent && !agent.skills.includes(skill.name)) {
        agent.skills.push(skill.name);
      }
    }
  }
}

export function resolveSkillRefs(agents, skills) {
  const skillMap = {};
  for (const skill of skills) {
    skillMap[skill.name.toLowerCase()] = skill;
    if (!skill.agents) skill.agents = [];
  }
  for (const agent of agents) {
    if (!agent.skills) agent.skills = [];
    if (!agent._skillRefs || agent._skillRefs.length === 0) continue;
    for (const ref of agent._skillRefs) {
      const candidateName = basename(ref).replace(/\.md$/i, '').toLowerCase();
      const matched = skillMap[candidateName];
      if (matched) {
        if (!agent.skills.includes(matched.name)) agent.skills.push(matched.name);
        if (!matched.agents.includes(agent.name)) matched.agents.push(agent.name);
      }
    }
    delete agent._skillRefs;
  }
}

export function scanDotAgent(basePath) {
  const agents = [];
  const skills = [];

  const scanDir = (agentDir) => {
    if (!existsSync(agentDir)) return;

    const rulesDir = join(agentDir, 'rules');
    if (existsSync(rulesDir)) {
      const entries = readdirSync(rulesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skill = parseSkillFromDir(join(rulesDir, entry.name));
          if (skill && !skills.some(s => s.name === skill.name)) {
            skills.push(skill);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = readFileSafe(join(rulesDir, entry.name));
          if (content) {
            const parsed = parseAgentFromMd(join(rulesDir, entry.name), content);
            if (!agents.some(a => a.name === parsed.name)) {
              agents.push(parsed);
            }
          }
        }
      }
    }

    const nativeAgentsDir = join(agentDir, 'agents');
    if (existsSync(nativeAgentsDir)) {
      const entries = readdirSync(nativeAgentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const name = basename(entry.name, '.md');
          if (agents.some(a => a.name === name)) continue;
          const content = readFileSafe(join(nativeAgentsDir, entry.name));
          if (content) {
            const parsed = parseAgentFromMd(join(nativeAgentsDir, entry.name), content);
            if (!agents.some(a => a.name === parsed.name)) {
              agents.push(parsed);
            }
          }
        }
      }
    }

    const skillsDir = join(agentDir, 'skills');
    if (existsSync(skillsDir)) {
      const entries = readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skill = parseSkillFromDir(join(skillsDir, entry.name));
          if (skill && !skills.some(s => s.name === skill.name)) {
            skills.push(skill);
          }
        }
      }
    }
  };

  // Scan .agents first (primary standard), then .agent for backward compatibility.
  scanDir(join(basePath, '.agents'));
  scanDir(join(basePath, '.agent'));

  resolveSkillRefs(agents, skills);

  return { agents, skills };
}

export class Parser {
  static parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) return { frontmatter: {}, body: content };
    const yaml = match[1];
    const body = content.slice(match[0].length);
    const frontmatter = {};
    for (const line of yaml.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const key = trimmed.slice(0, colonIdx).trim();
      let value = trimmed.slice(colonIdx + 1).trim();
      if (value.startsWith('>')) {
        value = value.slice(1).trim();
      }
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      }
      frontmatter[key] = value;
    }
    return { frontmatter, body };
  }

  static parseMarkdownTable(markdown, tableIdentifier) {
    const lines = markdown.split('\n');
    const tableStart = lines.findIndex(l => l.includes(tableIdentifier));
    if (tableStart === -1) return [];

    const headerLine = lines[tableStart];
    const separatorLine = lines[tableStart + 1];
    if (!separatorLine || !separatorLine.includes('---')) return [];

    const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
    const rows = [];
    for (let i = tableStart + 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('|')) break;
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length === headers.length) {
        const row = {};
        headers.forEach((h, idx) => { row[h] = cells[idx]; });
        rows.push(row);
      }
    }
    return rows;
  }

  static parseDispatchMatrix(content) {
    const rows = this.parseMarkdownTable(content, 'Trigger Keywords');
    const map = {};
    for (const row of rows) {
      const keywords = row['Trigger Keywords'].split(',').map(k => k.trim().toLowerCase());
      const agent = row['Secondary Agent'].replace(/^@/, '').trim();
      for (const kw of keywords) {
        map[kw] = agent;
      }
    }
    return map;
  }

  static readFileSafe(filePath) {
    try {
      return readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  static exists(filePath) {
    return existsSync(filePath);
  }

  static findFiles(dirPath, extension = null) {
    const results = [];
    if (!existsSync(dirPath)) return results;
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.findFiles(fullPath, extension));
      } else if (!extension || entry.name.endsWith(extension)) {
        results.push(fullPath);
      }
    }
    return results;
  }
}
