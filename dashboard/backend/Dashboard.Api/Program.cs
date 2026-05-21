using Microsoft.Extensions.FileProviders;
using Dashboard.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<DashboardService>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseCors();

var frontendPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "frontend"));

app.UseFileServer(new FileServerOptions
{
    FileProvider = new PhysicalFileProvider(frontendPath),
    EnableDefaultFiles = true,
});

var svc = app.Services.GetRequiredService<DashboardService>();

app.MapGet("/api/metrics/summary", () => svc.GetSummary());
app.MapGet("/api/metrics/agents", () => svc.GetAgents());
app.MapGet("/api/metrics/skills", () => svc.GetSkills());
app.MapGet("/api/metrics/alerts", () => svc.GetAlerts());
app.MapGet("/api/metrics/workflows/runs", () => svc.GetWorkflowRuns());
app.MapGet("/api/metrics/workflows/definitions", () => svc.GetWorkflowDefinitions());

app.Run();
