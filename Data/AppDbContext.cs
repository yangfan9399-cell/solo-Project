using FuelManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Ship> Ships { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<FuelApplication> FuelApplications { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ship>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ImoNumber).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Flag).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContactPerson).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<FuelApplication>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ApplicationNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Port).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PlannedQuantity).HasPrecision(18, 2);
            entity.Property(e => e.ActualQuantity).HasPrecision(18, 2);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 4);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.SampleNumber).HasMaxLength(50);
            entity.Property(e => e.Remarks).HasMaxLength(1000);
            entity.Property(e => e.Status).HasDefaultValue(ApplicationStatus.PendingApproval);
            entity.Property(e => e.IsSampleSealed).HasDefaultValue(false);

            entity.HasOne(e => e.Ship)
                  .WithMany(s => s.Applications)
                  .HasForeignKey(e => e.ShipId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Supplier)
                  .WithMany(s => s.Applications)
                  .HasForeignKey(e => e.SupplierId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ApplicationNumber).IsUnique();
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OperatorName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.OperatorRole).HasMaxLength(50);
            entity.Property(e => e.Remarks).HasMaxLength(500);

            entity.HasOne(e => e.FuelApplication)
                  .WithMany(a => a.AuditLogs)
                  .HasForeignKey(e => e.FuelApplicationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.FuelApplicationId);
        });
    }
}
