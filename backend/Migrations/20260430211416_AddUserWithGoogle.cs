using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserWithGoogle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GoogleSub",
                table: "Members",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Members",
                keyColumn: "Id",
                keyValue: 2,
                column: "GoogleSub",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Members_GoogleSub",
                table: "Members",
                column: "GoogleSub",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Members_GoogleSub",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "GoogleSub",
                table: "Members");
        }
    }
}
