using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BridgeInspection.Models;

namespace BridgeInspection.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Bridge> Bridges { get; set; }
    public DbSet<Defect> Defects { get; set; }
    public DbSet<Sensor> Sensors { get; set; }
    public DbSet<SensorReading> SensorReadings { get; set; }
    public DbSet<DefectHistory> DefectHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Defect>()
            .HasOne(d => d.Bridge)
            .WithMany(b => b.Defects)
            .HasForeignKey(d => d.BridgeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Defect>()
            .HasOne(d => d.Reporter)
            .WithMany(u => u.ReportedDefects)
            .HasForeignKey(d => d.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Defect>()
            .HasOne(d => d.Assessor)
            .WithMany(u => u.AssessedDefects)
            .HasForeignKey(d => d.AssessorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Defect>()
            .HasOne(d => d.MaintenanceUnit)
            .WithMany(u => u.MaintainedDefects)
            .HasForeignKey(d => d.MaintenanceUnitId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Defect>()
            .HasOne(d => d.Acceptor)
            .WithMany(u => u.AcceptedDefects)
            .HasForeignKey(d => d.AcceptorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Sensor>()
            .HasOne(s => s.Bridge)
            .WithMany(b => b.Sensors)
            .HasForeignKey(s => s.BridgeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SensorReading>()
            .HasOne(sr => sr.Sensor)
            .WithMany(s => s.Readings)
            .HasForeignKey(sr => sr.SensorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SensorReading>()
            .HasOne(sr => sr.Defect)
            .WithMany(d => d.SensorReadings)
            .HasForeignKey(sr => sr.DefectId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DefectHistory>()
            .HasOne(dh => dh.Defect)
            .WithMany(d => d.Histories)
            .HasForeignKey(dh => dh.DefectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DefectHistory>()
            .HasOne(dh => dh.Operator)
            .WithMany(u => u.OperatedHistories)
            .HasForeignKey(dh => dh.OperatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
