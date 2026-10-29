using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentActivities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DocumentActivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DocumentHash = table.Column<string>(type: "character varying(66)", maxLength: 66, nullable: false),
                    ActivityType = table.Column<byte>(type: "smallint", nullable: false),
                    TxHash = table.Column<string>(type: "character varying(66)", maxLength: 66, nullable: true),
                    BlockNumber = table.Column<long>(type: "bigint", nullable: true),
                    MemberId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentActivities_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentActivities_CreatedAt",
                table: "DocumentActivities",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentActivities_DocumentHash",
                table: "DocumentActivities",
                column: "DocumentHash");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentActivities_MemberId",
                table: "DocumentActivities",
                column: "MemberId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentActivities");
        }
    }
}
