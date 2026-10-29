using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentVisibilityAndShareToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ShareToken",
                table: "Documents",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Visibility",
                table: "Documents",
                type: "smallint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ShareToken",
                table: "Documents",
                column: "ShareToken",
                unique: true,
                filter: "\"ShareToken\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Documents_ShareToken",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ShareToken",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Visibility",
                table: "Documents");
        }
    }
}
