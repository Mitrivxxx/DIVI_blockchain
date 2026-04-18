using System.ComponentModel.DataAnnotations;

namespace backend.Infrastructure.Configuration;

public sealed class PinataOptions
{
    [Required]
    public string BaseUrl { get; init; } = string.Empty;

    [Required]
    public string PinFileEndpoint { get; init; } = string.Empty;
}