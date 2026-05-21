export const ROLE_PROFILES = {
  reviewer: {
    keywords: ['review', 'security', 'quality', 'audit', 'vulnerability',
               'code', 'lint', 'style', 'performance', 'threat', 'owasp',
               'cve', 'best-practices', 'compliance', 'standards'],
  },
  writer: {
    keywords: ['doc', 'readme', 'changelog', 'apidoc', 'migration',
               'tutorial', 'write', 'documentation', 'swagger', 'openapi',
               'jsdoc', 'user-guide', 'comment', 'adr', 'diagram'],
  },
  tester: {
    keywords: ['test', 'spec', 'coverage', 'unittest', 'jest', 'pytest',
               'assert', 'tdd', 'bdd', 'integration', 'e2e', 'mock',
               'stub', 'fixture', 'snapshot', 'vitest', 'playwright'],
  },
  builder: {
    keywords: ['database', 'api', 'rest', 'graphql', 'backend', 'server',
               'frontend', 'ui', 'component', 'docker', 'deploy', 'devops',
               'schema', 'migration', 'container', 'kubernetes', 'infra',
               'middleware', 'endpoint', 'service', 'repository'],
  },
};

export function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionSize++;
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

export function classifyBySkill(skill, roleProfiles = ROLE_PROFILES) {
  if (skill.role) {
    const matched = Object.keys(roleProfiles).find(
      k => k === skill.role || k === skill.role.toLowerCase()
    );
    if (matched) {
      return { role: matched, confidence: 1.0, method: 'explicit', classified: true };
    }
  }

  const skillKeywords = new Set((skill.keywords || []).map(k => k.toLowerCase().trim()).filter(Boolean));

  if (skillKeywords.size === 0) {
    return { role: 'builder', confidence: 0, method: 'fallback', classified: false };
  }

  let bestRole = 'builder';
  let bestScore = 0;

  for (const [roleName, profile] of Object.entries(roleProfiles)) {
    const profileKeywords = new Set(profile.keywords.map(k => k.toLowerCase()));
    const score = jaccardSimilarity(skillKeywords, profileKeywords);
    if (score > bestScore) {
      bestScore = score;
      bestRole = roleName;
    }
  }

  if (bestScore >= 0.05) {
    return { role: bestRole, confidence: bestScore, method: 'jaccard', classified: true };
  }

  return { role: 'builder', confidence: bestScore, method: 'jaccard', classified: false };
}
