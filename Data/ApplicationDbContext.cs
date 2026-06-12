using MeetingRoomEquipment.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetingRoomEquipment.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<EquipmentBorrowRecord> EquipmentBorrowRecords { get; set; }
    public DbSet<RecordNode> RecordNodes { get; set; }
    public DbSet<EvidenceAttachment> EvidenceAttachments { get; set; }
    public DbSet<FieldSnapshot> FieldSnapshots { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EquipmentBorrowRecord>()
            .HasIndex(r => r.RecordNo)
            .IsUnique();

        modelBuilder.Entity<EquipmentBorrowRecord>()
            .HasIndex(r => r.Status);

        modelBuilder.Entity<EquipmentBorrowRecord>()
            .HasIndex(r => r.SampleCategory);

        modelBuilder.Entity<EquipmentBorrowRecord>()
            .HasIndex(r => r.CurrentResponsibleId);

        modelBuilder.Entity<RecordNode>()
            .HasIndex(n => n.RecordId);

        modelBuilder.Entity<RecordNode>()
            .HasIndex(n => new { n.RecordId, n.Sequence });

        modelBuilder.Entity<EvidenceAttachment>()
            .HasIndex(e => e.RecordId);

        modelBuilder.Entity<FieldSnapshot>()
            .HasIndex(s => s.RecordId);

        modelBuilder.Entity<FieldSnapshot>()
            .HasIndex(s => new { s.RecordId, s.NodeId });
    }
}
