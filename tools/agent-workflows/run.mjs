import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFS_DIR = join(__dirname, "definitions");

console.log("Defs dir:", DEFS_DIR);

function read(path) {
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch (e) { return null; }
}

function validateWorkflow(wf) {
  const errors = [];
  if (!wf.name) errors.push("Missing workflow name");
  if (!wf.steps || !Array.isArray(wf.steps) || wf.steps.length === 0)
    errors.push("Workflow must have at least one step");

  const stepIds = new Set();
  const definedIds = new Set(wf.steps.map(s => s.id).filter(Boolean));

  for (const step of wf.steps) {
    if (!step.id) { errors.push("Step missing id"); continue; }
    if (stepIds.has(step.id)) errors.push(`Duplicate step id: ${step.id}`);
    stepIds.add(step.id);
    if (!step.agent) errors.push(`Step "${step.id}" missing agent`);
    if (!step.prompt) errors.push(`Step "${step.id}" missing prompt`);
    if (step.depends_on) {
      for (const dep of step.depends_on) {
        if (!definedIds.has(dep)) {
          errors.push(`Step "${step.id}" depends on "${dep}" which does not exist`);
        }
      }
    }
  }

  // Topological order check
  const visited = new Set();
  for (const step of wf.steps) {
    if (step.depends_on) {
      for (const dep of step.depends_on) {
        if (!visited.has(dep)) {
          errors.push(`Step "${step.id}" depends on "${dep}" but "${dep}" has not been processed yet (order issue)`);
        }
      }
    }
    visited.add(step.id);
  }

  return errors;
}

function generatePlan(wf) {
  const plan = [];
  const executed = [];
  let remaining = [...wf.steps];

  while (remaining.length > 0) {
    const ready = remaining.filter(s =>
      !s.depends_on || s.depends_on.every(d => executed.includes(d))
    );
    if (ready.length === 0) {
      plan.push({ type: "deadlock", message: "Cannot proceed — remaining steps have unmet dependencies" });
      break;
    }
    for (const step of ready) {
      plan.push({
        type: "execute",
        step_id: step.id,
        agent: step.agent,
        prompt: step.prompt,
        parallel: ready.length > 1,
        depends_on: step.depends_on || [],
      });
      executed.push(step.id);
    }
    remaining = remaining.filter(s => !executed.includes(s.id));
  }
  return plan;
}

console.log("╔══════════════════════════════════════════════╗");
console.log("║   Multi-Agent Workflow Runner                ║");
console.log("╚══════════════════════════════════════════════╝\n");

const files = readdirSync(DEFS_DIR).filter(f => f.endsWith(".json"));
let totalSteps = 0;
let passed = 0, failed = 0;

for (const file of files) {
  const wf = read(join(DEFS_DIR, file));
  if (!wf) { console.log(`  ❌ ${file}: Cannot parse`); failed++; continue; }

  console.log(`\n── ${wf.name} ──`);
  console.log(`  Description: ${wf.description}`);
  console.log(`  Version:     ${wf.version}`);
  console.log(`  Steps:       ${wf.steps.length}`);

  console.log("  → Running validation...");
  const errors = validateWorkflow(wf);
  console.log(`  → Validation done: ${errors.length} errors`);
  if (errors.length > 0) {
    console.log(`  ❌ Validation FAILED:`);
    for (const e of errors) console.log(`     • ${e}`);
    failed++;
    continue;
  }

  const plan = generatePlan(wf);
  const stages = {};
  for (const step of plan) {
    if (step.type === "execute") {
      const key = step.parallel ? "parallel" : "sequential";
      if (!stages[key]) stages[key] = 0;
      stages[key]++;
    }
  }

  console.log(`  ✅ Valid — ${wf.steps.length} steps`);
  if (stages.sequential) console.log(`     Sequential: ${stages.sequential} step(s)`);
  if (stages.parallel) console.log(`     Parallel:   ${stages.parallel} step(s)`);
  totalSteps += wf.steps.length;
  passed++;

  for (const step of plan) {
    if (step.type === "execute") {
      const deps = step.depends_on.length > 0 ? ` ← ${step.depends_on.join(", ")}` : "";
      const mode = step.parallel ? "║" : "→";
      console.log(`     ${mode} [${step.agent}] ${step.step_id}${deps}`);
    }
  }
}

console.log(`\n╔══════════════════════════════════════════════╗`);
console.log(`║   Summary                                    ║`);
console.log(`╚══════════════════════════════════════════════╝`);
console.log(`  Workflows: ${passed} valid, ${failed} failed`);
console.log(`  Total steps: ${totalSteps}\n`);

process.exit(failed > 0 ? 1 : 0);
