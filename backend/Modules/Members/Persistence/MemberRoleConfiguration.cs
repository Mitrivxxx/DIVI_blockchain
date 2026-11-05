using backend.BuildingBlocks;
using backend.Modules.Members.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Members.Persistence;

public sealed class MemberRoleConfiguration : IEntityTypeConfiguration<MemberRole>
{
    public void Configure(EntityTypeBuilder<MemberRole> entity)
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Name)
              .IsRequired()
              .HasMaxLength(32);

        entity.HasData(
            new MemberRole { Id = MemberRoles.AdminId, Name = MemberRoles.Admin },
            new MemberRole { Id = MemberRoles.IssuerId, Name = MemberRoles.Issuer },
            new MemberRole { Id = MemberRoles.UserId, Name = MemberRoles.User },
            new MemberRole { Id = MemberRoles.OwnerId, Name = MemberRoles.Owner }
        );
    }
}
