import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ALL_AGENTS = [
  'orchestrator', 'code-reviewer', 'security-reviewer', 'test-engineer',
  'doc-agent', 'database-specialist', 'ui-specialist', 'devops-agent', 'perf-engineer',
];

const ALL_SKILLS = [
  'testing', 'documentation', 'prompt-optimization', 'terminal', 'customize-opencode',
];

const FRAMEWORK_SKILLS = {
  'React/Vue/Angular': ['frontend'],
  'Next.js/Nuxt': ['frontend', 'backend'],
  'Express/Fastify/NestJS': ['backend', 'database', 'containerization'],
  'Electron': ['frontend', 'backend'],
  'Node.js (test framework detected)': ['backend', 'database'],
  'Node.js (bundler detected)': ['frontend', 'backend'],
  'ASP.NET Core': ['backend', 'database', 'containerization'],
};

const FRAMEWORK_AGENTS = {
  'React/Vue/Angular': ['ui-specialist', 'test-engineer', 'code-reviewer'],
  'Express/Fastify/NestJS': ['database-specialist', 'test-engineer', 'devops-agent', 'perf-engineer'],
  'ASP.NET Core': ['database-specialist', 'devops-agent', 'test-engineer'],
};

export class VanillaDetector {
  detect(basePath) {
    const result = {
      hasPackageJson: false,
      packageManager: null,
      hasRequirementsTxt: false,
      hasCsproj: false,
      hasSolution: false,
      hasCargoToml: false,
      hasGoMod: false,
      language: null,
      framework: null,
      recommendedPlatform: null,
      detected: false,
      nodeVersion: null,
      dependencies: [],
    };

    const pkgPath = join(basePath, 'package.json');
    if (existsSync(pkgPath)) {
      result.hasPackageJson = true;
      result.language = 'Node.js';
      result.detected = true;
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        result.packageManager = pkg.packageManager || 'npm';
        result.nodeVersion = pkg.engines?.node || null;
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps) {
          result.dependencies = Object.keys(allDeps);
          if (result.dependencies.some(d => d.match(/express|fastify|nestjs|koa/))) result.framework = 'Express/Fastify/NestJS';
          else if (result.dependencies.some(d => d.match(/next|nuxt|remix|gatsby/))) result.framework = 'Next.js/Nuxt';
          else if (result.dependencies.some(d => d.match(/react|vue|angular|svelte/))) result.framework = 'React/Vue/Angular';
          else if (result.dependencies.some(d => d.match(/electron/))) result.framework = 'Electron';
          else if (result.dependencies.some(d => d.match(/jest|vitest|mocha|cypress|playwright/))) result.framework = 'Node.js (test framework detected)';
          else if (result.dependencies.some(d => d.match(/tsup|esbuild|vite|webpack/))) result.framework = 'Node.js (bundler detected)';
        }
      } catch {
        // not readable, skip
      }
    }

    if (existsSync(join(basePath, 'requirements.txt'))) {
      result.hasRequirementsTxt = true;
      result.language = 'Python';
      result.detected = true;
    }

    if (existsSync(join(basePath, 'Cargo.toml'))) {
      result.hasCargoToml = true;
      result.language = 'Rust';
      result.detected = true;
    }

    if (existsSync(join(basePath, 'go.mod'))) {
      result.hasGoMod = true;
      result.language = 'Go';
      result.detected = true;
    }

    const csprojFiles = this._findFiles(basePath, '.csproj');
    if (csprojFiles.length > 0) {
      result.hasCsproj = true;
      result.language = 'C# (.NET)';
      result.detected = true;
      if (csprojFiles.some(f => {
        try {
          const content = readFileSync(join(basePath, f), 'utf-8');
          return content.includes('Microsoft.AspNetCore') || content.includes('Sdk="Microsoft.NET.Sdk.Web"');
        } catch { return false; }
      })) {
        result.framework = 'ASP.NET Core';
      }
    }

    if (existsSync(join(basePath, '*.sln'))) {
      result.hasSolution = true;
    }

    if (!result.detected && this._findFiles(basePath, '.py').length > 0) {
      result.language = 'Python (scripts)';
      result.detected = true;
    }

    if (!result.language) {
      result.language = 'Unknown';
    }

    result.recommendedPlatform = result.language === 'Node.js' ? 'opencode' : 'opencode';

    return result;
  }

  suggestSkills(vanillaInfo) {
    const base = [...ALL_SKILLS];
    const framework = vanillaInfo.framework;
    if (framework && FRAMEWORK_SKILLS[framework]) {
      for (const skill of FRAMEWORK_SKILLS[framework]) {
        if (!base.includes(skill)) base.push(skill);
      }
    }
    if (vanillaInfo.dependencies.some(d => d.match(/docker|compose/))) {
      if (!base.includes('containerization')) base.push('containerization');
    }
    if (vanillaInfo.dependencies.some(d => d.match(/prisma|typeorm|drizzle|knex|sequelize|mongoose|mongodb|postgres|mysql/))) {
      if (!base.includes('database')) base.push('database');
    }
    return base;
  }

  suggestAgents(vanillaInfo) {
    const base = [...ALL_AGENTS];
    const framework = vanillaInfo.framework;
    if (framework && FRAMEWORK_AGENTS[framework]) {
      for (const agent of FRAMEWORK_AGENTS[framework]) {
        if (!base.includes(agent)) base.push(agent);
      }
    }
    return base;
  }

  _findFiles(basePath, ext) {
    try {
      return readdirSync(basePath).filter(f => f.endsWith(ext)).slice(0, 5);
    } catch {
      return [];
    }
  }
}
