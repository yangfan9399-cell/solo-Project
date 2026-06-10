using Microsoft.EntityFrameworkCore;
using TempPowerInspection.Models;

namespace TempPowerInspection.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<HiddenDanger> HiddenDangers { get; set; }
    public DbSet<Rectification> Rectifications { get; set; }
    public DbSet<PowerApproval> PowerApprovals { get; set; }
    public DbSet<StatusHistory> StatusHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<HiddenDanger>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DistributionBoxName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.BuildingName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.TeamName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DangerType).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.Rectification)
                .WithOne(r => r.HiddenDanger)
                .HasForeignKey<Rectification>(r => r.HiddenDangerId);
            entity.HasOne(e => e.PowerApproval)
                .WithOne(p => p.HiddenDanger)
                .HasForeignKey<PowerApproval>(p => p.HiddenDangerId);
        });

        modelBuilder.Entity<Rectification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.HiddenDanger)
                .WithOne(h => h.Rectification)
                .HasForeignKey<Rectification>(e => e.HiddenDangerId);
        });

        modelBuilder.Entity<PowerApproval>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.HiddenDanger)
                .WithOne(h => h.PowerApproval)
                .HasForeignKey<PowerApproval>(e => e.HiddenDangerId);
        });

        modelBuilder.Entity<StatusHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.HiddenDanger)
                .WithMany(h => h.StatusHistories)
                .HasForeignKey(e => e.HiddenDangerId);
        });
    }
}
