using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class DropMemberAvatarBlobColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarContentType",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "AvatarData",
                table: "Members");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarContentType",
                table: "Members",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "AvatarData",
                table: "Members",
                type: "bytea",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Members",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "AvatarContentType", "AvatarData" },
                values: new object[] { null, null });
        }
    }
}
