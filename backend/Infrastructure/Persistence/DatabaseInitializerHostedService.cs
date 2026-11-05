using backend.Host;
using backend.Infrastructure.Minio;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Persistence;

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

        foreach (var step in _serviceProvider.GetServices<IPreMigrationStep>())
        {
            try
            {
                await step.RunAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Pre-migration step {Step} skipped or failed.", step.GetType().Name);
            }
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
