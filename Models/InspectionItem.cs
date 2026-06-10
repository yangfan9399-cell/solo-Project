namespace EquipmentMaintenanceSystem.Models
{
    public class InspectionItem
    {
        public int Id { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? StandardValue { get; set; }
        public string? ActualValue { get; set; }
        public bool IsAbnormal { get; set; } = false;
        public string? AbnormalDescription { get; set; }
        
        public int InspectionRecordId { get; set; }
        public InspectionRecord InspectionRecord { get; set; } = null!;
    }
}