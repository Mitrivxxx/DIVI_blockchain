namespace backend.Infrastructure.Persistence;

/// <summary>
/// Data fix-up that must run before EF migrations (e.g. copying data out of a column a migration drops).
/// Registered by modules as singletons; failures are logged and do not block startup.
/// </summary>
public interface IPreMigrationStep
{
    Task RunAsync(CancellationToken cancellationToken);
}
