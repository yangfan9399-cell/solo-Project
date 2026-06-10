namespace EquipmentMaintenanceSystem.Models
{
    public class Equipment
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Location { get; set; }
        public EquipmentStatus Status { get; set; } = EquipmentStatus.Normal;
        public DateTime InstallDate { get; set; }
        public DateTime LastMaintenanceDate { get; set; }
        
        public int ProductionLineId { get; set; }
        public ProductionLine ProductionLine { get; set; } = null!;
        
        public int EquipmentTypeId { get; set; }
        public EquipmentType EquipmentType { get; set; } = null!;
        
        public ICollection<InspectionRecord> InspectionRecords { get; set; } = new List<InspectionRecord>();
        public ICollection<MaintenanceOrder> MaintenanceOrders { get; set; } = new List<MaintenanceOrder>();
    }

    public enum EquipmentStatus
    {
        Normal = 1,
        Abnormal = 2,
        Stopped = 3,
        Maintenance = 4
    }
}