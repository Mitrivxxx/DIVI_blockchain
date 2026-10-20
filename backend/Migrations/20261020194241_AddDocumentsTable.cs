using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Hash = table.Column<string>(type: "character varying(66)", maxLength: 66, nullable: false),
                    Cid = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    IssuerAddress = table.Column<string>(type: "character varying(42)", maxLength: 42, nullable: false),
                    OwnerAddress = table.Column<string>(type: "character varying(42)", maxLength: 42, nullable: false),
                    IssuedByMemberId = table.Column<int>(type: "integer", nullable: true),
                    DocumentType = table.Column<byte>(type: "smallint", nullable: false),
                    TxHash = table.Column<string>(type: "character varying(66)", maxLength: 66, nullable: false),
                    BlockNumber = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<byte>(type: "smallint", nullable: false),
                    IssuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Hash);
                    table.ForeignKey(
                        name: "FK_Documents_Members_IssuedByMemberId",
                        column: x => x.IssuedByMemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Documents_IssuedByMemberId",
                table: "Documents",
                column: "IssuedByMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_IssuerAddress",
                table: "Documents",
                column: "IssuerAddress");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_OwnerAddress",
                table: "Documents",
                column: "OwnerAddress");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Documents");
        }
    }
}
