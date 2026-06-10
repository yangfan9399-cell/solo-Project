namespace EquipmentMaintenanceSystem.Models
{
    public class InspectionHistory
    {
        public int Id { get; set; }
        public DateTime OperationTime { get; set; }
        public string Operator { get; set; } = string.Empty;
        public InspectionAction Action { get; set; }
        public string? Remark { get; set; }
        
        public int InspectionRecordId { get; set; }
        public InspectionRecord InspectionRecord { get; set; } = null!;
    }

    public enum InspectionAction
    {
        Reported = 1,
        Confirmed = 2,
        Rejected = 3,
        Transferred = 4
    }
}