using EquipmentMaintenanceSystem.Data;
using EquipmentMaintenanceSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace EquipmentMaintenanceSystem.Services
{
    public interface IStatisticsService
    {
        Task<List<StatisticsResult>> GetStatisticsByProductionLine();
        Task<List<StatisticsResult>> GetStatisticsByEquipmentType();
        Task<List<StatisticsResult>> GetStatisticsByFailureReason();
        Task<List<StatisticsResult>> GetStatisticsByDowntimeLoss();
    }

    public class StatisticsResult
    {
        public string Category { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal TotalLoss { get; set; }
        public double AvgDowntimeHours { get; set; }
    }

    public class StatisticsService : IStatisticsService
    {
        private readonly ApplicationDbContext _context;

        public StatisticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<StatisticsResult>> GetStatisticsByProductionLine()
        {
            return await _context.MaintenanceOrders
                .Include(m => m.Equipment)
                .Include(m => m.Equipment.ProductionLine)
                .GroupBy(m => m.Equipment.ProductionLine.Name)
                .Select(g => new StatisticsResult
                {
                    Category = g.Key,
                    Count = g.Count(),
                    TotalLoss = g.Sum(m => m.DowntimeLoss ?? 0),
                    AvgDowntimeHours = g.Average(m => (m.ResumeTime - (m.StopTime ?? m.CreateTime))?.TotalHours ?? 0)
                })
                .OrderByDescending(s => s.TotalLoss)
                .ToListAsync();
        }

        public async Task<List<StatisticsResult>> GetStatisticsByEquipmentType()
        {
            return await _context.MaintenanceOrders
                .Include(m => m.Equipment)
                .Include(m => m.Equipment.EquipmentType)
                .GroupBy(m => m.Equipment.EquipmentType.Name)
                .Select(g => new StatisticsResult
                {
                    Category = g.Key,
                    Count = g.Count(),
                    TotalLoss = g.Sum(m => m.DowntimeLoss ?? 0),
                    AvgDowntimeHours = g.Average(m => (m.ResumeTime - (m.StopTime ?? m.CreateTime))?.TotalHours ?? 0)
                })
                .OrderByDescending(s => s.Count)
                .ToListAsync();
        }

        public async Task<List<StatisticsResult>> GetStatisticsByFailureReason()
        {
            return await _context.MaintenanceOrders
                .Where(m => !string.IsNullOrEmpty(m.FailureReason))
                .GroupBy(m => m.FailureReason)
                .Select(g => new StatisticsResult
                {
                    Category = g.Key,
                    Count = g.Count(),
                    TotalLoss = g.Sum(m => m.DowntimeLoss ?? 0),
                    AvgDowntimeHours = g.Average(m => (m.ResumeTime - (m.StopTime ?? m.CreateTime))?.TotalHours ?? 0)
                })
                .OrderByDescending(s => s.Count)
                .ToListAsync();
        }

        public async Task<List<StatisticsResult>> GetStatisticsByDowntimeLoss()
        {
            return await _context.MaintenanceOrders
                .Include(m => m.Equipment)
                .Include(m => m.Equipment.ProductionLine)
                .GroupBy(m => new { m.Equipment.ProductionLine.Name, m.Equipment.Code })
                .Select(g => new StatisticsResult
                {
                    Category = $"{g.Key.Name} - {g.Key.Code}",
                    Count = g.Count(),
                    TotalLoss = g.Sum(m => m.DowntimeLoss ?? 0),
                    AvgDowntimeHours = g.Average(m => (m.ResumeTime - (m.StopTime ?? m.CreateTime))?.TotalHours ?? 0)
                })
                .OrderByDescending(s => s.TotalLoss)
                .ToListAsync();
        }
    }
}