using backend.Data;
using backend.Infrastructure;
using backend.Infrastructure.Database;
using backend.Infrastructure.Minio;
using backend.Services.BackgroundJobs;
using backend.Services.Blockchain;
using backend.Tests.Infrastructure.Fakes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace backend.Tests.Infrastructure;

/// <summary>
/// Boots the real backend pipeline (routing, auth, DI) with an in-memory database
/// and fakes for every external system (Sepolia, Pinata, MinIO).
/// </summary>
public sealed class DiviApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"divi-tests-{Guid.NewGuid():N}";
    private readonly InMemoryDatabaseRoot _databaseRoot = new();

    static DiviApiFactory() => TestEnvironment.Apply();

    public FakeBlockchainService Blockchain { get; } = new();

    public InMemoryObjectStorage ObjectStorage { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<DbContextOptions>();
            services.AddDbContext<AppDbContext>(options => options
                .UseInMemoryDatabase(_databaseName, _databaseRoot)
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)));

            RemoveHostedService<DatabaseInitializerHostedService>(services);
            RemoveHostedService<NonceCleanupService>(services);

            services.RemoveAll<IBlockchainService>();
            services.AddSingleton<IBlockchainService>(Blockchain);

            services.RemoveAll<IMinioObjectStorage>();
            services.AddSingleton<IMinioObjectStorage>(ObjectStorage);

            services.AddHttpClient<PinataClient>()
                .ConfigurePrimaryHttpMessageHandler(() => new FakePinataHandler());
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();

        return host;
    }

    public async Task WithDbAsync(Func<AppDbContext, Task> action)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await action(db);
    }

    public async Task<T> WithDbAsync<T>(Func<AppDbContext, Task<T>> action)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await action(db);
    }

    private static void RemoveHostedService<T>(IServiceCollection services)
    {
        var descriptors = services
            .Where(d => d.ServiceType == typeof(IHostedService) && d.ImplementationType == typeof(T))
            .ToList();

        foreach (var descriptor in descriptors)
        {
            services.Remove(descriptor);
        }
    }
}
