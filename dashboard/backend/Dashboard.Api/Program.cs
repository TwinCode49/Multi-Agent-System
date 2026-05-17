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

app.MapGet("/api/dashboard/summary", () => svc.GetSummary());
app.MapGet("/api/dashboard/revenue", (int? days) => svc.GetRevenue(days ?? 30));
app.MapGet("/api/dashboard/orders", (int? page, int? limit) => svc.GetOrders(page ?? 1, limit ?? 10));
app.MapGet("/api/dashboard/top-products", () => svc.GetTopProducts());
app.MapGet("/api/dashboard/user-growth", () => svc.GetUserGrowth());

app.Run();
