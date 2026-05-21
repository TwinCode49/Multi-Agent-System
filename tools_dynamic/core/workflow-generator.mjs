import { classifyBySkill } from './role-profiles.mjs';

export class WorkflowGenerator {
  generate(scanResult, options = {}) {
    const roles = this.classifyAgents(scanResult.agents, scanResult.skills || []);
    const workflows = [];
    const { orchestratorSynthesis } = options;

    if (roles.reviewers.length >= 1 && roles.writers.length >= 1) {
      workflows.push(this.buildReviewPipeline(roles, scanResult, orchestratorSynthesis));
    }

    if (roles.builders.length >= 1 && roles.testers.length >= 1) {
      workflows.push(this.buildFeaturePipeline(roles, scanResult, orchestratorSynthesis));
    }

    if (roles.builders.length >= 1 && roles.writers.length >= 1) {
      workflows.push(this.buildDocsGeneration(roles, scanResult));
    }

    if (scanResult.nativeCapabilities.agentTeams) {
      return this.toAgentTeamsFormat(workflows);
    }

    return this.toExecutorJSONFormat(workflows, scanResult);
  }

  suggestWorkflows(scanResult) {
    const roles = this.classifyAgents(scanResult.agents, scanResult.skills || []);
    const suggestions = [];

    if (roles.reviewers.length >= 1 && roles.writers.length >= 1) {
      suggestions.push({ name: 'review-pipeline', steps: 2, agents: [...roles.reviewers.map(a => a.name), ...roles.writers.map(a => a.name)] });
    }
    if (roles.builders.length >= 1 && roles.testers.length >= 1) {
      suggestions.push({ name: 'test-pipeline', steps: 2, agents: [roles.builders[0].name, roles.testers[0].name] });
    }
    if (roles.builders.length >= 1 && roles.writers.length >= 1) {
      suggestions.push({ name: 'docs-generation', steps: 2, agents: [roles.builders[0].name, ...roles.writers.map(a => a.name)] });
    }
    if (roles.reviewers.length >= 2) {
      suggestions.push({ name: 'full-review', steps: roles.reviewers.length + 1, agents: [...roles.reviewers.map(a => a.name), ...(roles.writers.length > 0 ? [roles.writers[0].name] : [])] });
    }

    return suggestions;
  }

  classifyAgents(agents, skills = []) {
    this._classificationMap = {};
    const roles = { reviewers: [], builders: [], writers: [], testers: [] };

    for (const agent of agents) {
      let classification = null;

      if (skills.length > 0 && agent.skills && agent.skills.length > 0) {
        const skillName = agent.skills[0];
        const skillDef = skills.find(s => s.name === skillName);
        if (skillDef) {
          classification = classifyBySkill(skillDef);
          if (classification.classified) {
            classification.skillName = skillDef.name;
          }
        }
      }

      if (!classification || !classification.classified) {
        classification = this._classifyByKeywords(agent);
      }

      this._classificationMap[agent.name] = classification;

      switch (classification.role) {
        case 'reviewer':
          roles.reviewers.push(agent);
          break;
        case 'writer':
          roles.writers.push(agent);
          break;
        case 'tester':
          roles.testers.push(agent);
          break;
        default:
          roles.builders.push(agent);
          break;
      }
    }

    return roles;
  }

  _classifyByKeywords(agent) {
    const kw = agent.keywords.join(' ').toLowerCase();
    const name = agent.name.toLowerCase();

    if (kw.match(/review|security|quality|audit|perf|performance/) || name.match(/review|security|perf/))
      return { role: 'reviewer', confidence: 0.5, method: 'keyword', classified: true };
    if (kw.match(/database|schema|api|backend|server|devops|ui|frontend|component/) || name.match(/database|devops|ui/))
      return { role: 'builder', confidence: 0.5, method: 'keyword', classified: true };
    if (kw.match(/doc|readme|changelog|apidoc|migration/) || name.match(/doc/))
      return { role: 'writer', confidence: 0.5, method: 'keyword', classified: true };
    if (kw.match(/test|spec|coverage|unittest|jest|pytest/) || name.match(/test/))
      return { role: 'tester', confidence: 0.5, method: 'keyword', classified: true };

    return { role: 'builder', confidence: 0, method: 'keyword', classified: false };
  }

