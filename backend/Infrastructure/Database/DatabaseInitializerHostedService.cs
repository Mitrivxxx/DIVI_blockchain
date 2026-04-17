using backend.Infrastructure.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace backend.Infrastructure.Database;

public sealed class DatabaseInitializerHostedService : IHostedService
{
    private readonly DatabaseOptions _databaseOptions;

    public DatabaseInitializerHostedService(IOptions<DatabaseOptions> databaseOptions)
    {
        _databaseOptions = databaseOptions.Value;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var connectionString = _databaseOptions.BuildConnectionString();
        await PostgresDatabaseInitializer.EnsureDatabaseExistsAsync(connectionString, cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}