namespace EquipmentMaintenanceSystem.Models
{
    public class ProductionLine
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        
        public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
    }
}