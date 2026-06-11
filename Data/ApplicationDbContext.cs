using Microsoft.EntityFrameworkCore;
using OceanFarm.Models;

namespace OceanFarm.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<AppUser> Users { get; set; }
    public DbSet<SeaArea> SeaAreas { get; set; }
    public DbSet<FishSpecies> FishSpecies { get; set; }
    public DbSet<Cage> Cages { get; set; }
    public DbSet<WaterQualityRecord> WaterQualityRecords { get; set; }
    public DbSet<FeedingRecord> FeedingRecords { get; set; }
    public DbSet<DiseaseReport> DiseaseReports { get; set; }
    public DbSet<WorkflowNode> WorkflowNodes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.UserName)
            .IsUnique();

        modelBuilder.Entity<Cage>()
            .HasIndex(c => c.Code)
            .IsUnique();

        modelBuilder.Entity<Cage>()
            .HasOne(c => c.SeaArea)
            .WithMany(s => s.Cages)
            .HasForeignKey(c => c.SeaAreaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Cage>()
            .HasOne(c => c.FishSpecies)
            .WithMany(f => f.Cages)
            .HasForeignKey(c => c.FishSpeciesId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WaterQualityRecord>()
            .HasOne(w => w.Cage)
            .WithMany(c => c.WaterQualityRecords)
            .HasForeignKey(w => w.CageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WaterQualityRecord>()
            .HasOne(w => w.Inspector)
            .WithMany()
            .HasForeignKey(w => w.InspectorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FeedingRecord>()
            .HasOne(f => f.Cage)
            .WithMany(c => c.FeedingRecords)
            .HasForeignKey(f => f.CageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FeedingRecord>()
            .HasOne(f => f.Operator)
            .WithMany()
            .HasForeignKey(f => f.OperatorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DiseaseReport>()
            .HasOne(d => d.Cage)
            .WithMany(c => c.DiseaseReports)
            .HasForeignKey(d => d.CageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DiseaseReport>()
            .HasOne(d => d.Reporter)
            .WithMany()
            .HasForeignKey(d => d.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DiseaseReport>()
            .HasOne(d => d.Veterinarian)
            .WithMany()
            .HasForeignKey(d => d.VeterinarianId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WorkflowNode>()
            .HasOne(w => w.Cage)
            .WithMany(c => c.WorkflowNodes)
            .HasForeignKey(w => w.CageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkflowNode>()
            .HasOne(w => w.Operator)
            .WithMany()
            .HasForeignKey(w => w.OperatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
