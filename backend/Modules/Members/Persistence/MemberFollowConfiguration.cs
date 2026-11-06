using backend.Modules.Members.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Members.Persistence;

public sealed class MemberFollowConfiguration : IEntityTypeConfiguration<MemberFollow>
{
    public void Configure(EntityTypeBuilder<MemberFollow> entity)
    {
        entity.ToTable("MemberFollows");
        entity.HasKey(e => new { e.FollowerMemberId, e.FollowingMemberId });
        entity.HasIndex(e => e.FollowingMemberId);
        entity.HasIndex(e => e.FollowerMemberId);

        entity.HasOne<Member>()
            .WithMany()
            .HasForeignKey(e => e.FollowerMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne<Member>()
            .WithMany()
            .HasForeignKey(e => e.FollowingMemberId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
