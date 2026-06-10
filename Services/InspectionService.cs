using EquipmentMaintenanceSystem.Data;
using EquipmentMaintenanceSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace EquipmentMaintenanceSystem.Services
{
    public interface IInspectionService
    {
        Task<InspectionRecord> GetInspectionById(int id);
        Task<List<InspectionRecord>> GetAllInspections();
        Task<List<InspectionRecord>> GetInspectionsByStatus(InspectionStatus status);
        Task<InspectionRecord> CreateInspection(InspectionRecord inspection);
        Task ConfirmInspection(int id, string operatorId);
        Task RejectInspection(int id, string operatorId, string remark);
        Task TransferToMaintenance(int id, string operatorId);
    }

    public class InspectionService : IInspectionService
    {
        private readonly ApplicationDbContext _context;

        public InspectionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InspectionRecord> GetInspectionById(int id)
        {
            return await _context.InspectionRecords
                .Include(i => i.Equipment)
                .Include(i => i.Equipment.ProductionLine)
                .Include(i => i.Equipment.EquipmentType)
                .Include(i => i.InspectionItems)
                .Include(i => i.InspectionHistories)
                .Include(i => i.MaintenanceOrder)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<List<InspectionRecord>> GetAllInspections()
        {
            return await _context.InspectionRecords
                .Include(i => i.Equipment)
                .Include(i => i.Equipment.ProductionLine)
                .OrderByDescending(i => i.InspectionTime)
                .ToListAsync();
        }

        public async Task<List<InspectionRecord>> GetInspectionsByStatus(InspectionStatus status)
        {
            return await _context.InspectionRecords
                .Include(i => i.Equipment)
                .Include(i => i.Equipment.ProductionLine)
                .Where(i => i.Status == status)
                .OrderByDescending(i => i.InspectionTime)
                .ToListAsync();
        }

        public async Task<InspectionRecord> CreateInspection(InspectionRecord inspection)
        {
            inspection.InspectionCode = GenerateInspectionCode();
            inspection.Status = InspectionStatus.Pending;
            inspection.ReportedTime = DateTime.Now;
            
            _context.InspectionRecords.Add(inspection);
            
            _context.InspectionHistories.Add(new InspectionHistory
            {
                InspectionRecordId = inspection.Id,
                OperationTime = DateTime.Now,
                Operator = inspection.ReportedBy ?? "unknown",
                Action = InspectionAction.Reported,
                Remark = "提交点检异常"
            });
            
            await _context.SaveChangesAsync();
            return inspection;
        }

        public async Task ConfirmInspection(int id, string operatorId)
        {
            var inspection = await _context.InspectionRecords.FindAsync(id);
            if (inspection != null && inspection.Status == InspectionStatus.Pending)
            {
                inspection.Status = InspectionStatus.Confirmed;
                
                _context.InspectionHistories.Add(new InspectionHistory
                {
                    InspectionRecordId = inspection.Id,
                    OperationTime = DateTime.Now,
                    Operator = operatorId,
                    Action = InspectionAction.Confirmed,
                    Remark = "确认停机"
                });
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task RejectInspection(int id, string operatorId, string remark)
        {
            var inspection = await _context.InspectionRecords.FindAsync(id);
            if (inspection != null && inspection.Status == InspectionStatus.Pending)
            {
                inspection.Status = InspectionStatus.Rejected;
                
                _context.InspectionHistories.Add(new InspectionHistory
                {
                    InspectionRecordId = inspection.Id,
                    OperationTime = DateTime.Now,
                    Operator = operatorId,
                    Action = InspectionAction.Rejected,
                    Remark = remark
                });
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task TransferToMaintenance(int id, string operatorId)
        {
            var inspection = await _context.InspectionRecords.FindAsync(id);
            
            if (inspection != null && inspection.Status == InspectionStatus.Confirmed)
            {
                // 1. 先创建维修工单并保存，获得真实 Id
                var maintenanceOrder = new MaintenanceOrder
                {
                    OrderCode = GenerateMaintenanceOrderCode(),
                    CreateTime = DateTime.Now,
                    Status = MaintenanceStatus.Created,
                    EquipmentId = inspection.EquipmentId,
                    ConfirmedBy = operatorId
                };
                
                _context.MaintenanceOrders.Add(maintenanceOrder);
                await _context.SaveChangesAsync();
                
                // 2. 使用保存后的真实 Id 更新点检记录
                inspection.Status = InspectionStatus.Maintenance;
                inspection.MaintenanceOrderId = maintenanceOrder.Id;
                
                _context.InspectionHistories.Add(new InspectionHistory
                {
                    InspectionRecordId = inspection.Id,
                    OperationTime = DateTime.Now,
                    Operator = operatorId,
                    Action = InspectionAction.Transferred,
                    Remark = "转维修"
                });
                
                _context.MaintenanceHistories.Add(new MaintenanceHistory
                {
                    MaintenanceOrderId = maintenanceOrder.Id,
                    OperationTime = DateTime.Now,
                    Operator = operatorId,
                    Action = MaintenanceAction.Created,
                    Remark = "创建工单"
                });
                
                await _context.SaveChangesAsync();
            }
        }

        private string GenerateInspectionCode()
        {
            return $"INS-{DateTime.Now:yyyyMMdd}-{_context.InspectionRecords.Count() + 1:D3}";
        }

        private string GenerateMaintenanceOrderCode()
        {
            return $"WO-{DateTime.Now:yyyyMMdd}-{_context.MaintenanceOrders.Count() + 1:D3}";
        }
    }
}