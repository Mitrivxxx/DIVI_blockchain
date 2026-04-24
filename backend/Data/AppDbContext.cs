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
        public DbSet<MemberRole> MemberRoles { get; set; }
        public DbSet<BlacklistedToken> BlacklistedTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MemberRole>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name)
                      .IsRequired()
                      .HasMaxLength(32);

                entity.HasData(
                    new MemberRole { Id = 1, Name = "admin" },
                    new MemberRole { Id = 2, Name = "issuer" },
                    new MemberRole { Id = 3, Name = "user" }
                );
            });

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
                entity.Property(e => e.Password)
                    .HasMaxLength(255);
                entity.Property(e => e.EthereumAddress)
                    .HasMaxLength(42);
                entity.Property(e => e.Email)
                    .HasMaxLength(255);
                entity.HasOne(e => e.Role)
                    .WithMany(e => e.Members)
                    .HasForeignKey(e => e.MemberRoleId)
                    .IsRequired();

                entity.HasData(new Member
                {
                  Id = 2,
                  EthereumAddress = "0xeb2a27c7c6E72BC5022a49c4e044E72ab70E9bDb",
                  MemberRoleId = 1,
                  CreatedAt = new System.DateTime(2026, 3, 6, 0, 21, 35, 566, System.DateTimeKind.Utc).AddTicks(2560)
                });
            });
        }
    }

}