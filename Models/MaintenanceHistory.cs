namespace EquipmentMaintenanceSystem.Models
{
    public class MaintenanceHistory
    {
        public int Id { get; set; }
        public DateTime OperationTime { get; set; }
        public string Operator { get; set; } = string.Empty;
        public MaintenanceAction Action { get; set; }
        public string? Remark { get; set; }
        
        public int MaintenanceOrderId { get; set; }
        public MaintenanceOrder MaintenanceOrder { get; set; } = null!;
    }

    public enum MaintenanceAction
    {
        Created = 1,
        StopConfirmed = 2,
        RepairStarted = 3,
        RepairCompleted = 4,
        ReviewApproved = 5,
        ReviewRejected = 6,
        Resumed = 7,
        Rejected = 8
    }
}