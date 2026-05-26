using System.ComponentModel.DataAnnotations;

namespace backend.Infrastructure.Configuration;

public sealed class BlockchainOptions
{
    [Required]
    public string RpcUrl { get; init; } = string.Empty;

    [Required]
    public string PrivateKey { get; init; } = string.Empty;

    [Required]
    public string ContractAddress { get; init; } = string.Empty;
}