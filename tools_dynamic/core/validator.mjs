import { WorkflowGenerator } from './workflow-generator.mjs';

export class Validator {
  validate(scanResults) {
    const issues = [];

    for (const platform of scanResults) {
      this._checkOrphanSkills(platform, issues);
      this._checkBrokenSkillRefs(platform, issues);
      this._checkSubagentsWithoutSkills(platform, issues);
      this._checkWorkflowAgentExists(platform, issues);
      this._checkKeywordSkillOverlap(platform, issues);
      this._checkUnclassifiedAgents(platform, issues);
      this._checkLowConfidenceAgents(platform, issues);
    }

    if (scanResults.length >= 2) {
      this._checkCrossPlatformDrift(scanResults, issues);
    }

    return issues;
  }

  _checkOrphanSkills(platform, issues) {
    for (const skill of platform.skills) {
      if (!skill.agents || skill.agents.length === 0) {
        issues.push({
          platform: platform.platform,
          severity: 'warning',
          type: 'orphan-skill',
          skill: skill.name,
          message: `Skill "${skill.name}" is not referenced by any agent`,
          suggestion: 'Add the skill name to an agent\'s `skills` frontmatter field or remove unused skills',
        });
      }
    }
  }

  _checkBrokenSkillRefs(platform, issues) {
    const skillNames = new Set(platform.skills.map(s => s.name.toLowerCase()));
    for (const agent of platform.agents) {
      if (!agent.skills) continue;
      for (const skillName of agent.skills) {
        if (!skillNames.has(skillName.toLowerCase())) {
          issues.push({
            platform: platform.platform,
            severity: 'blocker',
            type: 'broken-skill-ref',
            agent: agent.name,
            skill: skillName,
            message: `Agent "${agent.name}" references skill "${skillName}" which does not exist`,
            suggestion: 'Create a SKILL.md for the referenced skill or remove the reference from the agent',
          });
        }
      }
    }
  }

  _checkSubagentsWithoutSkills(platform, issues) {
    for (const agent of platform.agents) {
      if (agent.mode === 'subagent' && (!agent.skills || agent.skills.length === 0)) {
        issues.push({
          platform: platform.platform,
          severity: 'warning',
          type: 'subagent-no-skills',
          agent: agent.name,
          message: `Subagent "${agent.name}" has no skills assigned`,
          suggestion: 'Assign skills via the `skills` frontmatter field for domain-specific expertise',
        });
      }
    }
  }

  _checkWorkflowAgentExists(platform, issues) {
    const agentNames = new Set(platform.agents.map(a => a.name.toLowerCase()));
    for (const wf of platform.workflows || []) {
      for (const wfAgent of wf.agents || []) {
        if (!agentNames.has(wfAgent.toLowerCase())) {
          issues.push({
            platform: platform.platform,
            severity: 'warning',
            type: 'workflow-orphan-agent',
            agent: wfAgent,
            workflow: wf.name,
            message: `Workflow "${wf.name}" references agent "${wfAgent}" which is not in current scan`,
            suggestion: 'Add the missing agent definition or update the workflow definition',
          });
        }
      }
    }
  }

  _checkKeywordSkillOverlap(platform, issues) {
    const wfg = new WorkflowGenerator();
    wfg.classifyAgents(platform.agents, platform.skills || []);
    for (const agent of platform.agents) {
      if (!agent.skills || agent.skills.length === 0) continue;
      const meta = wfg._classificationMap[agent.name];
      if (meta && meta.method === 'jaccard' && meta.confidence < 0.1) {
        issues.push({
          platform: platform.platform,
          severity: 'info',
          type: 'keyword-skill-mismatch',
          agent: agent.name,
          message: `Agent "${agent.name}" has low keyword overlap with its skill (confidence: ${(meta.confidence * 100).toFixed(0)}%)`,
          suggestion: 'Add more matching keywords between the agent and its linked skill',
        });
      }
    }
  }

  _checkUnclassifiedAgents(platform, issues) {
    const wfg = new WorkflowGenerator();
    wfg.classifyAgents(platform.agents, platform.skills || []);
    for (const agent of platform.agents) {
      const meta = wfg._classificationMap[agent.name];
      if (meta && !meta.classified) {
        issues.push({
          platform: platform.platform,
          severity: 'info',
          type: 'unclassified-agent',
          agent: agent.name,
          message: `Agent "${agent.name}" could not be classified into any role`,
          suggestion: 'Assign skills with relevant keywords or add role-matching keywords to the agent definition',
        });
      }
    }
  }

  _checkLowConfidenceAgents(platform, issues) {
    const wfg = new WorkflowGenerator();
    wfg.classifyAgents(platform.agents, platform.skills || []);
    for (const agent of platform.agents) {
      const meta = wfg._classificationMap[agent.name];
      if (meta && meta.classified && meta.confidence < 0.3) {
        issues.push({
          platform: platform.platform,
          severity: 'info',
          type: 'low-confidence-agent',
          agent: agent.name,
          message: `Agent "${agent.name}" classified as "${meta.role}" with low confidence (${(meta.confidence * 100).toFixed(0)}%)`,
          suggestion: 'Add more specific keywords to the skill definition or set an explicit role field in SKILL.md',
        });
      }
    }
  }

  _checkCrossPlatformDrift(scanResults, issues) {
    const skillPlatformMap = {};
    for (const platform of scanResults) {
      for (const skill of platform.skills) {
        const key = skill.name.toLowerCase();
        if (!skillPlatformMap[key]) skillPlatformMap[key] = [];
        skillPlatformMap[key].push({ platform: platform.platform, skill });
      }
    }

    for (const [skillName, entries] of Object.entries(skillPlatformMap)) {
      if (entries.length < 2) continue;

      const refPlatforms = entries.map(e => e.platform);

      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i].skill;
          const b = entries[j].skill;
          const aKw = new Set((a.keywords || []).map(k => k.toLowerCase()));
          const bKw = new Set((b.keywords || []).map(k => k.toLowerCase()));
          const kwMatch = aKw.size === bKw.size && [...aKw].every(k => bKw.has(k));
          const refMatch = (a.references || []).length === (b.references || []).length;

          if (!kwMatch || !refMatch) {
            issues.push({
              platform: `${entries[i].platform} vs ${entries[j].platform}`,
              severity: 'warning',
              type: 'cross-platform-drift',
              skill: skillName,
              message: `Skill "${skillName}" differs between ${entries[i].platform} and ${entries[j].platform} (keywords: ${aKw.size} vs ${bKw.size}, refs: ${(a.references || []).length} vs ${(b.references || []).length})`,
              suggestion: 'Sync skill definitions across platforms to ensure consistent behavior',
            });
            break;
          }
        }
        if (issues.some(i => i.skill === skillName && i.type === 'cross-platform-drift')) break;
      }
    }
  }
}
