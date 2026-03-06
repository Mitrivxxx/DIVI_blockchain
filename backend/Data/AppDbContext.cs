using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<IssuerApplication> IssuerApplications { get; set; }
        public DbSet<Nonce> Nonces { get; set; }
        public DbSet<Member> Members { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<IssuerApplication>(entity =>
            {
                entity.HasKey(e => e.Id);
                modelBuilder.Entity<Nonce>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Address).IsRequired().HasMaxLength(42);
                entity.Property(e => e.Value).IsRequired();
                entity.Property(e => e.ExpiresAt).IsRequired();
            });

                entity.Property(e => e.Status)
                      .HasConversion<string>()
                      .IsRequired();

                entity.Property(e => e.InstitutionName)
                      .IsRequired()
                      .HasMaxLength(255);

                entity.Property(e => e.EthereumAddress)
                      .IsRequired()
                      .HasMaxLength(42);

                entity.Property(e => e.Email)
                      .IsRequired()
                      .HasMaxLength(255);
            });

            modelBuilder.Entity<Member>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.CreatedAt)
              .HasDefaultValueSql("CURRENT_TIMESTAMP");

        entity.HasData(new Member
        {
            Id = 2,
            EthereumAddress = "0xeb2a27c7c6E72BC5022a49c4e044E72ab70E9bDb",
            Role = MemberRole.Admin,
            CreatedAt = new System.DateTime(2026, 3, 6, 0, 21, 35, 566, System.DateTimeKind.Utc).AddTicks(2560)
        });
    });
        }
    }

}