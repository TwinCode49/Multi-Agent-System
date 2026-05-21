/**
 * @typedef {Object} NativeCapabilities
 * @property {boolean} subagents
 * @property {boolean} agentTeams
 * @property {boolean} parallelExecution
 * @property {boolean} hooks
 * @property {boolean} mcp
 * @property {boolean} customTools
 */

/**
 * @typedef {Object} AgentDef
 * @property {string} name
 * @property {string} role
 * @property {string[]} keywords
 * @property {'primary'|'subagent'} mode
 * @property {string} filePath
 * @property {{ edit: 'allow'|'deny', bash: 'allow'|'deny' }} permissions
 * @property {string[]} sections
 * @property {boolean} hasHandoff
 * @property {string[]} skills
 */

/**
 * @typedef {Object} SkillDef
 * @property {string} name
 * @property {string[]} keywords
 * @property {string} filePath
 * @property {string[]} references
 * @property {boolean} crossPlatformSynced
 * @property {string[]} agents
 * @property {string} [role]
 */

/**
 * @typedef {Object} WorkflowDef
 * @property {string} name
 * @property {number} steps
 * @property {string[]} agents
 * @property {string} filePath
 */

/**
 * @typedef {Object} PlatformScanResult
 * @property {string} platform
 * @property {string} platformVersion
 * @property {boolean} detected
 * @property {NativeCapabilities} nativeCapabilities
 * @property {AgentDef[]} agents
 * @property {SkillDef[]} skills
 * @property {WorkflowDef[]} workflows
 * @property {string[]} existingTools
 * @property {string[]} configPaths
 * @property {Object} platformMeta
 */

export class PlatformScanner {
  static platformName = 'unknown';

  detect(basePath) {
    throw new Error(`detect() must be implemented by ${this.constructor.name}`);
  }

  scan(basePath) {
    throw new Error(`scan() must be implemented by ${this.constructor.name}`);
  }
}
