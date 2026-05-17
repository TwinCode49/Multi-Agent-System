# Dashboard de Métricas de Agentes (Nexus Dashboard)

## Descripción

El Nexus Dashboard es un panel web que visualiza en tiempo real las métricas generadas por las tools del ecosistema multi-agente. Reemplaza el dashboard demo original (datos fake con `Random`) por datos reales provenientes de `agent-metrics`, `agent-testing` y `agent-workflows`.

## Arquitectura

```
dashboard/
├── backend/
│   └── Dashboard.Api/               ← ASP.NET Core Web API
│       ├── Program.cs               ← Endpoints HTTP
│       ├── Models/Models.cs         ← Records de datos
│       ├── Services/DashboardService.cs ← Lector de archivos reales
│       └── appsettings.json
└── frontend/
    ├── index.html                   ← Dashboard UI
    ├── js/app.js                    ← Fetch + Chart.js
    └── css/styles.css               ← Estilos dark
```

## Fuentes de Datos

| Endpoint | Fuente | Descripción |
|---|---|---|
| `GET /api/metrics/summary` | `tools/agent-metrics/reports/latest.json` | Health general, pass rates |
| `GET /api/metrics/agents` | `tools/agent-metrics/reports/latest.json` → agents[] | Métricas por agente |
| `GET /api/metrics/skills` | `tools/agent-metrics/reports/latest.json` → skills[] | Métricas por skill |
| `GET /api/metrics/alerts` | `tools/agent-metrics/reports/latest.json` → alerts[] | Alertas activas |
| `GET /api/metrics/workflows/runs` | `tools/agent-workflows/runs/*.json` | Workflow runs recientes |
| `GET /api/metrics/workflows/definitions` | `tools/agent-workflows/definitions/*.json` | Definiciones disponibles |

## Uso

```bash
# 1. Generar reporte de métricas (desde la raíz del proyecto)
node tools/agent-metrics/report.mjs --save

# 2. Iniciar el dashboard
cd dashboard/backend/Dashboard.Api
dotnet run

# 3. Abrir http://localhost:5071
```

El dashboard refresca automáticamente cada 30 segundos.

## Fallback

Si los archivos de métricas no existen, la API devuelve datos vacíos (`[]`) o `overallHealth: "no-data"` en lugar de lanzar error. El frontend muestra "no data" o tablas vacías.
