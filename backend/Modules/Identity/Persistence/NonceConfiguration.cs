using backend.Modules.Identity.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Identity.Persistence;

public sealed class NonceConfiguration : IEntityTypeConfiguration<Nonce>
{
    public void Configure(EntityTypeBuilder<Nonce> entity)
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Address).IsRequired().HasMaxLength(42);
        entity.Property(e => e.Value).IsRequired();
        entity.Property(e => e.ExpiresAt).IsRequired();
    }
}
