import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFS_DIR = join(__dirname, "definitions");
const RUNS_DIR = join(__dirname, "runs");

if (!existsSync(RUNS_DIR)) mkdirSync(RUNS_DIR, { recursive: true });

const VALID_STATUSES = ["submitted", "running", "completed", "failed", "cancelled"];

function readJSON(p) {
  try { return JSON.parse(readFileSync(p, "utf-8")); } catch { return null; }
}

function writeJSON(p, data) {
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function loadWorkflow(name) {
  const path = join(DEFS_DIR, `${name}.json`);
  if (!existsSync(path)) return null;
  return readJSON(path);
}

function generatePlan(wf) {
  const plan = [];
  const executed = [];
  let remaining = [...wf.steps];
  while (remaining.length > 0) {
    const ready = remaining.filter(s =>
      !s.depends_on || s.depends_on.every(d => executed.includes(d))
    );
    if (ready.length === 0) break;
    for (const step of ready) {
      plan.push({
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

function submitRun(workflowName) {
  const wf = loadWorkflow(workflowName);
  if (!wf) return { error: `Workflow "${workflowName}" not found` };

  const plan = generatePlan(wf);
  if (plan.length === 0) return { error: "Could not generate execution plan" };

  const runId = randomUUID().slice(0, 8);
  const run = {
    id: runId,
    workflow: workflowName,
    status: "submitted",
    plan,
    synthesizer: wf.synthesizer ? {
      agent: wf.synthesizer.agent,
      enabled: wf.synthesizer.enabled !== false,
      prompt: wf.synthesizer.prompt,
      input_from: wf.synthesizer.input_from || [],
      status: "pending",
      completedAt: null,
      handoff: null,
    } : null,
    currentStep: 0,
    totalSteps: plan.length,
    steps: plan.map(s => ({
      step_id: s.step_id,
      agent: s.agent,
      status: "pending",
      startedAt: null,
      completedAt: null,
      error: null,
      handoff: null,
    })),
    handoffs: [],
    submittedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    error: null,
  };

  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return { runId, status: "submitted", totalSteps: plan.length, hasSynthesis: !!run.synthesizer };
}

function listRuns(filterStatus) {
  const files = readdirSync(RUNS_DIR).filter(f => f.endsWith(".json"));
  const runs = [];
  for (const f of files) {
    const run = readJSON(join(RUNS_DIR, f));
    if (!run) continue;
    if (filterStatus && run.status !== filterStatus) continue;
    runs.push({
      id: run.id,
      workflow: run.workflow,
      status: run.status,
      progress: `${run.currentStep}/${run.totalSteps}`,
      submittedAt: run.submittedAt,
    });
  }
  return runs.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

function getRun(runId) {
  const path = join(RUNS_DIR, `${runId}.json`);
  if (!existsSync(path)) return null;
  return readJSON(path);
}

function cancelRun(runId) {
  const run = getRun(runId);
  if (!run) return { error: `Run "${runId}" not found` };
  if (!["submitted", "running"].includes(run.status)) {
    return { error: `Cannot cancel run in "${run.status}" status` };
  }
  run.status = "cancelled";
  run.completedAt = new Date().toISOString();
  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return { runId, status: "cancelled" };
}

function advanceRun(runId) {
  const run = getRun(runId);
  if (!run) return { error: `Run "${runId}" not found` };
  if (run.status !== "submitted" && run.status !== "running") {
    return { error: `Run is "${run.status}", cannot advance` };
  }

  if (run.status === "submitted") {
    run.status = "running";
    run.startedAt = new Date().toISOString();
  }

  const pending = run.steps.filter(s => s.status === "pending");
  const ready = pending.filter(s => {
    const planEntry = run.plan.find(p => p.step_id === s.step_id);
    return !planEntry || !planEntry.depends_on || planEntry.depends_on.length === 0 ||
      planEntry.depends_on.every(d => run.steps.find(rs => rs.step_id === d)?.status === "completed");
  });

  if (ready.length === 0 && pending.length > 0) {
    run.status = "failed";
    run.error = "Deadlock detected";
    run.completedAt = new Date().toISOString();
    writeJSON(join(RUNS_DIR, `${runId}.json`), run);
    return { runId, status: "failed", error: "Deadlock" };
  }

  for (const step of ready) {
    step.status = "running";
    step.startedAt = new Date().toISOString();
  }

  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return {
    runId,
    status: run.status,
    advanced: ready.map(s => ({ step_id: s.step_id, agent: s.agent })),
  };
}

function completeStep(runId, stepId) {
  const run = getRun(runId);
  if (!run) return { error: `Run "${runId}" not found` };

  const step = run.steps.find(s => s.step_id === stepId);
  if (!step) return { error: `Step "${stepId}" not found in run` };
  if (step.status !== "running") return { error: `Step "${stepId}" is "${step.status}", not running` };

  step.status = "completed";
  step.completedAt = new Date().toISOString();
  run.currentStep = run.steps.filter(s => s.status === "completed").length;

  const handoff = buildHandoffContext(run, stepId, step.agent);
  step.handoff = handoff;
  run.handoffs.push(handoff);

  const allDone = run.steps.every(s => s.status === "completed");
  if (allDone) {
    if (run.synthesizer?.enabled) {
      run.status = "synthesis_pending";
    } else {
      run.status = "completed";
      run.completedAt = new Date().toISOString();
    }
  }

  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return { runId, stepId, stepStatus: "completed", runStatus: run.status };
}

function buildHandoffContext(run, stepId, agent) {
  const deps = run.plan.find(p => p.step_id === stepId)?.depends_on || [];
  const depHandoffs = deps.map(d => {
    const h = run.handoffs.find(h => h.from_step === d);
    return h ? { from: d, output: h.context.output_summary } : null;
  }).filter(Boolean);

  return {
    from_step: stepId,
    from_agent: agent,
    status: "completed",
    context: {
      received_from: depHandoffs,
      output_summary: `Completed ${stepId} by ${agent}`,
      artifacts: [],
      risks: [],
      decisions: [],
    },
    timestamp: new Date().toISOString(),
  };
}

function getMockOutput(stepId, agent) {
  const mock = {
    api_inventory: "Found 12 endpoints, 8 interfaces, 4 types across 3 modules",
    readme: "Generated README with API reference, install guide, and examples",
    apidocs: "Generated OpenAPI 3.0 spec with all 12 endpoints documented",
    changelog: "Updated CHANGELOG with 5 entries following Keep a Changelog format",
    schema: "Created Prisma schema with 4 models, 2 enums, and 3 relations",
    api_code: "Implemented 5 REST endpoints with validation, error handling, and pagination",
    ui_code: "Built React components: DataTable, SearchBar, FilterPanel with responsive design",
    test_code: "Wrote 24 unit tests and 8 integration tests (92% coverage)",
    docs: "Generated API docs, component storybook, and deployment guide",
    code_review: "Found 3 blockers, 5 majors, 12 minors — overall: changes requested",
    security_review: "Found 1 high, 2 medium, 3 low findings — no critical vulnerabilities",
    perf_review: "Identified 2 bottlenecks: N+1 query and missing index (estimated 40% improvement)",
    synthesis: "Merged 3 review reports: 6 issues remain, 4 auto-resolved, 2 escalated to user",
  };
  return mock[stepId] || `Completed ${stepId} by ${agent}`;
}

function printHandoffChain(run) {
  console.log(`  Handoff Chain for "${run.workflow}" (${run.status})\n`);
  for (const step of run.plan) {
    const stepState = run.steps.find(s => s.step_id === step.step_id);
    const h = run.handoffs.find(h => h.from_step === step.step_id);
    const icon = stepState?.status === "completed" ? "✓" : stepState?.status === "running" ? "▶" : "○";
    const mode = step.parallel ? "║" : "→";
    const deps = step.depends_on.length > 0 ? ` ← ${step.depends_on.join(", ")}` : "";
    console.log(`  ${mode} ${icon} [${step.agent}] ${step.step_id}${deps}`);
    if (h) {
      if (h.context.output_summary) console.log(`     📋 ${h.context.output_summary}`);
      if (h.context.artifacts?.length > 0) console.log(`     📁 ${h.context.artifacts.join(", ")}`);
      if (h.context.decisions?.length > 0) {
        for (const d of h.context.decisions) console.log(`     🧠 ${d.title}`);
      }
      if (h.context.risks?.length > 0) {
        for (const r of h.context.risks) console.log(`     ⚠️  ${r.severity}: ${r.description}`);
      }
      if (h.context.received_from?.length > 0) {
        for (const rf of h.context.received_from) console.log(`     ↩ received: ${rf.output}`);
      }
    }
    console.log();
  }
  if (run.synthesizer?.handoff) {
    const h = run.synthesizer.handoff;
    console.log(`  ◆ ✓ [${h.from_agent}] synthesis`);
    console.log(`     📋 ${h.context.output_summary}`);
    if (h.context.risks?.conflicts?.length > 0) {
      for (const c of h.context.risks.conflicts) {
        console.log(`     ⚡ Conflict: ${c.description} (${c.between.join(" vs ")}) → ${c.resolved_severity}`);
      }
    }
    if (h.context.artifacts?.length > 0) console.log(`     📁 ${h.context.artifacts.join(", ")}`);
    console.log();
  }
}

function cleanRuns(maxAgeHours = 24) {
  const files = readdirSync(RUNS_DIR).filter(f => f.endsWith(".json"));
  let removed = 0;
  const now = Date.now();
  for (const f of files) {
    const run = readJSON(join(RUNS_DIR, f));
    if (!run || !run.completedAt) continue;
    const age = now - new Date(run.completedAt).getTime();
    if (age > maxAgeHours * 3600000) {
      unlinkSync(join(RUNS_DIR, f));
      removed++;
    }
  }
  return { removed };
}

function printRun(run) {
  if (!run) { console.log("  Run not found"); return; }
  console.log(`  ID:         ${run.id}`);
  console.log(`  Workflow:   ${run.workflow}`);
  console.log(`  Status:     ${run.status}`);
  console.log(`  Progress:   ${run.currentStep}/${run.totalSteps}`);
  if (run.synthesizer) {
    const syn = run.synthesizer;
    const icon = syn.status === "completed" ? "✓" : syn.status === "skipped" ? "–" : "○";
    console.log(`  Synthesis:  ${icon} [${syn.agent}] (${syn.status})`);
  }
  console.log(`  Submitted:  ${run.submittedAt}`);
  if (run.startedAt) console.log(`  Started:    ${run.startedAt}`);
  if (run.completedAt) console.log(`  Completed:  ${run.completedAt}`);
  if (run.error) console.log(`  Error:      ${run.error}`);
  console.log(`  Steps:`);
  for (const s of run.steps) {
    const icon = s.status === "completed" ? "✓" : s.status === "running" ? "▶" : s.status === "failed" ? "✗" : "○";
    console.log(`    ${icon} [${s.agent}] ${s.step_id} (${s.status})`);
  }
}

function resolveConflicts(handoffs) {
  const all = handoffs.flatMap(h => (h.context.risks || []).map(r => ({
    ...r,
    from: h.from_step
  })));

  const conflicts = [];
  const seen = new Map();

  for (const risk of all) {
    const key = risk.description.toLowerCase().slice(0, 40);
    if (seen.has(key)) {
      const prev = seen.get(key);
      if (prev.severity !== risk.severity) {
        conflicts.push({
          between: [prev.from, risk.from],
          description: risk.description,
          severities: [prev.severity, risk.severity],
          resolution: "auto",
          resolved_severity: risk.severity > prev.severity ? risk.severity : prev.severity
        });
      }
    } else {
      seen.set(key, risk);
    }
  }

  return {
    all,
    unique: [...seen.values()],
    conflicts,
    summary: `Found ${seen.size} unique risks, ${conflicts.length} conflicts auto-resolved`
  };
}

function getSynthesisOutput(run, inputHandoffs) {
  const summaries = inputHandoffs.map(h =>
    `[${h.from_agent}] ${h.from_step}: ${h.context.output_summary}`
  ).join("; ");
  return `Synthesized ${inputHandoffs.length} inputs: ${summaries}`;
}

function synthesizeRun(runId) {
  const run = getRun(runId);
  if (!run) return { error: `Run "${runId}" not found` };
  if (run.status !== "synthesis_pending") {
    return { error: `Run is "${run.status}", not synthesis_pending` };
  }

  const inputSteps = run.synthesizer.input_from?.length > 0
    ? run.synthesizer.input_from
    : run.steps.map(s => s.step_id);

  const inputHandoffs = inputSteps
    .map(id => run.handoffs.find(h => h.from_step === id))
    .filter(Boolean);

  const synthesisHandoff = {
    from_step: "__synthesis__",
    from_agent: run.synthesizer.agent,
    status: "completed",
    context: {
      received_from: inputHandoffs.map(h => ({
        from: h.from_step,
        output: h.context.output_summary,
        risks: h.context.risks || [],
        decisions: h.context.decisions || [],
        artifacts: h.context.artifacts || [],
      })),
      output_summary: getSynthesisOutput(run, inputHandoffs),
      artifacts: inputHandoffs.flatMap(h => h.context.artifacts || []),
      risks: resolveConflicts(inputHandoffs),
      decisions: inputHandoffs.flatMap(h => h.context.decisions || []),
    },
    timestamp: new Date().toISOString(),
  };

  run.synthesizer.status = "completed";
  run.synthesizer.handoff = synthesisHandoff;
  run.synthesizer.completedAt = new Date().toISOString();
  run.handoffs.push(synthesisHandoff);
  run.status = "completed";
  run.completedAt = new Date().toISOString();

  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return { runId, status: "completed" };
}

function skipSynthesis(runId) {
  const run = getRun(runId);
  if (!run) return { error: `Run "${runId}" not found` };
  if (run.status !== "synthesis_pending") {
    return { error: `Run is "${run.status}", not synthesis_pending` };
  }
  run.synthesizer.status = "skipped";
  run.synthesizer.completedAt = new Date().toISOString();
  run.status = "completed";
  run.completedAt = new Date().toISOString();
  writeJSON(join(RUNS_DIR, `${runId}.json`), run);
  return { runId, status: "completed", synthesis: "skipped" };
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   Workflow Background Executor               ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  switch (cmd) {
    case "--submit": {
      const name = args[1];
      if (!name) { console.log("  Usage: --submit <workflow-name>"); break; }
      const result = submitRun(name);
      if (result.error) { console.log(`  ❌ ${result.error}`); break; }
      console.log(`  ✅ Submitted — run ID: ${result.runId}`);
      console.log(`     Status: ${result.status}`);
      console.log(`     Steps:  ${result.totalSteps}`);
      if (result.hasSynthesis) console.log(`     🧠 Synthesis: enabled (${name} has orchestrator synthesis)`);
      console.log(`\n  Track: node tools/agent-workflows/executor.mjs --status ${result.runId}`);
      console.log(`  Simulate: node tools/agent-workflows/executor.mjs --simulate ${result.runId}`);
      break;
    }
    case "--status": {
      const runId = args[1];
      if (!runId) { console.log("  Usage: --status <run-id>"); break; }
      const run = getRun(runId);
      if (!run) { console.log(`  ❌ Run "${runId}" not found`); break; }
      printRun(run);
      break;
    }
    case "--list": {
      const filter = args[1] && VALID_STATUSES.includes(args[1]) ? args[1] : null;
      const runs = listRuns(filter);
      if (runs.length === 0) { console.log("  No runs found"); break; }
      console.log(`  ${filter ? `Runs (${filter}):` : "All runs:"}`);
      for (const r of runs) {
        console.log(`  [${r.status}] ${r.id} — ${r.workflow} (${r.progress}) @ ${r.submittedAt}`);
      }
      break;
    }
    case "--cancel": {
      const runId = args[1];
      if (!runId) { console.log("  Usage: --cancel <run-id>"); break; }
      const result = cancelRun(runId);
      if (result.error) { console.log(`  ❌ ${result.error}`); break; }
      console.log(`  🛑 Cancelled — ${result.runId}`);
      break;
    }
    case "--simulate": {
      const runId = args[1];
      if (!runId) { console.log("  Usage: --simulate <run-id>"); break; }
      const run = getRun(runId);
      if (!run) { console.log(`  ❌ Run "${runId}" not found`); break; }
      console.log("  Simulating execution (auto-advance)...\n");
      for (let i = 0; i < run.plan.length; i++) {
        const step = run.plan[i];
        const depsMet = !step.depends_on || step.depends_on.length === 0 ||
          step.depends_on.every(d => run.steps.find(s => s.step_id === d)?.status === "completed");
        if (!depsMet) continue;
        const stepState = run.steps.find(s => s.step_id === step.step_id);
        if (!stepState || stepState.status !== "pending") continue;
        stepState.status = "running";
        stepState.startedAt = new Date().toISOString();
        const mode = step.parallel ? "║" : "→";
        console.log(`  ${mode} [${step.agent}] ${step.step_id}`);
        const handoff = buildHandoffContext(run, step.step_id, step.agent);
        handoff.context.output_summary = getMockOutput(step.step_id, step.agent);
        stepState.handoff = handoff;
        run.handoffs.push(handoff);
        stepState.status = "completed";
        stepState.completedAt = new Date().toISOString();
        run.currentStep = run.steps.filter(s => s.status === "completed").length;
        console.log(`     ✓ ${handoff.context.output_summary}`);
      }
      const allDone = run.steps.every(s => s.status === "completed");
      if (allDone) {
        if (run.synthesizer?.enabled) {
          run.status = "synthesis_pending";
          writeJSON(join(RUNS_DIR, `${runId}.json`), run);
          const synthResult = synthesizeRun(runId);
          if (synthResult.error) { console.log(`\n  ❌ Synthesis failed: ${synthResult.error}`); break; }
          console.log(`\n  🧠 [orchestrator] synthesis`);
          const h = run.synthesizer.handoff;
          if (h) {
            console.log(`     ✓ ${h.context.output_summary}`);
            if (h.context.risks?.conflicts?.length > 0) {
              for (const c of h.context.risks.conflicts) {
                console.log(`     ⚡ Conflict resolved: ${c.description} → ${c.resolved_severity}`);
              }
            }
          }
          console.log("\n  ✅ Workflow completed with orchestrator synthesis");
        } else {
          run.status = "completed";
          run.completedAt = new Date().toISOString();
          run.currentStep = run.totalSteps;
          console.log("\n  ✅ Workflow completed");
        }
      }
      writeJSON(join(RUNS_DIR, `${runId}.json`), run);
      break;
    }
    case "--advance": {
      const runId = args[1];
      if (!runId) { console.log("  Usage: --advance <run-id>"); break; }
      const result = advanceRun(runId);
      if (result.error) { console.log(`  ❌ ${result.error}`); break; }
      if (result.advanced) {
        for (const s of result.advanced) {
          console.log(`  ▶ Started [${s.agent}] ${s.step_id}`);
        }
      }
      console.log(`  Status: ${result.status}`);
      break;
    }
    case "--complete-step": {
      const runId = args[1];
      const stepId = args[2];
      if (!runId || !stepId) { console.log("  Usage: --complete-step <run-id> <step-id>"); break; }
      const result = completeStep(runId, stepId);
      if (result.error) { console.log(`  ❌ ${result.error}`); break; }
      console.log(`  ✓ ${result.stepId} completed — run: ${result.runStatus}`);
      if (result.runStatus === "synthesis_pending") {
        console.log(`  🧠 All steps done — synthesis pending. Run --synthesize or --skip-synthesis`);
      }
      break;
    }
    case "--synthesize": {
      const runIdSyn = args[1];
      if (!runIdSyn) { console.log("  Usage: --synthesize <run-id>"); break; }
      const synResult = synthesizeRun(runIdSyn);
      if (synResult.error) { console.log(`  ❌ ${synResult.error}`); break; }
      console.log(`  🧠 Synthesis completed — run: ${synResult.status}`);
      break;
    }
    case "--skip-synthesis": {
      const runIdSkip = args[1];
      if (!runIdSkip) { console.log("  Usage: --skip-synthesis <run-id>"); break; }
      const skipResult = skipSynthesis(runIdSkip);
      if (skipResult.error) { console.log(`  ❌ ${skipResult.error}`); break; }
      console.log(`  – Synthesis skipped — run: ${skipResult.status}`);
      break;
    }
    case "--handoff": {
      const runId = args[1];
      if (!runId) { console.log("  Usage: --handoff <run-id>"); break; }
      const run = getRun(runId);
      if (!run) { console.log(`  ❌ Run "${runId}" not found`); break; }
      if (run.handoffs.length === 0) { console.log("  No handoff data — run may not be completed yet"); break; }
      printHandoffChain(run);
      break;
    }
    case "--clean": {
      const maxAge = args[1] ? parseInt(args[1]) : 24;
      const result = cleanRuns(maxAge);
      console.log(`  Cleaned ${result.removed} old run(s) (>${maxAge}h)`);
      break;
    }
    default:
      console.log("  Usage:");
      console.log("    --submit <workflow>          Submit a workflow for background execution");
      console.log("    --status <run-id>            Check run status");
      console.log("    --list [status]              List all runs (optionally filter by status)");
      console.log("    --cancel <run-id>            Cancel a run");
      console.log("    --simulate <run-id>          Simulate full execution of a run");
      console.log("    --handoff <run-id>           Show handoff chain for a completed run");
      console.log("    --advance <run-id>           Advance one step (submitted→running)");
      console.log("    --complete-step <id> <step>  Mark step as complete");
      console.log("    --synthesize <run-id>        Run orchestrator synthesis on completed steps");
      console.log("    --skip-synthesis <run-id>    Skip synthesis and complete the run");
      console.log("    --clean [hours]              Clean completed runs older than N hours");
      break;
  }
}

main();
