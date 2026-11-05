using backend.Modules.Issuers.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Issuers.Persistence;

public sealed class IssuerProfileConfiguration : IEntityTypeConfiguration<IssuerProfile>
{
    public void Configure(EntityTypeBuilder<IssuerProfile> entity)
    {
        entity.ToTable("IssuerProfiles");
        entity.HasKey(e => e.MemberId);
        entity.Property(e => e.InstitutionName).IsRequired().HasMaxLength(255);
        entity.Property(e => e.Description).HasMaxLength(500);
        entity.Property(e => e.LogoUrl).HasMaxLength(512);
        entity.Property(e => e.WebsiteUrl).HasMaxLength(512);
        entity.Property(e => e.Country).HasMaxLength(64);
        entity.Property(e => e.TaxId).HasMaxLength(32);
    }
}
