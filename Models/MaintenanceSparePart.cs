namespace EquipmentMaintenanceSystem.Models
{
    public class MaintenanceSparePart
    {
        public int MaintenanceOrderId { get; set; }
        public MaintenanceOrder MaintenanceOrder { get; set; } = null!;
        
        public int SparePartId { get; set; }
        public SparePart SparePart { get; set; } = null!;
        
        public int Quantity { get; set; }
        public bool IsAvailable { get; set; } = true;
    }
}