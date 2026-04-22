using backend.Data;
using backend.Infrastructure.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace backend.Infrastructure.Database;

public sealed class DatabaseInitializerHostedService : IHostedService
{
    private readonly DatabaseOptions _databaseOptions;
    private readonly IServiceProvider _serviceProvider;

    public DatabaseInitializerHostedService(IOptions<DatabaseOptions> databaseOptions, IServiceProvider serviceProvider)
    {
        _databaseOptions = databaseOptions.Value;
        _serviceProvider = serviceProvider;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var connectionString = _databaseOptions.BuildConnectionString();
        await PostgresDatabaseInitializer.EnsureDatabaseExistsAsync(connectionString, cancellationToken);

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}