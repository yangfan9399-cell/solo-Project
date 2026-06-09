using Microsoft.EntityFrameworkCore;
using LiquorCreditSystem.Models;

namespace LiquorCreditSystem.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Dealer> Dealers { get; set; }
    public DbSet<CreditLimit> CreditLimits { get; set; }
    public DbSet<Debt> Debts { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<PricePolicy> PricePolicies { get; set; }
    public DbSet<ProductPricePolicy> ProductPricePolicies { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<OrderHistory> OrderHistories { get; set; }
    public DbSet<CreditFreezeRecord> CreditFreezeRecords { get; set; }
    public DbSet<ReviewRecord> ReviewRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Dealer>()
            .HasOne(d => d.CreditLimit)
            .WithOne(c => c.Dealer)
            .HasForeignKey<CreditLimit>(c => c.DealerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Dealer>()
            .HasMany(d => d.Debts)
            .WithOne(d => d.Dealer)
            .HasForeignKey(d => d.DealerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Dealer>()
            .HasMany(d => d.Orders)
            .WithOne(o => o.Dealer)
            .HasForeignKey(o => o.DealerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasMany(o => o.Histories)
            .WithOne(h => h.Order)
            .HasForeignKey(h => h.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasMany(o => o.CreditFreezeRecords)
            .WithOne(f => f.Order)
            .HasForeignKey(f => f.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.ReviewRecord)
            .WithOne(r => r.Order)
            .HasForeignKey<ReviewRecord>(r => r.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProductPricePolicy>()
            .HasOne(pp => pp.PricePolicy)
            .WithMany(p => p.ProductPricePolicies)
            .HasForeignKey(pp => pp.PricePolicyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProductPricePolicy>()
            .HasOne(pp => pp.Product)
            .WithMany(p => p.ProductPricePolicies)
            .HasForeignKey(pp => pp.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Debt>()
            .HasOne(d => d.RelatedOrder)
            .WithMany()
            .HasForeignKey(d => d.RelatedOrderId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<CreditFreezeRecord>()
            .HasOne(f => f.Dealer)
            .WithMany()
            .HasForeignKey(f => f.DealerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .HasIndex(o => o.OrderNo)
            .IsUnique();

        modelBuilder.Entity<Dealer>()
            .Property(d => d.Level)
            .HasConversion<string>();

        modelBuilder.Entity<Order>()
            .Property(o => o.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Order>()
            .Property(o => o.ExceptionType)
            .HasConversion<string>();

        modelBuilder.Entity<OrderHistory>()
            .Property(h => h.FromStatus)
            .HasConversion<string>();

        modelBuilder.Entity<OrderHistory>()
            .Property(h => h.ToStatus)
            .HasConversion<string>();

        modelBuilder.Entity<OrderHistory>()
            .Property(h => h.OperationRole)
            .HasConversion<string>();

        modelBuilder.Entity<ReviewRecord>()
            .Property(r => r.ExceptionType)
            .HasConversion<string>();

        modelBuilder.Entity<ReviewRecord>()
            .Property(r => r.Status)
            .HasConversion<string>();

        modelBuilder.Entity<PricePolicy>()
            .Property(p => p.ApplicableLevel)
            .HasConversion<string>();
    }
}
