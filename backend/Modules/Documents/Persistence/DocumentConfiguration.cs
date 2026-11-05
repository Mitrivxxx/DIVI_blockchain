using backend.Modules.Documents.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Documents.Persistence;

public sealed class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> entity)
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
    }
}
