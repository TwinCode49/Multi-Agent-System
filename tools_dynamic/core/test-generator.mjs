export class TestGenerator {
  generate(agents) {
    return agents.map(agent => ({
      name: agent.name,
      keywords: agent.keywords,
      expectedKeywords: Math.max(10, agent.keywords.length),
      sectionsRequired: [
        'Core Responsibilities',
        'Behavior Rules',
        'Response Format',
        'Constraints',
        'Handoff Protocol',
      ].filter(s => agent.sections.includes(s)),
      modeExpected: agent.mode,
      permissionsExpected: agent.permissions,
      skills: agent.skills || [],
    }));
  }

  generateTestCaseFile(agent, format = 'json') {
    const sections = [
      'Core Responsibilities',
      'Behavior Rules',
      'Response Format',
      'Constraints',
      'Handoff Protocol',
    ];

    const testCase = {
      name: agent.name,
      keywords: agent.keywords,
      expectedKeywords: Math.max(10, agent.keywords.length),
      sectionsRequired: sections,
      modeExpected: agent.mode || 'subagent',
      permissionsExpected: agent.permissions || { edit: 'allow', bash: 'allow' },
      hasHandoffExpected: true,
      skills: agent.skills || [],
    };

    if (format === 'json') {
      return JSON.stringify(testCase, null, 2);
    }

    return testCase;
  }
}
