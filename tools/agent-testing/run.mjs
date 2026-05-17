import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, relative, basename } from "path";

const ROOT = join(import.meta.dirname, "..", "..");
const AGENTS_DIR = join(ROOT, ".opencode", "agents");
const SKILLS_DIR = join(ROOT, ".opencode", "skills");
const GITHUB_SKILLS_DIR = join(ROOT, ".github", "skills");

let passed = 0, failed = 0, skipped = 0;
const results = [];

function ok(agent, test, msg) { passed++; results.push({ agent, test, status: "PASS", msg }); }
function fail(agent, test, msg) { failed++; results.push({ agent, test, status: "FAIL", msg }); }
function skip(agent, test, msg) { skipped++; results.push({ agent, test, status: "SKIP", msg }); }

function read(path) {
  try { return readFileSync(path, "utf-8"); } catch { return null; }
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n(?:---|\.\.\.)\n/);
  if (!m) return null;
  const raw = m[1];
  const fields = {};
  let currentKey = null;
  let currentVal = [];
  let isFolded = false;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (/^[\w-]+\s*:/.test(line) && !line.startsWith(" ")) {
      if (currentKey) {
        let val = currentVal.join(" ").trim();
        if (isFolded) val = val.replace(/\n\s*/g, " ");
        fields[currentKey] = val;
      }
      const idx = line.indexOf(":");
      currentKey = line.slice(0, idx).trim();
      const rest = line.slice(idx + 1).trim();
      isFolded = rest === ">";
      currentVal = isFolded ? [] : rest ? [rest] : [];
    } else if (currentKey && (line.startsWith("  ") || line.startsWith("\t"))) {
      currentVal.push(trimmed);
    }
  }
  if (currentKey) {
    let val = currentVal.join(" ").trim();
    if (isFolded) val = val.replace(/\n\s*/g, " ");
    fields[currentKey] = val;
  }
  return fields;
}

function checkFrontmatterFields(file, fm, required, displayName) {
  const name = displayName || basename(file, ".md");
  for (const [field, rules] of Object.entries(required)) {
    if (!fm || fm[field] === undefined) {
      fail(name, `frontmatter.${field}`, `Missing required field: ${field}`);
      continue;
    }
    if (rules.startsWithMatch && !fm[field].startsWith(rules.startsWithMatch)) {
      fail(name, `frontmatter.${field}`, `Should start with "${rules.startsWithMatch}", got "${fm[field].slice(0, 50)}..."`);
      continue;
    }
    if (rules.includes && !fm[field].toLowerCase().includes(rules.includes.toLowerCase())) {
      fail(name, `frontmatter.${field}`, `Should include "${rules.includes}"`);
      continue;
    }
    ok(name, `frontmatter.${field}`, `${field} is valid`);
  }
}

function checkSections(file, content, required) {
  const name = basename(file, ".md");
  for (const [section, pattern] of Object.entries(required)) {
    const re = new RegExp(pattern, "m");
    if (re.test(content)) {
      ok(name, `section.${section}`, `Section "${section}" found`);
    } else {
      // Try as plain string
      if (content.includes(pattern)) {
        ok(name, `section.${section}`, `Section "${section}" found`);
      } else {
        fail(name, `section.${section}`, `Section "${section}" not found`);
      }
    }
  }
}

function checkKeywords(file, fm) {
  const name = basename(file, ".md");
  if (!fm || !fm.description) { skip(name, "keywords", "No description to check"); return; }
  if (!fm.description.startsWith("TRIGGER KEYWORDS:")) {
    fail(name, "keywords", "description must start with TRIGGER KEYWORDS:");
    return;
  }
  const kwSection = fm.description.split("TRIGGER KEYWORDS:")[1]?.split(".")?.[0] || fm.description.split("TRIGGER KEYWORDS:")[1] || "";
  const keywords = kwSection.split(",").map(k => k.trim()).filter(Boolean);
  if (keywords.length < 5) {
    fail(name, "keywords", `Only ${keywords.length} keywords, expected at least 5`);
  } else {
    ok(name, "keywords", `${keywords.length} keywords found`);
  }
  return keywords;
}

