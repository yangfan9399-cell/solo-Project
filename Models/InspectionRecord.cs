namespace EquipmentMaintenanceSystem.Models
{
    public class InspectionRecord
    {
        public int Id { get; set; }
        public string InspectionCode { get; set; } = string.Empty;
        public DateTime InspectionTime { get; set; }
        public string? Description { get; set; }
        public InspectionStatus Status { get; set; } = InspectionStatus.Pending;
        public string? ReportedBy { get; set; }
        public DateTime? ReportedTime { get; set; }
        
        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; } = null!;
        
        public int? MaintenanceOrderId { get; set; }
        public MaintenanceOrder? MaintenanceOrder { get; set; }
        
        public ICollection<InspectionItem> InspectionItems { get; set; } = new List<InspectionItem>();
        public ICollection<InspectionHistory> InspectionHistories { get; set; } = new List<InspectionHistory>();
    }

    public enum InspectionStatus
    {
        Pending = 1,
        Confirmed = 2,
        Maintenance = 3,
        Rejected = 4,
        Completed = 5
    }
}