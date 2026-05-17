using Dashboard.Api.Models;

namespace Dashboard.Api.Services;

public class DashboardService
{
    private static readonly Random _rng = new();
    private static readonly string[] _customers =
        ["Acme Corp", "Globex Inc", "Initech", "Umbrella Co", "Cyberdyne", "Wonka Ind", "Stark Ltd", "Wayne Ent"];
    private static readonly string[] _products =
        ["Cloud Server Pro", "Data Sync Engine", "Analytics Suite", "Auth Gateway", "Cache Layer", "Queue Manager"];
    private static readonly string[] _statuses =
        ["completed", "processing", "pending", "cancelled"];

    public SummaryStats GetSummary()
    {
        return new SummaryStats(
            TotalUsers: _rng.Next(80000, 120000),
            ActiveUsers: _rng.Next(40000, 70000),
            TotalRevenue: _rng.Next(500000, 1500000),
            TotalOrders: _rng.Next(3000, 8000),
            ConversionRate: Math.Round(_rng.NextDouble() * 5 + 1.5, 1),
            AvgOrderValue: _rng.Next(80, 300)
        );
    }

    public List<RevenuePoint> GetRevenue(int days)
    {
        return Enumerable.Range(0, days).Select(i => new RevenuePoint(
            DateTime.Now.AddDays(-(days - 1) + i).ToString("yyyy-MM-dd"),
            _rng.Next(10000, 60000)
        )).ToList();
    }

    public PaginatedResponse<OrderItem> GetOrders(int page, int limit)
    {
        var all = Enumerable.Range(1, 500).Select(i => new OrderItem(
            Id: $"ORD-{1000 + i}",
            Customer: _customers[_rng.Next(_customers.Length)],
            Product: _products[_rng.Next(_products.Length)],
            Amount: _rng.Next(50, 2000),
            Status: _statuses[_rng.Next(_statuses.Length)],
            Date: DateTime.Now.AddDays(-_rng.Next(30)).ToString("yyyy-MM-dd")
        )).ToList();

        var paged = all.Skip((page - 1) * limit).Take(limit).ToList();
        return new PaginatedResponse<OrderItem>(paged, page, limit, all.Count);
    }

    public List<TopProduct> GetTopProducts()
    {
        return _products.Select(p => new TopProduct(
            Name: p,
            Sales: _rng.Next(200, 2000),
            Revenue: _rng.Next(50000, 500000),
            Growth: Math.Round(_rng.NextDouble() * 40 - 10, 1)
        )).OrderByDescending(p => p.Revenue).ToList();
    }

    public List<UserGrowth> GetUserGrowth()
    {
        var total = 50000;
        return Enumerable.Range(0, 12).Select(i =>
        {
            var newUsers = _rng.Next(2000, 8000);
            total += newUsers;
            return new UserGrowth(
                Month: DateTime.Now.AddMonths(-11 + i).ToString("MMM yy"),
                NewUsers: newUsers,
                TotalUsers: total
            );
        }).ToList();
    }
}
