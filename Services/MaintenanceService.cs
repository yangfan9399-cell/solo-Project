using EquipmentMaintenanceSystem.Data;
using EquipmentMaintenanceSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace EquipmentMaintenanceSystem.Services
{
    public interface IMaintenanceService
    {
        Task<MaintenanceOrder> GetMaintenanceOrderById(int id);
        Task<List<MaintenanceOrder>> GetAllMaintenanceOrders();
        Task<List<MaintenanceOrder>> GetMaintenanceOrdersByStatus(MaintenanceStatus status);
        Task ConfirmStop(int id, string operatorId);
        Task StartRepair(int id, string operatorId);
        Task CompleteRepair(int id, string operatorId, string repairContent, List<MaintenanceSparePart> spareParts);
        Task ReviewMaintenance(int id, string operatorId, bool approved, string remark);
        Task ConfirmResume(int id, string operatorId);
        Task<bool> CanResume(int id);
    }

    public class MaintenanceService : IMaintenanceService
    {
        private readonly ApplicationDbContext _context;

        public MaintenanceService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MaintenanceOrder> GetMaintenanceOrderById(int id)
        {
            return await _context.MaintenanceOrders
                .Include(m => m.Equipment)
                .Include(m => m.Equipment.ProductionLine)
                .Include(m => m.Equipment.EquipmentType)
                .Include(m => m.MaintenanceSpareParts)
                .ThenInclude(ms => ms.SparePart)
                .Include(m => m.MaintenanceHistories)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<List<MaintenanceOrder>> GetAllMaintenanceOrders()
        {
            return await _context.MaintenanceOrders
                .Include(m => m.Equipment)
                .Include(m => m.Equipment.ProductionLine)
                .OrderByDescending(m => m.CreateTime)
                .ToListAsync();
        }

        public async Task<List<MaintenanceOrder>> GetMaintenanceOrdersByStatus(MaintenanceStatus status)
        {
            return await _context.MaintenanceOrders
                .Include(m => m.Equipment)
                .Include(m => m.Equipment.ProductionLine)
                .Where(m => m.Status == status)
                .OrderByDescending(m => m.CreateTime)
                .ToListAsync();
        }

        public async Task ConfirmStop(int id, string operatorId)
        {
            var order = await _context.MaintenanceOrders.FindAsync(id);
            if (order != null && order.Status == MaintenanceStatus.Created)
            {
                order.Status = MaintenanceStatus.Stopped;
                order.StopTime = DateTime.Now;
                order.ConfirmedBy = operatorId;
                
                order.MaintenanceHistories.Add(new MaintenanceHistory
                {
                    OperationTime = DateTime.Now,
                    Operator = operatorId,
                    Action = MaintenanceAction.StopConfirmed,
                    Remark = "确认停机"
                });
                
                var equipment = await _context.Equipments.FindAsync(order.EquipmentId);
                if (equipment != null)
                {
                    equipment.Status = EquipmentStatus.Stopped;
                }
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task StartRepair(int id, string operatorId)
        {
            var order = await _context.MaintenanceOrders.FindAsync(id);
            if (order != null && order.Status == MaintenanceStatus.Stopped)
            {
                order.Status = MaintenanceStatus.Repairing;
                order.RepairStartTime = DateTime.Now;
                
                order.MaintenanceHistories.Add(new MaintenanceHistory
                {
                    OperationTime = DateTime.Now,
                    Operator = operatorId,
                    Action = MaintenanceAction.RepairStarted,
                    Remark = "开始维修"
                });
                
                var equipment = await _context.Equipments.FindAsync(order.EquipmentId);
                if (equipment != null)
                {
                    equipment.Status = EquipmentStatus.Maintenance;
                }
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task CompleteRepair(int id, string operatorId, string repairContent, List<MaintenanceSparePart> spareParts)
        {
            var order = await _context.MaintenanceOrders
                .Include(m => m.MaintenanceSpareParts)
                .FirstOrDefaultAsync(m => m.Id == id);
            
            if (order != null && order.Status == MaintenanceStatus.Repairing)
            {
                order.Status = MaintenanceStatus.PendingReview;
                order.RepairEndTime = DateTime.Now;
                order.RepairedBy = operatorId;
                order.RepairContent = repairContent;
                
                foreach (var sparePart in spareParts)
                {
                    var existing = order.MaintenanceSpareParts.FirstOrDefault(ms => ms.SparePartId == sparePart.SparePartId);
                    if (existing == null)
                    {
                        var part = await _context.SpareParts.FindAsync(sparePart.SparePartId);
                        order.MaintenanceSpareParts.Add(new MaintenanceSparePart
                        {
                            SparePartId = sparePart.SparePartId,
                            Quantity = sparePart.Quantity,
                            IsAvailable = part != null && part.StockQuantity >= sparePart.Quantity
                        });
                    }
                }
                
                order.MaintenanceHistories.Add(new MaintenanceHistory
                {
                    OperationTime = DateTime.Now,
                    Operator = operatorId,
                    Action = MaintenanceAction.RepairCompleted,
                    Remark = "维修完成"
                });
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task ReviewMaintenance(int id, string operatorId, bool approved, string remark)
        {
            var order = await _context.MaintenanceOrders.FindAsync(id);
            if (order != null && order.Status == MaintenanceStatus.PendingReview)
            {
                if (approved)
                {
                    order.Status = MaintenanceStatus.PendingReview;
                    order.ReviewedBy = operatorId;
                    
                    order.MaintenanceHistories.Add(new MaintenanceHistory
                    {
                        OperationTime = DateTime.Now,
                        Operator = operatorId,
                        Action = MaintenanceAction.ReviewApproved,
                        Remark = remark
                    });
                }
                else
                {
                    order.Status = MaintenanceStatus.Failed;
                    order.ReviewedBy = operatorId;
                    
                    order.MaintenanceHistories.Add(new MaintenanceHistory
                    {
                        OperationTime = DateTime.Now,
                        Operator = operatorId,
                        Action = MaintenanceAction.ReviewRejected,
                        Remark = remark
                    });
                    
                    var equipment = await _context.Equipments.FindAsync(order.EquipmentId);
                    if (equipment != null)
                    {
                        equipment.Status = EquipmentStatus.Abnormal;
                    }
                }
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task ConfirmResume(int id, string operatorId)
        {
            var order = await _context.MaintenanceOrders.FindAsync(id);
            if (order != null && order.Status == MaintenanceStatus.PendingReview)
            {
                order.Status = MaintenanceStatus.Resumed;
                order.ResumeTime = DateTime.Now;
                order.ReviewedBy = operatorId;
                
                var stopTime = order.StopTime ?? order.CreateTime;
                var downtime = DateTime.Now - stopTime;
                order.DowntimeLoss = (decimal)(downtime.TotalHours * 800);
                
                order.MaintenanceHistories.Add(new MaintenanceHistory
                {
                    OperationTime = DateTime.Now,
                    Operator = operatorId,
                    Action = MaintenanceAction.Resumed,
                    Remark = "确认复产"
                });
                
                var equipment = await _context.Equipments.FindAsync(order.EquipmentId);
                if (equipment != null)
                {
                    equipment.Status = EquipmentStatus.Normal;
                    equipment.LastMaintenanceDate = DateTime.Now;
                }
                
                var inspection = await _context.InspectionRecords.FirstOrDefaultAsync(i => i.MaintenanceOrderId == id);
                if (inspection != null)
                {
                    inspection.Status = InspectionStatus.Completed;
                }
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> CanResume(int id)
        {
            var order = await _context.MaintenanceOrders
                .Include(m => m.MaintenanceSpareParts)
                .FirstOrDefaultAsync(m => m.Id == id);
            
            if (order == null) return false;
            if (order.Status != MaintenanceStatus.PendingReview) return false;
            
            return !order.MaintenanceSpareParts.Any(ms => !ms.IsAvailable);
        }
    }
}