using System.ComponentModel.DataAnnotations;

namespace backend.Infrastructure.Configuration;

public sealed class DatabaseOptions
{
    [Required]
    public string Host { get; init; } = string.Empty;

    [Range(1, 65535)]
    public int Port { get; init; }

    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string Username { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;

    public string BuildConnectionString()
    {
        return $"Host={Host};Port={Port};Database={Name};Username={Username};Password={Password}";
    }
}