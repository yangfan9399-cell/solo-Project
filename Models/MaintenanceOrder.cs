namespace EquipmentMaintenanceSystem.Models
{
    public class MaintenanceOrder
    {
        public int Id { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public DateTime CreateTime { get; set; }
        public DateTime? StopTime { get; set; }
        public DateTime? RepairStartTime { get; set; }
        public DateTime? RepairEndTime { get; set; }
        public DateTime? ResumeTime { get; set; }
        public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Created;
        public string? FailureReason { get; set; }
        public string? RepairContent { get; set; }
        public string? ConfirmedBy { get; set; }
        public string? RepairedBy { get; set; }
        public string? ReviewedBy { get; set; }
        public decimal? DowntimeLoss { get; set; }
        
        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; } = null!;
        
        public ICollection<MaintenanceSparePart> MaintenanceSpareParts { get; set; } = new List<MaintenanceSparePart>();
        public ICollection<MaintenanceHistory> MaintenanceHistories { get; set; } = new List<MaintenanceHistory>();
    }

    public enum MaintenanceStatus
    {
        Created = 1,
        Stopped = 2,
        Repairing = 3,
        PendingReview = 4,
        Resumed = 5,
        Failed = 6
    }
}