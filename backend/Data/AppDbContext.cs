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
        public DbSet<Document> Documents { get; set; }
        public DbSet<DocumentActivity> DocumentActivities { get; set; }
        public DbSet<IssuerProfile> IssuerProfiles { get; set; }

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
                    new MemberRole { Id = 3, Name = "user" },
                    new MemberRole { Id = 4, Name = "owner" }
                );
            });

            modelBuilder.Entity<Nonce>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Address).IsRequired().HasMaxLength(42);
                entity.Property(e => e.Value).IsRequired();
                entity.Property(e => e.ExpiresAt).IsRequired();
            });

            modelBuilder.Entity<IssuerApplication>(entity =>
            {
                entity.HasKey(e => e.Id);

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
                entity.HasIndex(u => u.GoogleSub).IsUnique();
                // Multiple NULLs allowed (Web3-only members); non-null emails must be unique.
                entity.HasIndex(u => u.Email).IsUnique();

                // Platform owner — address must match Blockchain__PrivateKey / contract deployer
                // (derived from .env.example SEPOLIA_PRIVATE_KEY).
                entity.HasData(new Member
                {
                  Id = 2,
                  EthereumAddress = "0x3590E41e29F2626B262A16225a207AaB33dBf782",
                  MemberRoleId = 4,
                  CreatedAt = new System.DateTime(2026, 3, 6, 0, 21, 35, 566, System.DateTimeKind.Utc).AddTicks(2560)
                });
            });

            modelBuilder.Entity<Document>(entity =>
            {
                entity.ToTable("Documents");
                entity.HasKey(e => e.Hash);
                entity.Property(e => e.Hash).HasMaxLength(66);
                entity.Property(e => e.Cid).IsRequired().HasMaxLength(128);
                entity.Property(e => e.IssuerAddress).IsRequired().HasMaxLength(42);
                entity.Property(e => e.OwnerAddress).IsRequired().HasMaxLength(42);
                entity.Property(e => e.TxHash).IsRequired().HasMaxLength(66);
                entity.Property(e => e.ShareToken).HasMaxLength(64);
                entity.Property(e => e.Title).HasMaxLength(256);

                entity.HasIndex(e => e.OwnerAddress);
                entity.HasIndex(e => e.IssuerAddress);
                entity.HasIndex(e => e.IssuedByMemberId);
                entity.HasIndex(e => e.ShareToken)
                    .IsUnique()
                    .HasFilter("\"ShareToken\" IS NOT NULL");

                entity.HasOne(e => e.IssuedByMember)
                    .WithMany()
                    .HasForeignKey(e => e.IssuedByMemberId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<DocumentActivity>(entity =>
            {
                entity.ToTable("DocumentActivities");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DocumentHash).IsRequired().HasMaxLength(66);
                entity.Property(e => e.TxHash).HasMaxLength(66);

                entity.HasIndex(e => e.DocumentHash);
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.CreatedAt);

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<IssuerProfile>(entity =>
            {
                entity.ToTable("IssuerProfiles");
                entity.HasKey(e => e.MemberId);
                entity.Property(e => e.InstitutionName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.LogoUrl).HasMaxLength(512);
                entity.Property(e => e.WebsiteUrl).HasMaxLength(512);
                entity.Property(e => e.Country).HasMaxLength(64);
                entity.Property(e => e.TaxId).HasMaxLength(32);

                entity.HasOne(e => e.Member)
                    .WithOne()
                    .HasForeignKey<IssuerProfile>(e => e.MemberId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }

}
