import { existsSync } from 'fs';
import { WorkflowGenerator } from './workflow-generator.mjs';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

export class Reporter {
  toJSON(results, projectPath, extra = {}) {
    const summary = this._buildSummary(results);
    const issues = this.diagnose(results);
    const recommendations = this.generateRecommendations(results);

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      projectPath,
      platforms: results.map(p => this._platformToJSON(p)),
      issues,
      recommendations,
      summary,
    }, null, 2);
  }

  _platformToJSON(platform) {
    const wfg = new WorkflowGenerator();

    return {
      platform: platform.platform,
      platformVersion: platform.platformVersion,
      detected: platform.detected,
      health: this._healthColor(platform),
      nativeCapabilities: platform.nativeCapabilities,
      agents: {
        total: platform.agents.length,
        list: platform.agents.map(a => ({
          name: a.name,
          mode: a.mode,
          role: a.role,
          model: a.model || null,
          keywords: a.keywords,
          keywordCount: a.keywords.length,
          sections: a.sections,
          sectionCount: a.sections.length,
          hasHandoff: a.hasHandoff,
          permissions: a.permissions,
          filePath: a.filePath,
          recommendations: this._agentRecommendations(a),
        })),
      },
      skills: {
        total: platform.skills.length,
        list: platform.skills.map(s => ({
          name: s.name,
          keywords: s.keywords,
          keywordCount: s.keywords.length,
          references: s.references,
          referenceCount: s.references.length,
          filePath: s.filePath,
          crossPlatformSynced: s.crossPlatformSynced,
          recommendations: this._skillRecommendations(s),
        })),
      },
      workflows: {
        total: platform.workflows.length,
        list: platform.workflows.map(w => ({
          name: w.name,
          steps: w.steps,
          agents: w.agents,
          filePath: w.filePath,
        })),
        suggested: this._suggestedWorkflows(platform, wfg),
      },
      tools: platform.existingTools.reduce((acc, t) => ({ ...acc, [t]: true }), {
        testing: platform.existingTools.includes('testing'),
        metrics: platform.existingTools.includes('metrics'),
        workflows: platform.existingTools.includes('workflows'),
      }),
      configPaths: platform.configPaths,
      platformMeta: platform.platformMeta || {},
    };
  }

  _agentRecommendations(agent) {
    const recs = [];
    if (agent.keywords.length < 10) {
      recs.push(`Add more TRIGGER KEYWORDS (currently ${agent.keywords.length}, target ≥ 10)`);
    }
    if (!agent.hasHandoff) {
      recs.push('Add ## Handoff Protocol section to the agent definition');
    }
    if (agent.sections.length < 3) {
      recs.push(`Add more sections (currently ${agent.sections.length}, target ≥ 3)`);
    }
    if (agent.mode === 'subagent' && agent.keywords.length < 5) {
      recs.push('Increase keyword coverage for better dispatch matching');
    }
    return recs;
  }

  _skillRecommendations(skill) {
    const recs = [];
    if (skill.keywords.length < 10) {
      recs.push(`Expand TRIGGER KEYWORDS (currently ${skill.keywords.length}, target ≥ 10)`);
    }
    if (skill.references.length === 0) {
      recs.push('Add references/ directory with usage examples');
    }
    if (!skill.crossPlatformSynced) {
      recs.push(`Skill not synced to other platforms (only found in ${skill.filePath.split(/[\\/]/)[0]})`);
    }
    return recs;
  }

  _suggestedWorkflows(platform, wfg) {
    if (platform.agents.length < 2) return [];
    return wfg.suggestWorkflows(platform).map(w => ({
      name: w.name,
      steps: w.steps,
      agents: w.agents,
    }));
  }

  toHTML(results, projectPath, extra = {}) {
    const summary = this._buildSummary(results);
    const issues = this.diagnose(results);
    const recommendations = this.generateRecommendations(results);
    const wfg = new WorkflowGenerator();

    const platformCards = results.map(p => {
      const health = this._healthColor(p);
      const agentRows = p.agents.map(a =>
        `<tr>
          <td>${a.name}</td>
          <td>${a.role || '—'}</td>
          <td>${a.mode}</td>
          <td>${a.keywords.length}</td>
          <td>${a.sections.length}</td>
          <td>${a.hasHandoff ? '✓' : '✗'}</td>
          <td>${a.permissions?.edit || 'allow'}</td>
        </tr>`
      ).join('');

      const skillRows = p.skills.map(s =>
        `<tr>
          <td>${s.name}</td>
          <td>${s.keywords.length}</td>
          <td>${s.references.length}</td>
          <td>${s.crossPlatformSynced ? '✓' : '✗'}</td>
          <td>${(this._skillRecommendations(s).length)}</td>
        </tr>`
      ).join('');

      const workflowRows = (p.workflows || []).map(w =>
        `<tr><td>${w.name}</td><td>${w.steps}</td><td>${w.agents.join(', ')}</td></tr>`
      ).join('');

      const suggested = this._suggestedWorkflows(p, wfg);
      const suggestedRows = suggested.map(w =>
        `<tr><td>${w.name}</td><td>${w.steps}</td><td>${w.agents.join(', ')}</td></tr>`
      ).join('');

      return `
        <div class="platform health-${health}">
          <h2><span class="health-dot health-${health}">●</span> ${p.platform} <small>v${p.platformVersion}</small></h2>
          <div class="meta">Config: ${p.configPaths.join(', ')} | Capabilities: ${Object.entries(p.nativeCapabilities).filter(([,v]) => v).map(([k]) => k).join(', ') || 'none'}</div>

          <h3>Agents (${p.agents.length})</h3>
          ${agentRows ? `<table><tr><th>Name</th><th>Role</th><th>Mode</th><th>Keywords</th><th>Sections</th><th>Handoff</th><th>Permissions</th></tr>${agentRows}</table>` : '<p class="none">No agents detected.</p>'}

          <h3>Skills (${p.skills.length})</h3>
          ${skillRows ? `<table><tr><th>Name</th><th>Keywords</th><th>Refs</th><th>Synced</th><th>Issues</th></tr>${skillRows}</table>` : '<p class="none">No skills detected.</p>'}

          <h3>Workflows</h3>
          ${workflowRows ? `<table><tr><th>Name</th><th>Steps</th><th>Agents</th></tr>${workflowRows}</table>` : '<p class="none">No workflows defined.</p>'}

          ${suggestedRows ? `
          <h3>Suggested Workflows</h3>
          <table class="suggested"><tr><th>Name</th><th>Steps</th><th>Agents</th></tr>${suggestedRows}</table>` : ''}
        </div>`;
    }).join('');

    const issuesHtml = issues.map(i => {
      const sev = i.severity === 'blocker' ? '🔴' : i.severity === 'warning' ? '🟡' : 'ℹ️';
      const sevClass = i.severity === 'blocker' ? 'blocker' : i.severity === 'warning' ? 'warning' : 'info';
      return `<li class="${sevClass}">${sev} <strong>${i.agent || i.skill || i.platform}:</strong> ${i.message}${i.suggestion ? `<br><em>→ ${i.suggestion}</em>` : ''}</li>`;
    }).join('');

    const recsHtml = recommendations.map(r =>
      `<li><strong>${r.platform}:</strong> ${r.message}</li>`
    ).join('');

    const [blockers, warnings, infos] = [
      issues.filter(i => i.severity === 'blocker'),
      issues.filter(i => i.severity === 'warning'),
      issues.filter(i => i.severity === 'info'),
    ];

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>tools_dynamic Report — ${projectPath}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem; color: #1a1a2e; background: #f8f9fa; }
  h1 { border-bottom: 3px solid #1a1a2e; padding-bottom: 0.5rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
  h2 { margin: 1rem 0 0.5rem; }
  h3 { margin: 1rem 0 0.3rem; color: #444; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .platform { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 1.2rem; margin: 1rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
  .health-green { border-left: 4px solid #16a34a; }
  .health-yellow { border-left: 4px solid #ca8a04; }
  .health-red { border-left: 4px solid #dc2626; }
  .health-dot { font-size: 1.2rem; }
  .health-green .health-dot { color: #16a34a; }
  .health-yellow .health-dot { color: #ca8a04; }
  .health-red .health-dot { color: #dc2626; }
  .meta { color: #666; font-size: 0.85rem; margin: 0.3rem 0 0.8rem; }
  table { width: 100%; border-collapse: collapse; margin: 0.4rem 0; font-size: 0.85rem; }
  th, td { border: 1px solid #e8e8e8; padding: 0.4rem 0.6rem; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; color: #555; }
  .suggested td { background: #f0fdf4; }
  .none { color: #999; font-style: italic; padding: 0.3rem 0; }
  .summary-cards { display: flex; gap: 0.8rem; flex-wrap: wrap; margin: 1rem 0; }
  .card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem 1.5rem; text-align: center; flex: 1; min-width: 100px; }
  .card .num { font-size: 2rem; font-weight: 700; }
  .card .label { font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .card.health-green .num { color: #16a34a; }
  .card.health-yellow .num { color: #ca8a04; }
  .card.health-red .num { color: #dc2626; }
  .issues { margin: 1rem 0; }
  .issues ul { list-style: none; padding: 0; }
  .issues li { padding: 0.4rem 0.8rem; margin: 0.3rem 0; border-radius: 4px; font-size: 0.9rem; }
  .issues .blocker { background: #fef2f2; border-left: 3px solid #dc2626; }
  .issues .warning { background: #fefce8; border-left: 3px solid #ca8a04; }
  .issues .info { background: #eff6ff; border-left: 3px solid #3b82f6; }
  .issues strong { text-transform: capitalize; }
  .footer { color: #999; font-size: 0.75rem; margin-top: 2rem; text-align: center; }
  .export-btn { display: inline-block; margin-top: 1rem; padding: 0.4rem 1rem; background: #1a1a2e; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 0.85rem; }
  .export-btn:hover { background: #333; }
  .health-bar { display: flex; gap: 0.5rem; align-items: center; margin: 0.5rem 0; }
  .health-bar .badge { padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
  .badge.blocker { background: #fef2f2; color: #dc2626; }
  .badge.warning { background: #fefce8; color: #ca8a04; }
  .badge.info { background: #eff6ff; color: #3b82f6; }
</style></head>
<body>
  <h1>🔍 tools_dynamic Report</h1>
  <p>Project: <strong>${projectPath}</strong> &nbsp;|&nbsp; ${new Date().toISOString()}</p>

  <div class="summary-cards">
    <div class="card health-${summary.overallHealth}"><div class="num">${summary.totalPlatforms}</div><div class="label">Platforms</div></div>
    <div class="card"><div class="num">${summary.totalAgents}</div><div class="label">Agents</div></div>
    <div class="card"><div class="num">${summary.totalSkills}</div><div class="label">Skills</div></div>
    <div class="card"><div class="num">${summary.totalWorkflows}</div><div class="label">Workflows</div></div>
  </div>

  <div class="health-bar">
    <span class="badge blocker">${blockers.length} blockers</span>
    <span class="badge warning">${warnings.length} warnings</span>
    <span class="badge info">${infos.length} suggestions</span>
  </div>

  ${issuesHtml ? `<div class="issues"><h3>Issues (${issues.length})</h3><ul>${issuesHtml}</ul></div>` : ''}

  <div class="recommendations">
    <h3>Recommendations</h3>
    ${recsHtml ? `<ul>${recsHtml}</ul>` : '<p>No recommendations at this time.</p>'}
  </div>

  ${platformCards}

  <div class="footer">
    Generated by tools_dynamic v2.0.0-alpha
    <br><a href="#" class="export-btn" onclick="navigator.clipboard.writeText(JSON.stringify(window.__reportData,null,2))">📋 Copy JSON</a>
  </div>

  <script>window.__reportData = ${JSON.stringify({ projectPath, platforms: results, summary })};</script>
</body></html>`;
  }

  async printAnalysis(results, projectPath, extra = {}) {
    console.log(`\n  ${BOLD}🔍 Analysis: ${projectPath}${RESET}\n`);

    if (results.length === 0) {
      console.log(`  ${YELLOW}No agent platforms detected.${RESET}`);
      try {
        const { VanillaDetector } = await import('./vanilla-detector.mjs');
        const detector = new VanillaDetector();
        const vanilla = detector.detect(projectPath);
        if (vanilla.detected) {
          console.log(`  ${CYAN}Detected project type: ${vanilla.language}${RESET}`);
          if (vanilla.framework) console.log(`  ${CYAN}Framework: ${vanilla.framework}${RESET}`);
          console.log(`  ℹ️  ${CYAN}Recommended platform: ${vanilla.recommendedPlatform}${RESET}`);
          console.log(`  ${CYAN}   Or use --platform vanilla for the generic .agents/ convention${RESET}`);
          console.log(`  💡 Run ${CYAN}tools-dynamic init${RESET} to bootstrap agent configuration.\n`);
        } else {
          console.log(`  💡 Run ${CYAN}tools-dynamic init${RESET} to bootstrap agent configuration.\n`);
        }
      } catch {
        console.log(`  ℹ️  Run ${CYAN}tools-dynamic init${RESET} to bootstrap agent configuration.\n`);
      }
      return;
    }

    for (const platform of results) {
      const health = this._healthIcon(platform);
      console.log(`  ${health} ${BOLD}${platform.platform}${RESET} ${platform.platformVersion}`);
      console.log(`     Config: ${platform.configPaths.join(', ')}`);
      console.log(`     Agents: ${platform.agents.length}  |  Skills: ${platform.skills.length}  |  Workflows: ${platform.workflows.length}`);
      console.log(`     Tools: ${platform.existingTools.length > 0 ? platform.existingTools.join(', ') : '(none)'}`);

      const caps = platform.nativeCapabilities;
      const enabled = Object.entries(caps).filter(([, v]) => v).map(([k]) => k);
      if (enabled.length > 0) console.log(`     Capabilities: ${enabled.join(', ')}`);

      if (platform.agents.length > 0) {
        console.log(`\n     ${BOLD}Agents:${RESET}`);
        for (const agent of platform.agents) {
          const handoffIcon = agent.hasHandoff ? '📋' : '  ';
          const kwWarning = agent.keywords.length < 10 ? `${YELLOW}⚠${RESET}` : ' ';
          const modelStr = agent.model ? `${agent.model}` : `${YELLOW}default${RESET}`;
          console.log(`       ${handoffIcon} ${agent.name} (${agent.mode}) — ${agent.role} ${kwWarning} [model: ${modelStr}]`);
          if (agent.keywords.length > 0) {
            console.log(`          Keywords: ${agent.keywords.slice(0, 8).join(', ')}${agent.keywords.length > 8 ? '...' : ''}`);
          }
        }
      }

      if (platform.skills.length > 0) {
        console.log(`\n     ${BOLD}Skills:${RESET}`);
        for (const skill of platform.skills) {
          const syncIcon = skill.crossPlatformSynced ? '🔄' : '  ';
          console.log(`       📦 ${syncIcon} ${skill.name} (${skill.keywords.length} keywords)`);
        }
      }

      if (platform.workflows.length > 0) {
        console.log(`\n     ${BOLD}Workflows:${RESET}`);
        for (const wf of platform.workflows) {
          console.log(`       ⚡ ${wf.name} — ${wf.steps} steps [${wf.agents.join(', ')}]`);
        }
      }

      console.log();
    }

    this._printAgentSkillMapping(results);
    this._printSummary(results);
    this._printNextSteps(results);
  }

  printDiagnosis(results, projectPath) {
    console.log(`\n  ${BOLD}🔬 Diagnosis: ${projectPath}${RESET}\n`);

    if (results.length === 0) {
      console.log(`  ${YELLOW}⚠️  No configuration detected.${RESET}`);
      console.log(`  💡 Run ${CYAN}tools-dynamic init${RESET} to bootstrap agent setup.\n`);
      return;
    }

    const issues = this.diagnose(results);

    if (issues.length === 0) {
      console.log(`  ${GREEN}No issues found. Configuration looks good!${RESET}\n`);
      return;
    }

    const blockers = issues.filter(i => i.severity === 'blocker');
    const warnings = issues.filter(i => i.severity === 'warning');
    const infos = issues.filter(i => i.severity === 'info');

    if (blockers.length > 0) {
      console.log(`  ${BOLD}🔴 Blockers (${blockers.length}):${RESET}`);
      for (const issue of blockers) {
        console.log(`    • ${CYAN}[${issue.platform}/${issue.agent || issue.skill || 'config'}]${RESET} ${issue.message}`);
        if (issue.suggestion) console.log(`      → ${GREEN}${issue.suggestion}${RESET}`);
      }
      console.log();
    }

    if (warnings.length > 0) {
      console.log(`  ${BOLD}🟡 Warnings (${warnings.length}):${RESET}`);
      for (const issue of warnings) {
        console.log(`    • ${CYAN}[${issue.platform}/${issue.agent || issue.skill || 'config'}]${RESET} ${issue.message}`);
        if (issue.suggestion) console.log(`      → ${CYAN}${issue.suggestion}${RESET}`);
      }
      console.log();
    }

    if (infos.length > 0) {
      console.log(`  ${BOLD}ℹ️  Info (${infos.length}):${RESET}`);
      for (const issue of infos) {
        console.log(`    • ${CYAN}[${issue.platform}/${issue.agent || issue.skill || 'config'}]${RESET} ${issue.message}`);
        if (issue.suggestion) console.log(`      → ${CYAN}${issue.suggestion}${RESET}`);
      }
      console.log();
    }

    if (blockers.length === 0 && warnings.length === 0) {
      console.log(`  ${GREEN}No blockers or warnings — ${infos.length} suggestion(s)${RESET}\n`);
    }
  }

  diagnose(results) {
    const issues = [];
    const wfg = new WorkflowGenerator();

    for (const platform of results) {
      for (const agent of platform.agents) {
        if (agent.keywords.length < 10) {
          issues.push({
            platform: platform.platform,
            agent: agent.name,
            severity: 'warning',
            message: `"${agent.name}" has only ${agent.keywords.length} TRIGGER KEYWORDS (target: ≥ 10)`,
            suggestion: 'Add more trigger keywords to the frontmatter',
          });
        }

        if (!agent.hasHandoff) {
          issues.push({
            platform: platform.platform,
            agent: agent.name,
            severity: 'warning',
            message: `"${agent.name}" lacks a Handoff Protocol section`,
            suggestion: 'Add ## Handoff Protocol to the agent definition',
          });
        }

        if (agent.sections.length < 3) {
          issues.push({
            platform: platform.platform,
            agent: agent.name,
            severity: 'warning',
            message: `"${agent.name}" has only ${agent.sections.length} sections (target: ≥ 3)`,
            suggestion: 'Add more sections (Core Responsibilities, Constraints, etc.)',
          });
        }

        if (agent.permissions?.edit === 'deny' && agent.mode === 'subagent') {
          const hasReadOnlyKeyword = agent.keywords.some(k =>
            k.match(/review|security|audit|quality/)
          );
          if (!hasReadOnlyKeyword) {
            issues.push({
              platform: platform.platform,
              agent: agent.name,
              severity: 'blocker',
              message: `"${agent.name}" has edit: deny but no security/review keywords — may be incorrectly permissioned`,
              suggestion: 'Add security/review keywords or update permissions',
            });
          }

          if (!agent.model) {
            issues.push({
              platform: platform.platform,
              agent: agent.name,
              severity: 'warning',
              message: `"${agent.name}" is read-only (edit: deny) but has no specialized model assigned — will use project default`,
              suggestion: 'Add model: <name> to the agent frontmatter (e.g. model: claude-sonnet-4-20250514) for cost optimization',
            });
          }
        }

        if (agent.mode === 'subagent' && agent.keywords.length < 5) {
          issues.push({
            platform: platform.platform,
            agent: agent.name,
            severity: 'info',
            message: `"${agent.name}" has only ${agent.keywords.length} keywords — dispatch matching may be imprecise`,
            suggestion: 'Add more diverse trigger keywords for accurate auto-dispatch',
          });
        }

        const hasSkills = agent.skills && agent.skills.length > 0;
        const wfg = new WorkflowGenerator();
        const roles = wfg.classifyAgents([agent], platform.skills || []);
        const meta = wfg._classificationMap[agent.name];
        if (meta && !meta.classified && hasSkills) {
          issues.push({
            platform: platform.platform,
            agent: agent.name,
            severity: 'info',
            message: `"${agent.name}" has skills but could not be classified into a role (confidence: ${(meta.confidence * 100).toFixed(0)}%)`,
            suggestion: 'Add more relevant keywords to the skill definition or set an explicit role field',
          });
        }
      }

      for (const skill of platform.skills) {
        if (skill.keywords.length < 10) {
          issues.push({
            platform: platform.platform,
            skill: skill.name,
            severity: 'info',
            message: `Skill "${skill.name}" has only ${skill.keywords.length} keywords`,
            suggestion: 'Expand TRIGGER KEYWORDS in the skill frontmatter',
          });
        }

        if (skill.references.length === 0) {
          issues.push({
            platform: platform.platform,
            skill: skill.name,
            severity: 'info',
            message: `Skill "${skill.name}" has no references/ directory`,
            suggestion: 'Add a references/ directory with usage examples and patterns',
          });
        }

        if (!skill.crossPlatformSynced) {
          issues.push({
            platform: platform.platform,
            skill: skill.name,
            severity: 'info',
            message: `Skill "${skill.name}" is not synced to other platforms`,
            suggestion: 'Copy this skill to the other platform\'s skill directory',
          });
        }
      }

      if (platform.platformMeta?.dispatchMatrix) {
        const matrix = platform.platformMeta.dispatchMatrix;
        const agentNames = new Set(platform.agents.map(a => a.name));
        const unmatched = Object.values(matrix).filter(v => !agentNames.has(v));
        const uniqueUnmatched = [...new Set(unmatched)];
        if (uniqueUnmatched.length > 0) {
          issues.push({
            platform: platform.platform,
            severity: 'blocker',
            message: `Dispatch matrix references agents not found in definitions: ${uniqueUnmatched.join(', ')}`,
            suggestion: 'Create agent definition files or update the dispatch matrix',
          });
        }
      }

      if (platform.workflows.length === 0 && platform.agents.length >= 2) {
        const suggested = wfg.suggestWorkflows(platform);
        if (suggested.length > 0) {
          issues.push({
            platform: platform.platform,
            severity: 'info',
            message: `No workflows defined — ${suggested.length} workflow(s) could be auto-generated`,
            suggestion: `Consider adding: ${suggested.map(w => w.name).join(', ')}`,
          });
        }
      }

      const expectedTools = ['testing', 'metrics', 'workflows'];
      const missingTools = expectedTools.filter(t => !platform.existingTools.includes(t));
      if (missingTools.length > 0) {
        issues.push({
          platform: platform.platform,
          severity: 'info',
          message: `Missing recommended tools: ${missingTools.join(', ')}`,
          suggestion: `Run 'tools-dynamic inject --tools' to add missing tools`,
        });
      }
    }

    return issues;
  }

  generateRecommendations(results) {
    const recs = [];
    for (const platform of results) {
      if (platform.agents.length === 0) {
        recs.push({
          platform: platform.platform,
          severity: 'warning',
          message: 'No agents defined — add agent definitions to enable multi-agent workflows',
        });
      }
      if (platform.skills.length === 0) {
        recs.push({
          platform: platform.platform,
          severity: 'info',
          message: 'No skills defined — add skill definitions for domain-specific expertise',
        });
      }
      if (platform.workflows.length === 0 && platform.agents.length >= 2) {
        const wfg = new WorkflowGenerator();
        const suggested = wfg.suggestWorkflows(platform);
        if (suggested.length > 0) {
          recs.push({
            platform: platform.platform,
            severity: 'info',
            message: `Define workflows: ${suggested.map(w => `${w.name} (${w.steps} steps)`).join(', ')}`,
          });
        }
      }
    }
    return recs;
  }

  printPlatforms() {
    const platforms = [
      { name: 'OpenCode', indicators: '.opencode/, AGENTS.md, opencode.json', agents: '.opencode/agents/*.md', skills: '.opencode/skills/*/SKILL.md' },
      { name: 'VS Code / Copilot', indicators: '.github/copilot-instructions.md', agents: '.github/agents/*.md', skills: '.github/skills/*/SKILL.md' },
      { name: 'Claude Code', indicators: 'CLAUDE.md, .claude/', agents: '.claude/agents/*.md', skills: '.claude/skills/*/SKILL.md', extra: '.claude/settings.json, rules/, mcp.json' },
      { name: 'Antigravity', indicators: 'antigravity.yaml, antigravity.json', agents: 'defined in config', skills: 'defined in config' },
      { name: 'Generic (Vanilla)', indicators: '.agents/, AGENTS.md', agents: '.agents/agents/*.md', skills: '.agents/skills/*/SKILL.md', extra: 'init --platform vanilla' },
    ];

    console.log(`\n  ${BOLD}Detectable Platforms${RESET}\n`);
    for (const p of platforms) {
      console.log(`  ${BOLD}${p.name}${RESET}`);
      console.log(`     Indicators: ${p.indicators}`);
      console.log(`     Agents:     ${p.agents}`);
      console.log(`     Skills:     ${p.skills}`);
      if (p.extra) console.log(`     Extra:      ${p.extra}`);
      console.log();
    }
  }

  _buildSummary(results) {
    const issues = this.diagnose(results);
    const wfg = new WorkflowGenerator();
    let unclassifiedCount = 0;
    let confidenceSum = 0;
    let classifiedCount = 0;

    for (const platform of results) {
      wfg.classifyAgents(platform.agents, platform.skills || []);
      for (const agent of platform.agents) {
        const meta = wfg._classificationMap[agent.name];
        if (meta) {
          if (!meta.classified) { unclassifiedCount++; } else { confidenceSum += meta.confidence; classifiedCount++; }
        }
      }
    }

    return {
      totalPlatforms: results.length,
      totalAgents: results.reduce((a, p) => a + p.agents.length, 0),
      totalSkills: results.reduce((a, p) => a + p.skills.length, 0),
      totalWorkflows: results.reduce((a, p) => a + p.workflows.length, 0),
      blockers: issues.filter(i => i.severity === 'blocker').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      suggestions: issues.filter(i => i.severity === 'info').length,
      overallHealth: results.every(p => this._healthColor(p) === 'green') ? 'green'
        : results.some(p => this._healthColor(p) === 'red') ? 'red' : 'yellow',
      unclassifiedAgents: unclassifiedCount,
      avgConfidence: classifiedCount > 0 ? Math.round((confidenceSum / classifiedCount) * 100) / 100 : 0,
    };
  }

  _healthColor(platform) {
    if (platform.agents.length === 0) return 'yellow';
    const allHaveHandoff = platform.agents.every(a => a.hasHandoff);
    const allHaveKeywords = platform.agents.every(a => a.keywords.length >= 10);
    return allHaveHandoff && allHaveKeywords ? 'green' : allHaveHandoff || allHaveKeywords ? 'yellow' : 'red';
  }

  _healthIcon(platform) {
    const color = this._healthColor(platform);
    return color === 'green' ? '🟢' : color === 'yellow' ? '🟡' : '🔴';
  }

  _printAgentSkillMapping(results) {
    const wfg = new WorkflowGenerator();
    let hasAnyMapping = false;

    for (const platform of results) {
      if (platform.agents.length === 0 && platform.skills.length === 0) continue;

      const roles = wfg.classifyAgents(platform.agents, platform.skills || []);
      const agentsWithSkills = platform.agents.filter(a => a.skills && a.skills.length > 0).length;
      const skillsReferenced = platform.skills.filter(s => s.agents && s.agents.length > 0).length;
      const unclassified = platform.agents.filter(a => {
        const meta = wfg._classificationMap[a.name];
        return meta && !meta.classified;
      }).length;

      const confidenceValues = platform.agents.map(a => {
        const meta = wfg._classificationMap[a.name];
        return meta ? meta.confidence : 0;
      }).filter(c => c > 0);
      const avgConf = confidenceValues.length > 0
        ? Math.round((confidenceValues.reduce((s, c) => s + c, 0) / confidenceValues.length) * 100) / 100
        : 0;

      if (platform.agents.length > 0 || platform.skills.length > 0) {
        hasAnyMapping = true;
        console.log(`  ${BOLD}📊 Agent-Skill Mapping [${platform.platform}]${RESET}`);
        console.log(`     Agents with skills:    ${agentsWithSkills}/${platform.agents.length}`);
        console.log(`     Skills referenced:     ${skillsReferenced}/${platform.skills.length}`);
        if (unclassified > 0) {
          console.log(`     ${YELLOW}Unclassified agents:   ${unclassified}${RESET}`);
        }
        if (avgConf > 0) {
          console.log(`     Avg confidence:        ${(avgConf * 100).toFixed(0)}%`);
        }
      }

      const suggested = wfg.suggestWorkflows(platform);
      if (suggested.length > 0) {
        hasAnyMapping = true;
        console.log(`\n  ${BOLD}⚡ Suggested Workflows [${platform.platform}]${RESET}`);
        for (const s of suggested) {
          const stepConfidences = s.agents.map(aName => {
            const meta = wfg._classificationMap[aName];
            return meta ? meta.confidence : 0;
          });
          const avg = stepConfidences.length > 0
            ? Math.round((stepConfidences.reduce((s, c) => s + c, 0) / stepConfidences.length) * 100)
            : 0;
          console.log(`     ⚡ ${s.name} — ${s.steps} steps [${s.agents.join(', ')}]  (conf: ${avg}%)`);
        }
      }

      if (platform.agents.length > 0 || platform.skills.length > 0 || suggested.length > 0) {
        console.log();
      }
    }
  }

  _printSummary(results) {
    const summary = this._buildSummary(results);
    const icon = summary.overallHealth === 'green' ? '🟢' : summary.overallHealth === 'yellow' ? '🟡' : '🔴';
    console.log(`  ${BOLD}── Summary ──${RESET}`);
    console.log(`  ${icon}  ${summary.totalPlatforms} platform(s), ${summary.totalAgents} agent(s), ${summary.totalSkills} skill(s), ${summary.totalWorkflows} workflow(s)`);
    console.log(`  🔴 ${summary.blockers} blocker(s) | 🟡 ${summary.warnings} warning(s) | ℹ️ ${summary.suggestions} suggestion(s)`);
    if (summary.unclassifiedAgents > 0) {
      console.log(`  ${YELLOW}  ${summary.unclassifiedAgents} agent(s) not classified — run validate for details${RESET}`);
    }
    console.log();
  }

  _printNextSteps(results) {
    const summary = this._buildSummary(results);
    console.log(`  ${BOLD}💡 Next Steps${RESET}`);
    if (results.length === 0) {
      console.log(`   1. Run ${CYAN}tools-dynamic init${RESET} to bootstrap agent configuration`);
      console.log(`   2. Add agent definitions in the detected platform format`);
      console.log(`   3. Define TRIGGER KEYWORDS for accurate dispatch`);
    } else {
      console.log(`   1. Run ${CYAN}tools-dynamic doctor .${RESET} for detailed diagnostics`);
      console.log(`   2. Run ${CYAN}tools-dynamic report .${RESET} to generate full report`);
      console.log(`   3. Run ${CYAN}tools-dynamic init${RESET} to inject tools and processes`);
      if (summary.unclassifiedAgents > 0 || summary.blockers > 0) {
        console.log(`   4. Run ${CYAN}tools-dynamic validate .${RESET} for detailed agent-skill diagnostics`);
      }
    }
    console.log();
  }
}
