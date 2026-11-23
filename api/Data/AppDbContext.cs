using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using VoltCart.Api.Models;

namespace VoltCart.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Brand> Brands => Set<Brand>();

    public DbSet<User> Users => Set<User>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<CartItem> CartItems => Set<CartItem>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.Property(t => t.TokenHash).HasMaxLength(64);
            entity.Property(t => t.ReplacedByHash).HasMaxLength(64);

            entity.HasIndex(t => t.TokenHash).IsUnique();
            entity.HasIndex(t => t.FamilyId);

            // مسح المستخدم بيمسح جلساته
            entity
                .HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            // المنتج مرة واحدة في سلة العميل (الكمية بتزيد بدل ما الصف يتكرر)
            entity.HasIndex(c => new { c.UserId, c.ProductId }).IsUnique();

            entity
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(c => c.Product)
                .WithMany()
                .HasForeignKey(c => c.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(o => o.ShippingName).HasMaxLength(100);
            entity.Property(o => o.Phone).HasMaxLength(20);
            entity.Property(o => o.Address).HasMaxLength(300);
            entity.Property(o => o.City).HasMaxLength(100);
            entity.Property(o => o.Notes).HasMaxLength(500);
            entity.Property(o => o.Total).HasPrecision(18, 2);

            // سجل الطلبات بيتعرض بالأحدث أولًا لكل عميل
            entity.HasIndex(o => new { o.UserId, o.CreatedAt });

            // الطلبات سجل مالي: مسح المستخدم ما يمسحهاش
            entity
                .HasOne(o => o.User)
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(i => i.ProductName).HasMaxLength(200);
            entity.Property(i => i.ImageUrl).HasMaxLength(500);
            entity.Property(i => i.UnitPrice).HasPrecision(18, 2);

            entity
                .HasOne(i => i.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.Email).HasMaxLength(254);
            entity.Property(u => u.PasswordHash).HasMaxLength(500);
            entity.Property(u => u.FullName).HasMaxLength(100);

            // الـ Role بتتخزن كنص ("Admin") مش رقم، عشان تتقري بسهولة في الـ database
            entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);

            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(200);
            entity.Property(p => p.Sku).HasMaxLength(50);
            entity.Property(p => p.Slug).HasMaxLength(220);

            entity.Property(p => p.Price).HasPrecision(18, 2);

            var specsComparer = new ValueComparer<Dictionary<string, string>>(
                (a, b) => a!.Count == b!.Count && !a.Except(b).Any(),
                v => v.Aggregate(0, (hash, kv) => HashCode.Combine(hash, kv.Key, kv.Value)),
                v => new Dictionary<string, string>(v)
            );

            entity
                .Property(p => p.Specs)
                .HasColumnType("json")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v =>
                        JsonSerializer.Deserialize<Dictionary<string, string>>(
                            v,
                            (JsonSerializerOptions?)null
                        ) ?? new Dictionary<string, string>(),
                    specsComparer
                );

            entity.HasIndex(p => p.Slug).IsUnique();
            entity.HasIndex(p => p.Sku).IsUnique();

            entity
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(p => p.Brand)
                .WithMany(b => b.Products)
                .HasForeignKey(p => p.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(c => c.Name).HasMaxLength(100);
            entity.Property(c => c.Slug).HasMaxLength(120);

            entity.HasIndex(c => c.Slug).IsUnique();

            entity
                .HasOne(c => c.Parent)
                .WithMany(c => c.Children)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.Property(b => b.Name).HasMaxLength(100);
            entity.Property(b => b.Slug).HasMaxLength(120);

            entity.HasIndex(b => b.Name).IsUnique();
            entity.HasIndex(b => b.Slug).IsUnique();
        });
    }
}
