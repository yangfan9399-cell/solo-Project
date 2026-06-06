using Microsoft.EntityFrameworkCore;
using SurgicalInstrumentTracking.Models;

namespace SurgicalInstrumentTracking.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Department> Departments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Instrument> Instruments { get; set; }
    public DbSet<InstrumentSet> InstrumentSets { get; set; }
    public DbSet<InstrumentSetItem> InstrumentSetItems { get; set; }
    public DbSet<SterilizationBatch> SterilizationBatches { get; set; }
    public DbSet<TrackingRecord> TrackingRecords { get; set; }
    public DbSet<AnomalyRecord> AnomalyRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<InstrumentSetItem>()
            .HasOne(i => i.InstrumentSet)
            .WithMany(s => s.Items)
            .HasForeignKey(i => i.InstrumentSetId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InstrumentSetItem>()
            .HasOne(i => i.Instrument)
            .WithMany()
            .HasForeignKey(i => i.InstrumentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TrackingRecord>()
            .HasOne(t => t.InstrumentSet)
            .WithMany(s => s.TrackingRecords)
            .HasForeignKey(t => t.InstrumentSetId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TrackingRecord>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AnomalyRecord>()
            .HasOne(a => a.InstrumentSet)
            .WithMany(s => s.AnomalyRecords)
            .HasForeignKey(a => a.InstrumentSetId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AnomalyRecord>()
            .HasOne(a => a.ReportedByUser)
            .WithMany()
            .HasForeignKey(a => a.ReportedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InstrumentSet>()
            .HasOne(s => s.Department)
            .WithMany(d => d.InstrumentSets)
            .HasForeignKey(s => s.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InstrumentSet>()
            .HasOne(s => s.SterilizationBatch)
            .WithMany(b => b.InstrumentSets)
            .HasForeignKey(s => s.SterilizationBatchId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<InstrumentSet>()
            .HasOne(s => s.ReceivedByUser)
            .WithMany()
            .HasForeignKey(s => s.ReceivedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<SterilizationBatch>()
            .HasOne(b => b.PackedByUser)
            .WithMany()
            .HasForeignKey(b => b.PackedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Department)
            .WithMany(d => d.Users)
            .HasForeignKey(u => u.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
