using EquipmentMaintenanceSystem.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EquipmentMaintenanceSystem.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<ProductionLine> ProductionLines { get; set; }
        public DbSet<EquipmentType> EquipmentTypes { get; set; }
        public DbSet<Equipment> Equipments { get; set; }
        public DbSet<InspectionRecord> InspectionRecords { get; set; }
        public DbSet<InspectionItem> InspectionItems { get; set; }
        public DbSet<MaintenanceOrder> MaintenanceOrders { get; set; }
        public DbSet<MaintenanceHistory> MaintenanceHistories { get; set; }
        public DbSet<InspectionHistory> InspectionHistories { get; set; }
        public DbSet<SparePart> SpareParts { get; set; }
        public DbSet<MaintenanceSparePart> MaintenanceSpareParts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<MaintenanceSparePart>()
                .HasKey(ms => new { ms.MaintenanceOrderId, ms.SparePartId });

            modelBuilder.Entity<MaintenanceSparePart>()
                .HasOne(ms => ms.MaintenanceOrder)
                .WithMany(m => m.MaintenanceSpareParts)
                .HasForeignKey(ms => ms.MaintenanceOrderId);

            modelBuilder.Entity<MaintenanceSparePart>()
                .HasOne(ms => ms.SparePart)
                .WithMany(s => s.MaintenanceSpareParts)
                .HasForeignKey(ms => ms.SparePartId);
        }
    }
}