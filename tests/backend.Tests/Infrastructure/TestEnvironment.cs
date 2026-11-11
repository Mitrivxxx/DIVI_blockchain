namespace backend.Tests.Infrastructure;

/// <summary>
/// Process-wide env vars read by Program.cs / JwtService / PinataClient before the
/// WebApplicationFactory configuration hooks run.
/// </summary>
public static class TestEnvironment
{
    public const string JwtKey = "divi-tests-signing-key-0123456789abcdef";
    public const string JwtIssuer = "DIVI-tests";
    public const string JwtAudience = "DIVI-tests";

    public static void Apply()
    {
        Environment.SetEnvironmentVariable("JWT_KEY", JwtKey);
        Environment.SetEnvironmentVariable("JWT_ISSUER", JwtIssuer);
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", JwtAudience);
        Environment.SetEnvironmentVariable("PINATA_JWT", "test-pinata-jwt");
        Environment.SetEnvironmentVariable("ConnectionStrings__divi", "Host=localhost;Database=divi_tests_unused");
        Environment.SetEnvironmentVariable("Blockchain__RpcUrl", "http://localhost:8545");
        Environment.SetEnvironmentVariable(
            "Blockchain__PrivateKey",
            "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
        Environment.SetEnvironmentVariable(
            "Blockchain__ContractAddress",
            "0x0000000000000000000000000000000000000001");
    }
}
