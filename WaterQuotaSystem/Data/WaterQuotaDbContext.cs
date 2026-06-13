using Microsoft.EntityFrameworkCore;
using WaterQuotaSystem.Models;

namespace WaterQuotaSystem.Data;

public class WaterQuotaDbContext : DbContext
{
    public WaterQuotaDbContext(DbContextOptions<WaterQuotaDbContext> options) : base(options) { }

    public DbSet<WaterQuotaApplication> Applications => Set<WaterQuotaApplication>();
    public DbSet<ProcessingNode> ProcessingNodes => Set<ProcessingNode>();
    public DbSet<FieldChangeRecord> FieldChanges => Set<FieldChangeRecord>();
    public DbSet<EvidenceAttachment> EvidenceAttachments => Set<EvidenceAttachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WaterQuotaApplication>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ApplicationNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ParkName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ApplicantName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AppliedQuota).HasPrecision(18, 2);
            entity.Property(e => e.ApprovedQuota).HasPrecision(18, 2);
            entity.Property(e => e.QuotaLimit).HasPrecision(18, 2);
            entity.Property(e => e.Summary).HasMaxLength(500);
            entity.Property(e => e.Conclusion).HasMaxLength(500);
            entity.Property(e => e.BlockingReason).HasMaxLength(500);
            entity.Property(e => e.DifferentialFields).HasMaxLength(1000);
            entity.Property(e => e.RemediationPath).HasMaxLength(500);
            entity.HasIndex(e => e.ApplicationNo).IsUnique();
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<ProcessingNode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).HasMaxLength(200);
            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.HasOne(e => e.Application)
                .WithMany(a => a.ProcessingNodes)
                .HasForeignKey(e => e.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FieldChangeRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OldValue).HasMaxLength(500);
            entity.Property(e => e.NewValue).HasMaxLength(500);
            entity.HasOne(e => e.Application)
                .WithMany(a => a.FieldChanges)
                .HasForeignKey(e => e.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ProcessingNode)
                .WithMany()
                .HasForeignKey(e => e.ProcessingNodeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EvidenceAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).HasMaxLength(300);
            entity.HasOne(e => e.Application)
                .WithMany(a => a.EvidenceAttachments)
                .HasForeignKey(e => e.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        SeedData.Configure(modelBuilder);
    }
}
