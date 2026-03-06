using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class Delete_admin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO ""Members"" (""Id"", ""AvatarUrl"", ""Bio"", ""CreatedAt"", ""Email"", ""EthereumAddress"", ""Name"", ""Role"")
                SELECT 2, NULL, NULL, TIMESTAMPTZ '2026-03-06 01:21:35.566256+01', NULL, '0xeb2a27c7c6E72BC5022a49c4e044E72ab70E9bDb', NULL, 0
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM ""Members""
                    WHERE ""Id"" = 2
                       OR lower(""EthereumAddress"") = lower('0xeb2a27c7c6E72BC5022a49c4e044E72ab70E9bDb')
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""Members""
                WHERE ""Id"" = 2
                  AND lower(""EthereumAddress"") = lower('0xeb2a27c7c6E72BC5022a49c4e044E72ab70E9bDb')
                  AND ""Role"" = 0;
            ");
        }
    }
}
