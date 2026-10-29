using System.ComponentModel.DataAnnotations;

namespace backend.Infrastructure.Configuration;

public sealed class PinataOptions
{
    [Required]
    public string BaseUrl { get; init; } = string.Empty;

    [Required]
    public string PinFileEndpoint { get; init; } = string.Empty;

    /// <summary>Public IPFS gateway base ending with /ipfs/ (used to fetch content for preview).</summary>
    public string GatewayUrl { get; init; } = "https://gateway.pinata.cloud/ipfs/";
}