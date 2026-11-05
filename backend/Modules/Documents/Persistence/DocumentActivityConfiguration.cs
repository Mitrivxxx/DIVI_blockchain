using backend.Modules.Documents.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Documents.Persistence;

public sealed class DocumentActivityConfiguration : IEntityTypeConfiguration<DocumentActivity>
{
    public void Configure(EntityTypeBuilder<DocumentActivity> entity)
    {
        entity.ToTable("DocumentActivities");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.DocumentHash).IsRequired().HasMaxLength(66);
        entity.Property(e => e.TxHash).HasMaxLength(66);

        entity.HasIndex(e => e.DocumentHash);
        entity.HasIndex(e => e.MemberId);
        entity.HasIndex(e => e.CreatedAt);
    }
}
