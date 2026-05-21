import { join, basename, dirname } from 'path';
import { readdirSync, existsSync, statSync } from 'fs';
import { PlatformScanner } from '../core/types.mjs';
import { Parser, scanDotAgent, buildCrossIndex } from '../core/parser.mjs';

export function parseSimpleYaml(content) {
  const result = {};
  const lines = content.split('\n');
  const ancestors = [];
  let currentList = null;
  let currentListIndent = -1;

  function currentContainer() {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const c = ancestors[i].container;
      if (typeof c === 'object' && !Array.isArray(c)) return c;
    }
    return result;
  }

  function trimIndent(line) {
    const trimmed = line.trimEnd();
    const text = trimmed.trimStart();
    const indent = line.length - text.length;
    return { indent, text, raw: trimmed };
  }

  for (const line of lines) {
    const { indent, text } = trimIndent(line);
    if (!text || text.startsWith('#')) continue;

    const isKey = text.endsWith(':') && !text.startsWith('- ');
    const isListItem = text.startsWith('- ');
    const isKeyValue = text.includes(': ') && !isListItem;

    if (isKey || isKeyValue) {
      while (ancestors.length > 0 && ancestors[ancestors.length - 1].indent >= indent) {
        ancestors.pop();
      }
    } else if (isListItem) {
      while (ancestors.length > 0 && ancestors[ancestors.length - 1].indent > indent) {
        ancestors.pop();
      }
    }

    if (currentList && indent < currentListIndent) {
      currentList = null;
      currentListIndent = -1;
    }

    if (isKey) {
      const key = text.slice(0, -1);
      const container = {};
      const parent = currentContainer();
      parent[key] = container;
      ancestors.push({ indent, container, key });
      currentList = null;
      currentListIndent = -1;
    } else if (text.startsWith('- ')) {
      const value = text.slice(2);

      if (currentList && indent === currentListIndent) {
        currentList.push(value);
      } else {
        const parent = currentContainer();
        const containerIdx = ancestors.length - 1;
        const parentKey = containerIdx >= 0 ? ancestors[containerIdx].key : null;

        if (parentKey) {
          const arr = [value];
          const grandParent = containerIdx > 0 ? ancestors[containerIdx - 1].container : result;
          grandParent[parentKey] = arr;
          ancestors.pop();
          ancestors.push({ indent, container: arr, key: parentKey });
          currentList = arr;
          currentListIndent = indent;
        } else {
          const arr = [value];
          const key = `__list_${indent}__`;
          parent[key] = arr;
          ancestors.push({ indent, container: arr, key });
          currentList = arr;
          currentListIndent = indent;
        }
      }
    } else if (text.includes(': ')) {
      const colonIdx = text.indexOf(': ');
      const key = text.slice(0, colonIdx);
      let value = text.slice(colonIdx + 2);
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      const parent = currentContainer();
      parent[key] = value;
      currentList = null;
      currentListIndent = -1;
    }
  }

  return result;
}

export class AntigravityScanner extends PlatformScanner {
  static platformName = 'antigravity';

  detect(basePath) {
    return Parser.exists(join(basePath, 'antigravity.yaml'))
      || Parser.exists(join(basePath, 'antigravity.json'))
      || Parser.exists(join(basePath, '.agents', 'rules'))
      || Parser.exists(join(basePath, '.agents', 'agents'))
      || Parser.exists(join(basePath, '.agents', 'skills'))
      || Parser.exists(join(basePath, '.agent', 'rules'))
      || Parser.exists(join(basePath, '.agent', 'agents'))
      || Parser.exists(join(basePath, '.agent', 'skills'));
  }

  scan(basePath) {
    const result = {
      platform: 'antigravity',
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

    let config = null;

    const yamlPath = join(basePath, 'antigravity.yaml');
    const yamlContent = Parser.readFileSafe(yamlPath);
    if (yamlContent) {
      result.configPaths.push(yamlPath);
      config = parseSimpleYaml(yamlContent);
    }

    const jsonPath = join(basePath, 'antigravity.json');
    if (!config) {
      const jsonContent = Parser.readFileSafe(jsonPath);
      if (jsonContent) {
        result.configPaths.push(jsonPath);
        try { config = JSON.parse(jsonContent); } catch {}
      }
    }

    if (config) {
      result.platformVersion = config.version || '1.0';
      result.platformMeta.rawConfig = config;

      if (config.agents) {
        for (const [name, def] of Object.entries(config.agents)) {
          result.agents.push({
            name,
            role: def.role || '',
            keywords: [],
            mode: def.mode || 'subagent',
            filePath: '',
            permissions: { edit: 'allow', bash: 'allow' },
            sections: [],
            hasHandoff: false,
          });
        }
      }

      if (config.skills && Array.isArray(config.skills)) {
        for (const name of config.skills) {
          result.skills.push({
            name,
            keywords: [],
            filePath: '',
            references: [],
            crossPlatformSynced: false,
          });
        }
      }

      if (config.tools && Array.isArray(config.tools)) {
        result.existingTools = config.tools;
      }
    }

    const dotAgent = scanDotAgent(basePath);
    for (const agent of dotAgent.agents) {
      if (!result.agents.some(a => a.name === agent.name)) {
        result.agents.push(agent);
      }
    }
    for (const skill of dotAgent.skills) {
      if (!result.skills.some(s => s.name === skill.name)) {
        result.skills.push(skill);
      }
    }
    if (dotAgent.agents.length > 0 || dotAgent.skills.length > 0) {
      const dotAgentsDir = join(basePath, '.agents');
      if (!result.configPaths.some(p => p === dotAgentsDir || p.startsWith(dotAgentsDir + '\\') || p.startsWith(dotAgentsDir + '/'))) {
        result.configPaths.push(dotAgentsDir);
      }
      result.platformMeta.agentDiscovery = config ? 'yaml+rules' : 'rules';
    }

    buildCrossIndex(result.agents, result.skills);
    return result;
  }
}
