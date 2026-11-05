using Microsoft.EntityFrameworkCore;
using backend.Modules.Identity.Domain;
using backend.Modules.Members.Domain;
using backend.Modules.Issuers.Domain;
using backend.Modules.Documents.Domain;
namespace backend.Infrastructure.Persistence
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
            // Per-module IEntityTypeConfiguration in Modules/*/Persistence.
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            // Cross-module FKs to Members: id-only, no navigation properties across modules.
            modelBuilder.Entity<Document>()
                .HasOne<Member>()
                .WithMany()
                .HasForeignKey(e => e.IssuedByMemberId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DocumentActivity>()
                .HasOne<Member>()
                .WithMany()
                .HasForeignKey(e => e.MemberId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<IssuerProfile>()
                .HasOne<Member>()
                .WithOne()
                .HasForeignKey<IssuerProfile>(e => e.MemberId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

}
