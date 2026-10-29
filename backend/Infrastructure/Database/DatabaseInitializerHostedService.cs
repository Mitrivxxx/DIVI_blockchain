using backend.Data;
using backend.Extensions;
using backend.Infrastructure.Minio;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace backend.Infrastructure.Database;

public sealed class DatabaseInitializerHostedService : IHostedService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseInitializerHostedService> _logger;

    public DatabaseInitializerHostedService(
        IConfiguration configuration,
        IServiceProvider serviceProvider,
        ILogger<DatabaseInitializerHostedService> logger)
    {
        _configuration = configuration;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var connectionString = ServiceCollectionExtensions.ResolvePostgresConnectionString(_configuration, _serviceProvider);
        await PostgresDatabaseInitializer.EnsureDatabaseExistsAsync(connectionString, cancellationToken);

        // Move legacy AvatarData → MinIO while columns still exist, then EF drops them.
        try
        {
            await AvatarBlobToMinioMigrator.MigrateIfNeededAsync(_serviceProvider, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Avatar MinIO pre-migration skipped or failed (MinIO may be unavailable).");
        }

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync(cancellationToken);

        try
        {
            var storage = scope.ServiceProvider.GetRequiredService<IMinioObjectStorage>();
            await storage.EnsureBucketReadyAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "MinIO bucket ensure failed at startup — avatar uploads will retry on demand.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
