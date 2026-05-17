namespace Dashboard.Api.Models;

public record SummaryStats(
    int TotalUsers,
    int ActiveUsers,
    decimal TotalRevenue,
    int TotalOrders,
    double ConversionRate,
    decimal AvgOrderValue
);

public record RevenuePoint(string Date, decimal Amount);
public record TopProduct(string Name, int Sales, decimal Revenue, double Growth);
public record UserGrowth(string Month, int NewUsers, int TotalUsers);

public record OrderItem(
    string Id,
    string Customer,
    string Product,
    decimal Amount,
    string Status,
    string Date
);

public record PaginatedResponse<T>(List<T> Data, int Page, int Limit, int Total);
