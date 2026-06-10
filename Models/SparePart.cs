namespace EquipmentMaintenanceSystem.Models
{
    public class SparePart
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Specification { get; set; }
        public int StockQuantity { get; set; }
        public int SafetyStock { get; set; }
        public string? Location { get; set; }
        
        public ICollection<MaintenanceSparePart> MaintenanceSpareParts { get; set; } = new List<MaintenanceSparePart>();
    }
}