  buildReviewPipeline(roles, scanResult, orchestratorSynthesis) {
    const wf = {
      name: 'review-pipeline',
      version: '1.0',
      description: 'Review code with multiple reviewers and synthesize results',
      trigger_keywords: ['review', 'audit', 'code quality'],
      steps: [],
    };

    for (const reviewer of roles.reviewers) {
      wf.steps.push({
        id: `${reviewer.name}_review`,
        agent: reviewer.name,
        skill: this._classificationMap[reviewer.name]?.skillName,
        prompt: `Review the code for ${reviewer.role || 'issues'}. Output structured findings.`,
        output_key: `${reviewer.name}_review`,
        depends_on: [],
      });
    }

    if (roles.writers.length > 0) {
      const writer = roles.writers[0];
      wf.steps.push({
        id: 'synthesis',
        agent: writer.name,
        skill: this._classificationMap[writer.name]?.skillName,
        prompt: 'Synthesize the review findings into a unified report.',
        output_key: 'final_report',
        depends_on: roles.reviewers.map(r => `${r.name}_review`),
      });
    }

    if (orchestratorSynthesis) {
      wf.synthesizer = {
        agent: 'orchestrator',
        enabled: true,
        prompt: 'Synthesize review findings into a unified report. Resolve conflicts between agents.',
        input_from: roles.reviewers.map(r => `${r.name}_review`),
      };
    }

    return wf;
  }

  buildFeaturePipeline(roles, scanResult, orchestratorSynthesis) {
    const builder = roles.builders[0];
    const tester = roles.testers[0];
    const writer = roles.writers.length > 0 ? roles.writers[0] : null;

    const wf = {
      name: 'feature-pipeline',
      version: '1.0',
      description: 'Implement a feature: build → test → document',
      trigger_keywords: ['feature', 'implement', 'new functionality'],
      steps: [
        {
          id: `${builder.name}_build`,
          agent: builder.name,
          skill: this._classificationMap[builder.name]?.skillName,
          prompt: 'Implement the feature. Output code and changes.',
          output_key: `${builder.name}_build`,
          depends_on: [],
        },
        {
          id: `${tester.name}_test`,
          agent: tester.name,
          skill: this._classificationMap[tester.name]?.skillName,
          prompt: 'Write tests for the implementation created in the previous step.',
          output_key: `${tester.name}_test`,
          depends_on: [`${builder.name}_build`],
        },
      ],
    };

    if (writer) {
      wf.steps.push({
        id: `${writer.name}_docs`,
        agent: writer.name,
        skill: this._classificationMap[writer.name]?.skillName,
        prompt: 'Document the new feature: update API docs, add changelog entry.',
        output_key: `${writer.name}_docs`,
        depends_on: [`${builder.name}_build`],
      });
    }

    return wf;
  }

  buildDocsGeneration(roles, scanResult) {
    const builder = roles.builders[0];

    const wf = {
      name: 'docs-generation',
      version: '1.0',
      description: 'Analyze code and generate documentation',
      trigger_keywords: ['docs', 'documentation', 'generate docs'],
      steps: [
        {
          id: `${builder.name}_inventory`,
          agent: builder.name,
          skill: this._classificationMap[builder.name]?.skillName,
          prompt: 'Analyze the codebase and produce an inventory of APIs, components, and configurations.',
          output_key: `${builder.name}_inventory`,
          depends_on: [],
        },
      ],
    };

    for (const writer of roles.writers) {
      wf.steps.push({
        id: `${writer.name}_docs`,
        agent: writer.name,
        skill: this._classificationMap[writer.name]?.skillName,
        prompt: 'Generate documentation based on the code inventory.',
        output_key: `${writer.name}_docs`,
        depends_on: [`${builder.name}_inventory`],
      });
    }

    return wf;
  }

  toAgentTeamsFormat(workflows) {
    return workflows.map(wf => ({
      ...wf,
      format: 'agent-teams',
      note: 'Convert to Agent Teams configuration for Claude Code',
    }));
  }

  toExecutorJSONFormat(workflows, scanResult) {
    return workflows.map(wf => ({
      ...wf,
      format: 'executor-json',
      platform: scanResult.platform,
    }));
  }
}
