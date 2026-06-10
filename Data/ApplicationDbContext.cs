using HazardousGoodsYard.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HazardousGoodsYard.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<HazardousGood> HazardousGoods { get; set; }
    public DbSet<YardArea> YardAreas { get; set; }
    public DbSet<IsolationZone> IsolationZones { get; set; }
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<ReservationHistory> ReservationHistories { get; set; }
    public DbSet<SafetyDocument> SafetyDocuments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.HazardousGood)
            .WithMany(h => h.Reservations)
            .HasForeignKey(r => r.HazardousGoodId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.YardArea)
            .WithMany(y => y.Reservations)
            .HasForeignKey(r => r.YardAreaId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.IsolationZone)
            .WithMany(z => z.Reservations)
            .HasForeignKey(r => r.IsolationZoneId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.ForwarderUser)
            .WithMany()
            .HasForeignKey(r => r.ForwarderUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.DispatcherUser)
            .WithMany()
            .HasForeignKey(r => r.DispatcherUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.SafetyOfficerUser)
            .WithMany()
            .HasForeignKey(r => r.SafetyOfficerUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.ReviewerUser)
            .WithMany()
            .HasForeignKey(r => r.ReviewerUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ReservationHistory>()
            .HasOne(h => h.Reservation)
            .WithMany(r => r.Histories)
            .HasForeignKey(h => h.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReservationHistory>()
            .HasOne(h => h.OperatorUser)
            .WithMany()
            .HasForeignKey(h => h.OperatorUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<SafetyDocument>()
            .HasOne(d => d.Reservation)
            .WithMany(r => r.SafetyDocuments)
            .HasForeignKey(d => d.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SafetyDocument>()
            .HasOne(d => d.VerifiedByUser)
            .WithMany()
            .HasForeignKey(d => d.VerifiedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<IsolationZone>()
            .HasOne(z => z.YardArea)
            .WithMany(a => a.IsolationZones)
            .HasForeignKey(z => z.YardAreaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Reservation>()
            .HasIndex(r => r.ReservationNumber)
            .IsUnique();

        modelBuilder.Entity<HazardousGood>()
            .HasIndex(h => h.ContainerNumber)
            .IsUnique();

        modelBuilder.Entity<HazardousGood>()
            .HasIndex(h => h.UNNumber);
    }
}