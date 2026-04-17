namespace backend.Infrastructure.Configuration;

public sealed class CorsOptions
{
    public const string SectionName = "Cors";

    private static readonly string[] DefaultAllowedOrigins = ["http://localhost:3000"];

    public string[] AllowedOrigins { get; init; } = ["http://localhost:3000"];

    public static string[] ResolveAllowedOrigins(IConfiguration configuration)
    {
        var devOrigin = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGIN_DEV");
        var prodOrigin = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGIN_PROD");

        var envOrigins = new[] { devOrigin, prodOrigin }
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .ToArray();

        if (envOrigins.Length > 0)
        {
            return envOrigins;
        }

        return configuration.GetSection(SectionName).Get<CorsOptions>()?.AllowedOrigins
            ?? DefaultAllowedOrigins;
    }
}