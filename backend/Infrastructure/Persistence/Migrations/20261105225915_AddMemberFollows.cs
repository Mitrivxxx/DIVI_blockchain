using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberFollows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MemberFollows",
                columns: table => new
                {
                    FollowerMemberId = table.Column<int>(type: "integer", nullable: false),
                    FollowingMemberId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberFollows", x => new { x.FollowerMemberId, x.FollowingMemberId });
                    table.ForeignKey(
                        name: "FK_MemberFollows_Members_FollowerMemberId",
                        column: x => x.FollowerMemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberFollows_Members_FollowingMemberId",
                        column: x => x.FollowingMemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemberFollows_FollowerMemberId",
                table: "MemberFollows",
                column: "FollowerMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberFollows_FollowingMemberId",
                table: "MemberFollows",
                column: "FollowingMemberId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MemberFollows");
        }
    }
}
