using Microsoft.EntityFrameworkCore;
using BunkerFuelSystem.Models;

namespace BunkerFuelSystem.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<BunkerApplication> BunkerApplications => Set<BunkerApplication>();
    public DbSet<ProcessNode> ProcessNodes => Set<ProcessNode>();
    public DbSet<DiscrepancyField> DiscrepancyFields => Set<DiscrepancyField>();
    public DbSet<EvidenceAttachment> EvidenceAttachments => Set<EvidenceAttachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BunkerApplication>(entity =>
        {
            entity.Property(e => e.OrderedQuantity).HasColumnType("decimal(18,4)");
            entity.Property(e => e.ActualQuantity).HasColumnType("decimal(18,4)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,4)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,4)");

            entity.Property(e => e.ApplicationNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ShipName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.VoyageNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.FuelType).IsRequired().HasMaxLength(20);
            entity.Property(e => e.BunkerPort).IsRequired().HasMaxLength(200);
            entity.Property(e => e.SupplierName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ApplicationSource).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CurrentResponsiblePerson).IsRequired().HasMaxLength(100);

            entity.HasIndex(e => new { e.Status, e.Category });

            entity.HasMany(e => e.ProcessNodes)
                .WithOne(p => p.BunkerApplication)
                .HasForeignKey(p => p.BunkerApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.DiscrepancyFields)
                .WithOne(d => d.BunkerApplication)
                .HasForeignKey(d => d.BunkerApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.EvidenceAttachments)
                .WithOne(a => a.BunkerApplication)
                .HasForeignKey(a => a.BunkerApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProcessNode>(entity =>
        {
            entity.Property(e => e.OperatorName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(100);

            entity.HasIndex(e => e.BunkerApplicationId);
        });

        modelBuilder.Entity<DiscrepancyField>(entity =>
        {
            entity.Property(e => e.FieldName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FieldLabel).IsRequired().HasMaxLength(200);
            entity.Property(e => e.OriginalValue).IsRequired().HasMaxLength(500);
            entity.Property(e => e.CurrentValue).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ChangedBy).IsRequired().HasMaxLength(100);

            entity.HasIndex(e => e.BunkerApplicationId);
        });

        modelBuilder.Entity<EvidenceAttachment>(entity =>
        {
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(500);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.FileType).IsRequired().HasMaxLength(200);
            entity.Property(e => e.UploadedBy).IsRequired().HasMaxLength(100);

            entity.HasIndex(e => e.BunkerApplicationId);
        });
    }
}
