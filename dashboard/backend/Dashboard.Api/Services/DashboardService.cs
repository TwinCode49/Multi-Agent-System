using System.Text.Json;
using System.Text.Json.Nodes;
using Dashboard.Api.Models;

namespace Dashboard.Api.Services;

public class DashboardService
{
    private readonly string _toolsRoot;

    public DashboardService(IWebHostEnvironment env)
    {
        _toolsRoot = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", ".."));
    }

    private string? ReadFile(params string[] segments)
    {
        var path = Path.Combine(_toolsRoot, Path.Combine(segments));
        try { return File.Exists(path) ? File.ReadAllText(path) : null; }
        catch { return null; }
    }

    private JsonNode? ParseJson(string? raw)
    {
        if (raw is null) return null;
        try { return JsonNode.Parse(raw); }
        catch { return null; }
    }

    public SummaryStats GetSummary()
    {
        var raw = ReadFile("tools", "agent-metrics", "reports", "latest.json");
        var root = ParseJson(raw);
        if (root is null)
            return new SummaryStats("no-data", 0, 0, 0, 0, 0, 0, 0, DateTime.UtcNow.ToString("o"));

        var summary = root["summary"];
        var system = root["system"];
        var structuralRaw = summary?["structural_pass_rate"]?.GetValue<double>() ?? 0;
        var testRaw = summary?["test_pass_rate"]?.GetValue<double>() ?? 0;
        var crossRaw = summary?["cross_platform_sync_rate"]?.GetValue<double>() ?? 0;
        return new SummaryStats(
            OverallHealth: summary?["overall_health"]?.GetValue<string>() ?? "unknown",
            AgentsEvaluated: summary?["agents_evaluated"]?.GetValue<int>() ?? 0,
            StructuralPassRate: (int)(structuralRaw * 100),
            TestPassRate: (int)(testRaw * 100),
            CrossPlatformSyncRate: (int)(crossRaw * 100),
            TotalTests: system?["total_tests"]?.GetValue<int>() ?? 0,
            TestsPassed: system?["tests_passed"]?.GetValue<int>() ?? 0,
            TestsFailed: system?["tests_failed"]?.GetValue<int>() ?? 0,
            GeneratedAt: root["timestamp"]?.GetValue<string>() ?? ""
        );
    }

    public List<AgentMetric> GetAgents()
    {
        var raw = ReadFile("tools", "agent-metrics", "reports", "latest.json");
        var root = ParseJson(raw);
        if (root is null) return [];

        var agents = root["agents"]?.AsObject();
        if (agents is null) return [];

        return agents.Select(kvp =>
        {
            var a = kvp.Value;
            var alerts = a?["alerts"]?.AsArray()
                ?.Select(x => new AlertItem(
                    x?["severity"]?.GetValue<string>() ?? "info",
                    x?["agent"]?.GetValue<string>() ?? kvp.Key,
                    x?["msg"]?.GetValue<string>() ?? ""
                )).ToList() ?? [];
            return new AgentMetric(
                Name: kvp.Key,
                KeywordsCount: a?["keywords_count"]?.GetValue<int>() ?? 0,
                Mode: a?["mode"]?.GetValue<string>() ?? "unknown",
                SectionsCompleteness: a?["sections_completeness"]?.GetValue<int>() ?? 0,
                DoNotRules: a?["do_not_rules"]?.GetValue<int>() ?? 0,
                FrontmatterValid: a?["frontmatter_valid"]?.GetValue<bool>() ?? false,
                HasModel: a?["has_model"]?.GetValue<bool>() ?? false,
                ReadOnly: a?["read_only"]?.GetValue<bool>() ?? false,
                ReadOnlyConsistent: a?["read_only_consistent"]?.GetValue<bool>() ?? false,
                HandoffPresent: a?["handoff_present"]?.GetValue<bool>() ?? false,
                Alerts: alerts
            );
        }).ToList();
    }

    public List<SkillMetric> GetSkills()
    {
        var raw = ReadFile("tools", "agent-metrics", "reports", "latest.json");
        var root = ParseJson(raw);
        if (root is null) return [];

        var skills = root["skills"]?.AsObject();
        if (skills is null) return [];

        return skills.Select(kvp =>
        {
            var s = kvp.Value;
            return new SkillMetric(
                Name: kvp.Key,
                KeywordsCount: s?["keywords_count"]?.GetValue<int>() ?? 0,
                HasGoal: s?["has_goal"]?.GetValue<bool>() ?? false,
                HasConstraints: s?["has_constraints"]?.GetValue<bool>() ?? false,
                HasReferences: s?["has_references"]?.GetValue<bool>() ?? false,
                FrontmatterValid: s?["frontmatter_valid"]?.GetValue<bool>() ?? false,
                CrossPlatformSynced: s?["cross_platform_synced"]?.GetValue<bool>() ?? false
            );
        }).ToList();
    }

    public List<AlertItem> GetAlerts()
    {
        var raw = ReadFile("tools", "agent-metrics", "reports", "latest.json");
        var root = ParseJson(raw);
        if (root is null) return [];

        var alerts = root["alerts"]?.AsArray();
        if (alerts is null) return [];

        return alerts.Select(x => new AlertItem(
            Severity: x?["severity"]?.GetValue<string>() ?? "info",
            Agent: x?["agent"]?.GetValue<string>() ?? "system",
            Msg: x?["msg"]?.GetValue<string>() ?? ""
        )).ToList();
    }

    public List<WorkflowRun> GetWorkflowRuns()
    {
        var runsDir = Path.Combine(_toolsRoot, "tools", "agent-workflows", "runs");
        if (!Directory.Exists(runsDir)) return [];

        return Directory.GetFiles(runsDir, "*.json")
            .Select(f =>
            {
                try
                {
                    var json = File.ReadAllText(f);
                    var node = JsonNode.Parse(json);
                    if (node is null) return null;
                    return new WorkflowRun(
                        Id: node["id"]?.GetValue<string>() ?? "",
                        Workflow: node["workflow"]?.GetValue<string>() ?? "",
                        Status: node["status"]?.GetValue<string>() ?? "",
                        Progress: $"{node["currentStep"]?.GetValue<int>() ?? 0}/{node["totalSteps"]?.GetValue<int>() ?? 0}",
                        SubmittedAt: node["submittedAt"]?.GetValue<string>() ?? "",
                        StartedAt: node["startedAt"]?.GetValue<string>() ?? "",
                        CompletedAt: node["completedAt"]?.GetValue<string>() ?? "",
                        Error: node["error"]?.GetValue<string>() ?? ""
                    );
                }
                catch { return null; }
            })
            .Where(r => r is not null)
            .Cast<WorkflowRun>()
            .OrderByDescending(r => r.SubmittedAt)
            .ToList();
    }

    public List<WorkflowDefinition> GetWorkflowDefinitions()
    {
        var defsDir = Path.Combine(_toolsRoot, "tools", "agent-workflows", "definitions");
        if (!Directory.Exists(defsDir)) return [];

        return Directory.GetFiles(defsDir, "*.json")
            .Select(f =>
            {
                try
                {
                    var json = File.ReadAllText(f);
                    var node = JsonNode.Parse(json);
                    if (node is null) return null;
                    return new WorkflowDefinition(
                        Name: node["name"]?.GetValue<string>() ?? Path.GetFileNameWithoutExtension(f),
                        StepCount: node["steps"]?.AsArray()?.Count ?? 0,
                        HasSynthesis: node["synthesizer"] is not null
                    );
                }
                catch { return null; }
            })
            .Where(d => d is not null)
            .Cast<WorkflowDefinition>()
            .ToList();
    }
}
