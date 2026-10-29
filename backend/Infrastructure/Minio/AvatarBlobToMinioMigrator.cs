using System.Data;
using System.Data.Common;
using backend.Services.GetProfile;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Infrastructure.Minio;

/// <summary>
/// One-shot: if Members still has AvatarData, upload bytes to MinIO and set AvatarUrl
/// before the EF migration drops those columns.
/// </summary>
public static class AvatarBlobToMinioMigrator
{
    public static async Task MigrateIfNeededAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IMinioObjectStorage>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<MinioObjectStorage>>();

        await using var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        if (!await ColumnExistsAsync(connection, "Members", "AvatarData", cancellationToken))
        {
            return;
        }

        logger.LogInformation("Migrating AvatarData blobs to MinIO before column drop…");

        await using var cmd = connection.CreateCommand();
        cmd.CommandText = """
            SELECT "Id", "AvatarData", "AvatarContentType"
            FROM "Members"
            WHERE "AvatarData" IS NOT NULL AND octet_length("AvatarData") > 0
            """;

        var rows = new List<(int Id, byte[] Data, string ContentType)>();
        await using (var reader = await cmd.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                var id = reader.GetInt32(0);
                var data = (byte[])reader.GetValue(1);
                var contentType = reader.IsDBNull(2) ? "image/jpeg" : reader.GetString(2);
                rows.Add((id, data, contentType));
            }
        }

        foreach (var (id, data, contentType) in rows)
        {
            try
            {
                var url = await UploadAndSetUrlAsync(connection, storage, id, data, contentType, cancellationToken);
                logger.LogInformation("Migrated AvatarData for member {MemberId} → {Url}", id, url);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to migrate AvatarData for member {MemberId}", id);
            }
        }

        // Also pick up leftover local files under Data/avatars/{memberId}.*
        await MigrateLocalFilesIfNeededAsync(connection, storage, logger, cancellationToken);
    }

    private static async Task MigrateLocalFilesIfNeededAsync(
        DbConnection connection,
        IMinioObjectStorage storage,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "Data", "avatars"),
            Path.Combine(AppContext.BaseDirectory, "Data", "avatars"),
        };

        foreach (var dir in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (!Directory.Exists(dir))
            {
                continue;
            }

            foreach (var path in Directory.EnumerateFiles(dir))
            {
                var name = Path.GetFileNameWithoutExtension(path);
                if (!int.TryParse(name, out var memberId))
                {
                    continue;
                }

                var ext = Path.GetExtension(path).ToLowerInvariant();
                var contentType = ext switch
                {
                    ".png" => "image/png",
                    ".webp" => "image/webp",
                    _ => "image/jpeg",
                };

                try
                {
                    var bytes = await File.ReadAllBytesAsync(path, cancellationToken);
                    var url = await UploadAndSetUrlAsync(connection, storage, memberId, bytes, contentType, cancellationToken);
                    logger.LogInformation("Migrated local avatar file {Path} → {Url}", path, url);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to migrate local avatar file {Path}", path);
                }
            }
        }
    }

    private static async Task<string> UploadAndSetUrlAsync(
        DbConnection connection,
        IMinioObjectStorage storage,
        int memberId,
        byte[] data,
        string contentType,
        CancellationToken cancellationToken)
    {
        await storage.DeleteObjectsByPrefixAsync(AvatarObjectKeys.Prefix(memberId), cancellationToken);
        await using var stream = new MemoryStream(data);
        var url = await storage.PutObjectAsync(
            AvatarObjectKeys.ForMember(memberId, contentType),
            stream,
            contentType,
            cancellationToken);

        await using var update = connection.CreateCommand();
        update.CommandText = """UPDATE "Members" SET "AvatarUrl" = @url WHERE "Id" = @id""";
        var urlParam = update.CreateParameter();
        urlParam.ParameterName = "url";
        urlParam.Value = url;
        update.Parameters.Add(urlParam);
        var idParam = update.CreateParameter();
        idParam.ParameterName = "id";
        idParam.Value = memberId;
        update.Parameters.Add(idParam);
        await update.ExecuteNonQueryAsync(cancellationToken);
        return url;
    }

    private static async Task<bool> ColumnExistsAsync(
        DbConnection connection,
        string table,
        string column,
        CancellationToken cancellationToken)
    {
        await using var cmd = connection.CreateCommand();
        cmd.CommandText = """
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = @table
              AND column_name = @column
            LIMIT 1
            """;
        var tableParam = cmd.CreateParameter();
        tableParam.ParameterName = "table";
        tableParam.Value = table;
        cmd.Parameters.Add(tableParam);
        var columnParam = cmd.CreateParameter();
        columnParam.ParameterName = "column";
        columnParam.Value = column;
        cmd.Parameters.Add(columnParam);

        var result = await cmd.ExecuteScalarAsync(cancellationToken);
        return result is not null && result is not DBNull;
    }
}
