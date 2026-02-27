using Microsoft.EntityFrameworkCore;    
using backend.Models;

namespace backend.Data
{
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<IssuerApplication> IssuerApplications { get; set; }
    public DbSet<Admin> Admin { get; set; }

    public DbSet<Nonce> Nonces { get; set; }

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
    }
}

}