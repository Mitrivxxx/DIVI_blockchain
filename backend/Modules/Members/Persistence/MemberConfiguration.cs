using backend.BuildingBlocks;
using backend.Modules.Members.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Members.Persistence;

public sealed class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> entity)
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
            MemberRoleId = MemberRoles.OwnerId,
            CreatedAt = new DateTime(2026, 3, 6, 0, 21, 35, 566, DateTimeKind.Utc).AddTicks(2560)
        });
    }
}
