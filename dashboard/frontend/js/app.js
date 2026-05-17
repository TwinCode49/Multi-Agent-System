const API = "http://localhost:5000/api/dashboard";
let currentPage = 1;
let totalOrders = 0;
let revenueChart = null;
let productsChart = null;
let growthChart = null;

function $(id) { return document.getElementById(id); }

function fmt(n) { return n.toLocaleString("en-US"); }
function cur(n) { return "$" + Number(n).toLocaleString("en-US", {minimumFractionDigits: 0}); }

function time() {
  const d = new Date();
  $("currentTime").textContent = d.toLocaleString("en-US", {
    dateStyle: "medium", timeStyle: "short"
  });
}
setInterval(time, 1000); time();

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

async function loadStats() {
  const s = await fetchJSON(`${API}/summary`);
  $("stat-totalUsers").textContent = fmt(s.totalUsers);
  $("stat-activeUsers").textContent = fmt(s.activeUsers);
  $("stat-totalRevenue").textContent = cur(s.totalRevenue);
  $("stat-totalOrders").textContent = fmt(s.totalOrders);
  $("stat-conversionRate").textContent = s.conversionRate + "%";
  $("stat-avgOrderValue").textContent = cur(s.avgOrderValue);
}

async function loadRevenue() {
  const data = await fetchJSON(`${API}/revenue?days=30`);
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart($("revenueChart"), {
    type: "line",
    data: {
      labels: data.map(d => d.date.slice(5)),
      datasets: [{
        label: "Revenue",
        data: data.map(d => d.amount),
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.08)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, title: { display: true, text: "Revenue (30 days)", color: "#e1e4ed" } },
      scales: {
        x: { ticks: { color: "#8b8fa3", maxTicksLimit: 10 } },
        y: { ticks: { color: "#8b8fa3", callback: v => "$" + v / 1000 + "k" } }
      }
    }
  });
}

async function loadTopProducts() {
  const data = await fetchJSON(`${API}/top-products`);
  if (productsChart) productsChart.destroy();
  const colors = ["#60a5fa", "#4ade80", "#fbbf24", "#f87171", "#a78bfa", "#fb923c"];
  productsChart = new Chart($("productsChart"), {
    type: "bar",
    data: {
      labels: data.map(d => d.name),
      datasets: [{
        label: "Revenue",
        data: data.map(d => d.revenue),
        backgroundColor: colors.slice(0, data.length),
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false }, title: { display: true, text: "Top Products by Revenue", color: "#e1e4ed" } },
      scales: {
        x: { ticks: { color: "#8b8fa3", callback: v => "$" + v / 1000 + "k" } },
        y: { ticks: { color: "#e1e4ed" } }
      }
    }
  });
}

async function loadGrowth() {
  const data = await fetchJSON(`${API}/user-growth`);
  if (growthChart) growthChart.destroy();
  growthChart = new Chart($("growthChart"), {
    type: "bar",
    data: {
      labels: data.map(d => d.month),
      datasets: [
        {
          label: "New Users",
          data: data.map(d => d.newUsers),
          backgroundColor: "rgba(96,165,250,0.7)",
          order: 2,
        },
        {
          label: "Total Users",
          data: data.map(d => d.totalUsers),
          borderColor: "#4ade80",
          backgroundColor: "rgba(74,222,128,0.05)",
          fill: true,
          type: "line",
          tension: 0.3,
          pointRadius: 2,
          order: 1,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#e1e4ed" } },
        title: { display: true, text: "User Growth (12 months)", color: "#e1e4ed" }
      },
      scales: {
        x: { ticks: { color: "#8b8fa3" } },
        y: { ticks: { color: "#8b8fa3", callback: v => fmt(v) } }
      }
    }
  });
}

async function loadOrders(page) {
  if (page < 1) return;
  const limit = parseInt($("pageSize").value);
  currentPage = page;
  const res = await fetchJSON(`${API}/orders?page=${page}&limit=${limit}`);
  totalOrders = res.total;
  const tbody = $("ordersBody");
  tbody.innerHTML = res.data.map(o => `<tr>
    <td>${o.id}</td>
    <td>${o.customer}</td>
    <td>${o.product}</td>
    <td>${cur(o.amount)}</td>
    <td><span class="status status-${o.status}">${o.status}</span></td>
    <td>${o.date}</td>
  </tr>`).join("");
  $("pageInfo").textContent = `Page ${page} of ${Math.ceil(totalOrders / limit)} (${fmt(totalOrders)} orders)`;
  $("prevBtn").disabled = page <= 1;
  $("nextBtn").disabled = page >= Math.ceil(totalOrders / limit);
}

async function loadAll() {
  await Promise.all([loadStats(), loadRevenue(), loadTopProducts(), loadGrowth(), loadOrders(1)]);
}

document.addEventListener("DOMContentLoaded", loadAll);
