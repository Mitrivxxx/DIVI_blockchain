using DotNetEnv;

var builder = DistributedApplication.CreateBuilder(args);

var repoRoot = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, "..", ".."));
var envExamplePath = Path.Combine(repoRoot, ".env.example");

if (!File.Exists(envExamplePath))
{
    throw new FileNotFoundException(
        "Missing .env.example at repo root. Aspire loads configuration from that file.",
        envExamplePath);
}

Env.Load(envExamplePath);

static string RequireEnv(string key) =>
    Environment.GetEnvironmentVariable(key)
    ?? throw new InvalidOperationException($"Missing required env var '{key}' in .env.example");

static string EnvOr(string key, string fallback) =>
    Environment.GetEnvironmentVariable(key) is { Length: > 0 } value ? value : fallback;

var dbName = EnvOr("POSTGRES_DB", "DIVI");

// Aspire owns Postgres credentials (injected via WithReference → ConnectionStrings__divi).
// Do not bind a fixed host port — 5432 is often already used by local/docker Postgres.
var postgres = builder.AddPostgres("postgres")
    .WithDataVolume("divi-aspire-postgres")
    .WithPgAdmin(pgAdmin =>
    {
        // Clickable endpoint in Aspire dashboard → opens pgAdmin in the browser.
        pgAdmin.WithHostPort(5050).WithExternalHttpEndpoints();
    });

var database = postgres.AddDatabase("divi", databaseName: dbName);

var backend = builder.AddProject<Projects.backend>("backend")
    .WithReference(database)
    .WaitFor(database)
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithEnvironment("JWT_KEY", RequireEnv("JWT_KEY"))
    .WithEnvironment("JWT_ISSUER", EnvOr("JWT_ISSUER", "DIVI"))
    .WithEnvironment("JWT_AUDIENCE", EnvOr("JWT_AUDIENCE", "DIVI"))
    .WithEnvironment("Blockchain__RpcUrl", EnvOr("Blockchain__RpcUrl", EnvOr("BLOCKCHAIN_RPC_URL", "")))
    .WithEnvironment("Blockchain__ContractAddress", EnvOr("Blockchain__ContractAddress", EnvOr("BLOCKCHAIN_CONTRACT_ADDRESS", "")))
    .WithEnvironment("Blockchain__PrivateKey", EnvOr("Blockchain__PrivateKey", EnvOr("SEPOLIA_PRIVATE_KEY", "")))
    .WithEnvironment("PINATA_JWT", EnvOr("PINATA_JWT", ""))
    .WithEnvironment("PINATA_API_KEY", EnvOr("PINATA_API_KEY", ""))
    .WithEnvironment("PINATA_API_SECRET", EnvOr("PINATA_API_SECRET", ""))
    .WithEnvironment("Google__ClientId", EnvOr("Google__ClientId", ""))
    .WithEnvironment("CORS_ALLOWED_ORIGIN_DEV", EnvOr("CORS_ALLOWED_ORIGIN_DEV", "http://localhost:3000"))
    .WithEnvironment("CORS_ALLOWED_ORIGIN_PROD", EnvOr("CORS_ALLOWED_ORIGIN_PROD", "http://localhost:8080"))
    .WithExternalHttpEndpoints();

var frontendDir = Path.Combine(repoRoot, "frontend");

builder.AddViteApp("frontend", frontendDir)
    .WithReference(backend)
    .WaitFor(backend)
    .WithEnvironment("VITE_PROXY_TARGET", backend.GetEndpoint("http"))
    .WithEnvironment("VITE_API_URL", backend.GetEndpoint("http"))
    .WithEnvironment("BLOCKCHAIN_CONTRACT_ADDRESS", EnvOr("BLOCKCHAIN_CONTRACT_ADDRESS", ""))
    .WithExternalHttpEndpoints();

builder.Build().Run();
