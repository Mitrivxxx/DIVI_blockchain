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

var minioAccessKey = EnvOr("MINIO_ACCESS_KEY", EnvOr("Minio__AccessKey", "minioadmin"));
var minioSecretKey = EnvOr("MINIO_SECRET_KEY", EnvOr("Minio__SecretKey", "minioadmin"));
var minioBucket = EnvOr("MINIO_BUCKET", EnvOr("Minio__Bucket", "divi-avatars"));
var minioPublicBaseUrl = EnvOr("MINIO_PUBLIC_BASE_URL", EnvOr("Minio__PublicBaseUrl", "http://localhost:9000"));

// Official minio/minio + quay.io/minio were pulled from public registries (401/denied).
// soldevelo/minio is a community MinIO build (Bitnami-compatible layout) still on Docker Hub.
var minio = builder.AddContainer("minio", "soldevelo/minio", "2024.12.18")
    .WithHttpEndpoint(port: 9000, targetPort: 9000, name: "api", isProxied: false)
    .WithHttpEndpoint(port: 9001, targetPort: 9001, name: "console", isProxied: false)
    .WithEnvironment("MINIO_ROOT_USER", minioAccessKey)
    .WithEnvironment("MINIO_ROOT_PASSWORD", minioSecretKey)
    .WithEnvironment("MINIO_DEFAULT_BUCKETS", minioBucket)
    // Named Docker volume — survives Aspire stop/start (containers themselves are ephemeral).
    .WithVolume("divi-aspire-minio", "/bitnami/minio/data");

// Do not WaitFor(minio): auth/API must start even if avatar storage is down.
var backend = builder.AddProject<Projects.backend>("backend")
    .WithReference(database)
    .WaitFor(database)
    // Stable host port so auth cookies and VITE_API_URL survive AppHost restarts.
    .WithHttpEndpoint(port: 5021, name: "http", isProxied: false)
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_URLS", "http://127.0.0.1:5021")
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
    .WithEnvironment("Minio__Endpoint", "localhost:9000")
    .WithEnvironment("Minio__AccessKey", minioAccessKey)
    .WithEnvironment("Minio__SecretKey", minioSecretKey)
    .WithEnvironment("Minio__Bucket", minioBucket)
    .WithEnvironment("Minio__PublicBaseUrl", minioPublicBaseUrl)
    .WithEnvironment("Minio__UseSsl", "false")
    .WithEnvironment("CORS_ALLOWED_ORIGIN_DEV", EnvOr("CORS_ALLOWED_ORIGIN_DEV", "http://localhost:3000"))
    .WithEnvironment("CORS_ALLOWED_ORIGIN_PROD", EnvOr("CORS_ALLOWED_ORIGIN_PROD", "http://localhost:8080"))
    .WithExternalHttpEndpoints();

var frontendDir = Path.Combine(repoRoot, "frontend");

builder.AddViteApp("frontend", frontendDir)
    .WithReference(backend)
    .WaitFor(backend)
    .WithEnvironment("VITE_PROXY_TARGET", "http://localhost:5021")
    // Stable backend URL so httpOnly auth cookies survive Aspire restarts.
    .WithEnvironment("VITE_API_URL", "http://localhost:5021")
    .WithEnvironment("PORT", "3000")
    .WithEnvironment("BLOCKCHAIN_CONTRACT_ADDRESS", EnvOr("BLOCKCHAIN_CONTRACT_ADDRESS", ""))
    .WithExternalHttpEndpoints();

builder.Build().Run();
