namespace Dashboard.Api.Models;

public record SummaryStats(
    string OverallHealth,
    int AgentsEvaluated,
    int StructuralPassRate,
    int TestPassRate,
    int CrossPlatformSyncRate,
    int TotalTests,
    int TestsPassed,
    int TestsFailed,
    string GeneratedAt
);

public record AgentMetric(
    string Name,
    int KeywordsCount,
    string Mode,
    int SectionsCompleteness,
    int DoNotRules,
    bool FrontmatterValid,
    bool HasModel,
    bool ReadOnly,
    bool ReadOnlyConsistent,
    bool HandoffPresent,
    List<AlertItem> Alerts
);

public record SkillMetric(
    string Name,
    int KeywordsCount,
    bool HasGoal,
    bool HasConstraints,
    bool HasReferences,
    bool FrontmatterValid,
    bool CrossPlatformSynced
);

public record AlertItem(
    string Severity,
    string Agent,
    string Msg
);

public record WorkflowRun(
    string Id,
    string Workflow,
    string Status,
    string Progress,
    string SubmittedAt,
    string StartedAt,
    string CompletedAt,
    string Error
);

public record WorkflowDefinition(
    string Name,
    int StepCount,
    bool HasSynthesis
);

public record PaginatedResponse<T>(List<T> Data, int Page, int Limit, int Total);
