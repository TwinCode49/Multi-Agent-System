const API = "http://localhost:5071/api/metrics";
let healthChart = null;
let testsChart = null;

function $(id) { return document.getElementById(id); }

function time() {
  const d = new Date();
  $("currentTime").textContent = d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
setInterval(time, 1000); time();

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

function agentIcon(agent) {
  const color = agent.alerts?.some(a => a.severity === "red") ? "🔴" :
                agent.alerts?.length > 0 ? "🟡" : "🟢";
  return color;
}

function loadSummary() {
  fetchJSON(`${API}/summary`).then(s => {
    $("healthIcon").textContent = s.overallHealth === "green" ? "🟢" :
                                  s.overallHealth === "yellow" ? "🟡" :
                                  s.overallHealth === "red" ? "🔴" : "⚪";
    $("structuralRate").textContent = s.structuralPassRate;
    $("testRate").textContent = s.testPassRate;
    $("crossRate").textContent = s.crossPlatformSyncRate;
    $("generatedAt").textContent = s.generatedAt ? `Report: ${new Date(s.generatedAt).toLocaleString()}` : "";
    return s;
  }).then(s => {
    fetchJSON(`${API}/alerts`).then(alerts => {
      $("alertsCount").textContent = `${alerts.length} alerts`;
      $("alertsBadge").textContent = alerts.length;
    });
    fetchJSON(`${API}/agents`).then(agents => {
      $("agentsCount").textContent = `${agents.length} agents`;
    });
  }).catch(() => {});
}

function loadAgents() {
  fetchJSON(`${API}/agents`).then(agents => {
    const container = $("agentCards");
    container.innerHTML = agents.map(a => `
      <div class="card agent-card ${a.alerts?.some(x => x.severity === "red") ? "card-red" : a.alerts?.length > 0 ? "card-yellow" : "card-green"}">
        <div class="card-header">
          <span class="agent-icon">${agentIcon(a)}</span>
          <span class="agent-name">${a.name}</span>
        </div>
        <div class="card-body">
          <div class="metric-row"><span class="metric-label">Keywords</span><span class="metric-value">${a.keywordsCount}</span></div>
          <div class="metric-row"><span class="metric-label">Mode</span><span class="metric-value">${a.mode}</span></div>
          <div class="metric-row"><span class="metric-label">Sections</span><span class="metric-value">${a.sectionsCompleteness}%</span></div>
          <div class="metric-row"><span class="metric-label">Handoff</span><span class="metric-value">${a.handoffPresent ? "✓" : "✗"}</span></div>
          <div class="metric-row"><span class="metric-label">Do NOT rules</span><span class="metric-value">${a.doNotRules}</span></div>
          ${a.readOnly ? `<div class="metric-row"><span class="metric-label">Read-only</span><span class="metric-value">${a.readOnlyConsistent ? "✓" : "⚠"}</span></div>` : ""}
        </div>
        ${a.alerts?.length > 0 ? `<div class="card-alerts">${a.alerts.map(al => `<span class="alert-chip ${al.severity}">${al.msg}</span>`).join("")}</div>` : ""}
      </div>
    `).join("");

    // Health chart
    const green = agents.filter(a => !a.alerts?.length).length;
    const yellow = agents.filter(a => a.alerts?.some(x => x.severity === "yellow") && !a.alerts?.some(x => x.severity === "red")).length;
    const red = agents.filter(a => a.alerts?.some(x => x.severity === "red")).length;
    if (healthChart) healthChart.destroy();
    healthChart = new Chart($("healthChart"), {
      type: "doughnut",
      data: {
        labels: ["Healthy", "Warnings", "Issues"],
        datasets: [{
          data: [green, yellow, red],
          backgroundColor: ["#4ade80", "#fbbf24", "#f87171"],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#e1e4ed" } },
          title: { display: true, text: "Agent Health", color: "#e1e4ed" }
        }
      }
    });
  }).catch(() => {});
}

function loadSkills() {
  fetchJSON(`${API}/skills`).then(skills => {
    const tbody = $("skillsBody");
    tbody.innerHTML = skills.map(s => `<tr>
      <td>${s.name}</td>
      <td>${s.keywordsCount}</td>
      <td class="${s.crossPlatformSynced ? "status-ok" : "status-ko"}">${s.crossPlatformSynced ? "✓" : "✗"}</td>
      <td>${s.hasGoal ? "✓" : "✗"}</td>
      <td>${s.hasReferences ? "✓" : "✗"}</td>
    </tr>`).join("");
  }).catch(() => {});
}

function loadAlerts() {
  fetchJSON(`${API}/alerts`).then(alerts => {
    const list = $("alertsList");
    if (alerts.length === 0) {
      list.innerHTML = '<div class="no-alerts">No alerts</div>';
      return;
    }
    list.innerHTML = alerts.map(a => `
      <div class="alert-item ${a.severity}">
        <span class="alert-sev">${a.severity === "red" ? "🔴" : "🟡"}</span>
        <span class="alert-agent">[${a.agent}]</span>
        <span class="alert-msg">${a.msg}</span>
      </div>
    `).join("");
  }).catch(() => {});
}

function loadWorkflows() {
  fetchJSON(`${API}/workflows/runs`).then(runs => {
    const tbody = $("workflowsBody");
    if (runs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No workflow runs yet</td></tr>';
      return;
    }
    tbody.innerHTML = runs.slice(0, 20).map(r => `<tr>
      <td class="mono">${r.id}</td>
      <td>${r.workflow}</td>
      <td><span class="status status-${r.status}">${r.status}</span></td>
      <td>${r.progress}</td>
      <td>${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</td>
    </tr>`).join("");

    // Tests chart
    fetchJSON(`${API}/summary`).then(s => {
      if (testsChart) testsChart.destroy();
      testsChart = new Chart($("testsChart"), {
        type: "doughnut",
        data: {
          labels: ["Passed", "Failed"],
          datasets: [{
            data: [s.testsPassed, s.testsFailed],
            backgroundColor: ["#4ade80", "#f87171"],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: "#e1e4ed" } },
            title: { display: true, text: `Tests (${s.totalTests} total)`, color: "#e1e4ed" }
          }
        }
      });
    }).catch(() => {});
  }).catch(() => {});
}

async function loadAll() {
  await Promise.all([loadSummary(), loadAgents(), loadSkills(), loadAlerts(), loadWorkflows()]);
}

document.addEventListener("DOMContentLoaded", () => { loadAll(); setInterval(loadAll, 30000); });
