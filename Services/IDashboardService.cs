using HazardousGoodsYard.Models;

namespace HazardousGoodsYard.Services;

public interface IDashboardService
{
    Task<DashboardStatistics> GetStatistics();
    Task<List<ReservationGroupByGoodsCategory>> GetReservationsByGoodsCategory();
    Task<List<ReservationGroupByYard>> GetReservationsByYard();
    Task<List<ReservationGroupByRejectionReason>> GetReservationsByRejectionReason();
    Task<List<ReservationGroupByWaitingTime>> GetReservationsByWaitingTime();
    Task<List<Reservation>> GetRecentReservations(int count = 10);
    Task<List<Reservation>> GetPendingReservations();
    Task<YardCapacityStatistics> GetYardCapacityStatistics();
}

public class DashboardStatistics
{
    public int TotalReservations { get; set; }
    public int PendingReservations { get; set; }
    public int CompletedReservations { get; set; }
    public int RejectedReservations { get; set; }
    public int ExpiredReservations { get; set; }
    public int TodayReservations { get; set; }
    public double AverageWaitingTime { get; set; }
}

public class ReservationGroupByGoodsCategory
{
    public string GoodsCategory { get; set; } = string.Empty;
    public int Count { get; set; }
    public List<ReservationStatus> Statuses { get; set; } = new List<ReservationStatus>();
}

public class ReservationGroupByYard
{
    public string YardName { get; set; } = string.Empty;
    public string AreaName { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Capacity { get; set; }
    public int Usage { get; set; }
}

public class ReservationGroupByRejectionReason
{
    public RejectionReasonType ReasonType { get; set; }
    public string ReasonTypeName { get; set; } = string.Empty;
    public int Count { get; set; }
    public List<string> Examples { get; set; } = new List<string>();
}

public class ReservationGroupByWaitingTime
{
    public string TimeRange { get; set; } = string.Empty;
    public int Count { get; set; }
    public double AverageHours { get; set; }
}

public class YardCapacityStatistics
{
    public int TotalCapacity { get; set; }
    public int TotalUsage { get; set; }
    public double UsagePercentage { get; set; }
    public List<YardAreaStatistics> Areas { get; set; } = new List<YardAreaStatistics>();
}

public class YardAreaStatistics
{
    public string AreaCode { get; set; } = string.Empty;
    public string AreaName { get; set; } = string.Empty;
    public int MaxCapacity { get; set; }
    public int CurrentUsage { get; set; }
    public double UsagePercentage { get; set; }
}