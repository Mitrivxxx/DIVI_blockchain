using backend.Modules.Issuers.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Issuers.Persistence;

public sealed class IssuerApplicationConfiguration : IEntityTypeConfiguration<IssuerApplication>
{
    public void Configure(EntityTypeBuilder<IssuerApplication> entity)
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
    }
}
