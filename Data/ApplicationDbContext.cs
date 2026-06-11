using Microsoft.EntityFrameworkCore;
using SealManagementSystem.Models;

namespace SealManagementSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Department> Departments { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Seal> Seals { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<BorrowRequest> BorrowRequests { get; set; }
        public DbSet<ApprovalNode> ApprovalNodes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<BorrowRequest>()
                .Property(p => p.ExceptionReason)
                .HasConversion<int>();

            modelBuilder.Entity<BorrowRequest>()
                .HasOne(b => b.Applicant)
                .WithMany(u => u.BorrowRequests)
                .HasForeignKey(b => b.ApplicantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BorrowRequest>()
                .HasOne(b => b.Seal)
                .WithMany(s => s.BorrowRequests)
                .HasForeignKey(b => b.SealId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BorrowRequest>()
                .HasOne(b => b.Contract)
                .WithMany(c => c.BorrowRequests)
                .HasForeignKey(b => b.ContractId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Contract>()
                .HasOne(c => c.Applicant)
                .WithMany()
                .HasForeignKey(c => c.ApplicantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ApprovalNode>()
                .HasOne(a => a.BorrowRequest)
                .WithMany(b => b.ApprovalNodes)
                .HasForeignKey(a => a.BorrowRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ApprovalNode>()
                .HasOne(a => a.Operator)
                .WithMany(u => u.ApprovalNodes)
                .HasForeignKey(a => a.OperatorId)
                .OnDelete(DeleteBehavior.Restrict);

            SeedData.Seed(modelBuilder);
        }
    }
}
