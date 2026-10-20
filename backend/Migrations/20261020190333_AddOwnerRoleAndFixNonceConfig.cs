using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerRoleAndFixNonceConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "MemberRoles",
                columns: new[] { "Id", "Name" },
                values: new object[] { 4, "owner" });

            migrationBuilder.UpdateData(
                table: "Members",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "EthereumAddress", "MemberRoleId" },
                values: new object[] { "0x3590E41e29F2626B262A16225a207AaB33dBf782", 4 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MemberRoles",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.UpdateData(
                table: "Members",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "EthereumAddress", "MemberRoleId" },
                values: new object[] { "0xeb2a27c7c6E72BC5022a49c4e044E72ab70E9bDb", 1 });
        }
    }
}
