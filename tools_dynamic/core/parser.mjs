import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';

function readFileSafe(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function parseAgentFromMd(filePath, content) {
  const { frontmatter, body } = Parser.parseFrontmatter(content);
  const fmName = frontmatter.name || frontmatter.role || basename(filePath, '.md');
  return {
    name: fmName,
    role: frontmatter.description || frontmatter.role || '',
    keywords: [],
    mode: frontmatter.mode === 'primary' ? 'primary' : 'subagent',
    filePath,
    permissions: { edit: frontmatter.permission?.edit || frontmatter.edit || 'allow', bash: frontmatter.permission?.bash || frontmatter.bash || 'allow' },
    sections: body.split('\n').filter(l => l.startsWith('## ')).map(l => l.replace(/^##\s+/, '').trim()),
    hasHandoff: body.includes('Handoff Protocol'),
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
  };
}

export function scanDotAgent(basePath) {
  const agentDir = join(basePath, '.agent');
  if (!existsSync(agentDir)) return { agents: [], skills: [] };

  const agents = [];
  const skills = [];

  const rulesDir = join(agentDir, 'rules');
  if (existsSync(rulesDir)) {
    const entries = readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skill = parseSkillFromDir(join(rulesDir, entry.name));
        if (skill && !skills.some(s => s.name === skill.name)) skills.push(skill);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = readFileSafe(join(rulesDir, entry.name));
        if (content) agents.push(parseAgentFromMd(join(rulesDir, entry.name), content));
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
        if (content) agents.push(parseAgentFromMd(join(nativeAgentsDir, entry.name), content));
      }
    }
  }

  const skillsDir = join(agentDir, 'skills');
  if (existsSync(skillsDir)) {
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skill = parseSkillFromDir(join(skillsDir, entry.name));
        if (skill && !skills.some(s => s.name === skill.name)) skills.push(skill);
      }
    }
  }

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
