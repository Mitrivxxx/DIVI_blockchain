using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddIssuerProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IssuerProfiles",
                columns: table => new
                {
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    InstitutionName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    WebsiteUrl = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Country = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    TaxId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IssuerProfiles", x => x.MemberId);
                    table.ForeignKey(
                        name: "FK_IssuerProfiles_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IssuerProfiles");
        }
    }
}
