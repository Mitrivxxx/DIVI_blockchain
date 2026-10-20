using backend.Data;
using backend.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace backend.Infrastructure.Database;

public sealed class DatabaseInitializerHostedService : IHostedService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;

    public DatabaseInitializerHostedService(IConfiguration configuration, IServiceProvider serviceProvider)
    {
        _configuration = configuration;
        _serviceProvider = serviceProvider;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var connectionString = ServiceCollectionExtensions.ResolvePostgresConnectionString(_configuration, _serviceProvider);
        await PostgresDatabaseInitializer.EnsureDatabaseExistsAsync(connectionString, cancellationToken);

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
