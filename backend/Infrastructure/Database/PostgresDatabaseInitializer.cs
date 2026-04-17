using Npgsql;

namespace backend.Infrastructure.Database;

public static class PostgresDatabaseInitializer
{
    public static async Task EnsureDatabaseExistsAsync(string connectionString, CancellationToken cancellationToken = default)
    {
        var targetConnectionString = new NpgsqlConnectionStringBuilder(connectionString)
        {
            Database = "postgres"
        };

        var targetDatabaseName = new NpgsqlConnectionStringBuilder(connectionString).Database;

        await using var connection = new NpgsqlConnection(targetConnectionString.ConnectionString);
        await connection.OpenAsync(cancellationToken);

        await using var existsCommand = new NpgsqlCommand("SELECT 1 FROM pg_database WHERE datname = @databaseName", connection);
        existsCommand.Parameters.AddWithValue("databaseName", targetDatabaseName);

        var databaseExists = await existsCommand.ExecuteScalarAsync(cancellationToken);
        if (databaseExists is not null)
        {
            return;
        }

        var createDatabaseCommandText = $"CREATE DATABASE {QuoteIdentifier(targetDatabaseName)}";
        await using var createCommand = new NpgsqlCommand(createDatabaseCommandText, connection);
        await createCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string QuoteIdentifier(string identifier)
    {
        return "\"" + identifier.Replace("\"", "\"\"") + "\"";
    }
}