function testAgent(filepath) {
  const name = basename(filepath, ".md");
  const content = read(filepath);
  if (!content) { fail(name, "file", "Cannot read file"); return; }
  if (!content.startsWith("---")) { fail(name, "file", "Must start with YAML frontmatter"); return; }

  const fm = parseFrontmatter(content);
  if (!fm) { fail(name, "frontmatter", "Cannot parse frontmatter"); return; }
  ok(name, "frontmatter.parse", "Frontmatter parsed");

  const isOrchestrator = name === "orchestrator";
  checkFrontmatterFields(filepath, fm, {
    description: { startsWithMatch: "TRIGGER KEYWORDS:" },
    mode: { includes: isOrchestrator ? "primary" : "subagent" },
    permission: { includes: "edit" },
  });

  const isReadOnly = content.includes("edit: deny");
  if (isReadOnly) {
    checkFrontmatterFields(filepath, fm, { model: { includes: "claude" } });
  }

  checkKeywords(filepath, fm);

  let sections;
  if (isOrchestrator) {
    sections = {
      "Workflow": "## Workflow",
      "Dispatch Rules": "## Dispatch Rules",
      "Prohibited": "## Prohibited",
    };
  } else {
    sections = {
      "Core Responsibilities": "## Core Responsibilities",
      "Constraints": "## Constraints",
      "Handoff Protocol": "## Handoff Protocol",
    };
    if (!isReadOnly) sections["Behavior Rules"] = "## Behavior Rules";
  }
  checkSections(filepath, content, sections);
}

function testSkill(filepath) {
  const name = basename(join(filepath, ".."));
  const content = read(filepath);
  if (!content) { fail(name, "file", "Cannot read file"); return; }
  if (!content.startsWith("---")) { fail(name, "file", "Must start with YAML frontmatter"); return; }

  const fm = parseFrontmatter(content);
  if (!fm) { fail(name, "frontmatter", "Cannot parse frontmatter"); return; }
  ok(name, "frontmatter.parse", "Frontmatter parsed");

  checkFrontmatterFields(filepath, fm, {
    description: { startsWithMatch: "TRIGGER KEYWORDS:" },
    name: { includes: name },
  }, name);

  checkKeywords(filepath, fm);

  checkSections(filepath, content, {
    Goal: "## Goal",
    Constraints: "## Constraints",
  });

  // Check references directory exists
  const skillDir = join(filepath, "..");
  const refsDir = join(skillDir, "references");
  if (existsSync(refsDir) && readdirSync(refsDir).some(f => f.endsWith(".md"))) {
    ok(name, "references.dir", "references/ directory has .md files");
  } else {
    fail(name, "references.dir", "references/ directory missing or empty");
  }
}

function testCrossPlatformSync() {
  const opencodeSkills = readdirSync(SKILLS_DIR).filter(f => f !== "_template");
  for (const skill of opencodeSkills) {
    const opencodeRefs = join(SKILLS_DIR, skill, "references");
    const githubRefs = join(GITHUB_SKILLS_DIR, skill, "references");
    if (!existsSync(githubRefs)) {
      skip(skill, "cross-platform", `.github/skills/${skill} not found`);
      continue;
    }
    const opencodeFiles = readdirSync(opencodeRefs).filter(f => f.endsWith(".md"));
    const githubFiles = readdirSync(githubRefs).filter(f => f.endsWith(".md"));
    const missingInGithub = opencodeFiles.filter(f => !githubFiles.includes(f));
    const extraInGithub = githubFiles.filter(f => !opencodeFiles.includes(f));
    if (missingInGithub.length === 0 && extraInGithub.length === 0) {
      ok(skill, "cross-platform", `references/ synced between .opencode and .github`);
    } else {
      const issues = [];
      if (missingInGithub.length) issues.push(`missing in .github: ${missingInGithub.join(", ")}`);
      if (extraInGithub.length) issues.push(`extra in .github: ${extraInGithub.join(", ")}`);
      fail(skill, "cross-platform", issues.join("; "));
    }
  }
}

console.log("╔══════════════════════════════════════════════╗");
console.log("║   Agent & Skill Testing Framework            ║");
console.log("╚══════════════════════════════════════════════╝\n");

// Agents
console.log("── Agents ──");
const agentFiles = readdirSync(AGENTS_DIR).filter(f => f.endsWith(".md"));
for (const file of agentFiles) {
  testAgent(join(AGENTS_DIR, file));
}

// Skills
console.log("\n── Skills ──");
const skillFiles = readdirSync(SKILLS_DIR)
  .filter(f => statSync(join(SKILLS_DIR, f)).isDirectory() && f !== "_template")
  .flatMap(d => {
    const skPath = join(SKILLS_DIR, d, "SKILL.md");
    return existsSync(skPath) ? [skPath] : [];
  });
for (const file of skillFiles) {
  testSkill(file);
}

// Cross-platform sync
console.log("\n── Cross-Platform Sync ──");
testCrossPlatformSync();

// Summary
console.log("\n╔══════════════════════════════════════════════╗");
console.log("║   Summary                                    ║");
console.log("╚══════════════════════════════════════════════╝");
console.log(`  PASS:  ${passed}`);
console.log(`  FAIL:  ${failed}`);
console.log(`  SKIP:  ${skipped}`);
console.log(`  TOTAL: ${passed + failed + skipped}\n`);

if (failed > 0) {
  console.log("── Failed Tests ──");
  for (const r of results.filter(r => r.status === "FAIL")) {
    console.log(`  [${r.agent}] ${r.test}: ${r.msg}`);
  }
  console.log("");
}

export { results, passed, failed, skipped };
