using System.Collections.Concurrent;
using backend.DTOs;
using backend.Services.Blockchain;

namespace backend.Tests.Infrastructure.Fakes;

/// <summary>In-memory stand-in for the DocumentIssuer contract.</summary>
public sealed class FakeBlockchainService : IBlockchainService
{
    public const string HotWalletAddress = "0x00000000000000000000000000000000000000aa";
    public const string NetworkName = "divi-testnet";

    private const byte StatusConfirmed = 1;
    private const byte StatusRevoked = 2;

    private readonly ConcurrentDictionary<string, (byte Status, string TxHash, long Block, DateTimeOffset At)> _documents =
        new(StringComparer.OrdinalIgnoreCase);

    private long _blockNumber = 1_000;

    public ConcurrentDictionary<string, byte> Issuers { get; } = new(StringComparer.OrdinalIgnoreCase);

    public ConcurrentDictionary<string, byte> Admins { get; } = new(StringComparer.OrdinalIgnoreCase);

    public Task PrecheckIssueDocumentAsync(string hash, string owner, byte documentType)
    {
        if (_documents.ContainsKey(hash))
        {
            throw new InvalidOperationException("Document already issued");
        }

        return Task.CompletedTask;
    }

    public Task<IssueTransactionResultDto> IssueDocumentAsync(string hash, string cid, string owner, byte documentType)
    {
        var block = Interlocked.Increment(ref _blockNumber);
        var txHash = NewTxHash();
        var at = DateTimeOffset.UtcNow;
        _documents[hash] = (StatusConfirmed, txHash, block, at);

        return Task.FromResult(new IssueTransactionResultDto
        {
            TxHash = txHash,
            BlockNumber = block,
            BlockTimestamp = at,
            IssuerAddress = HotWalletAddress,
        });
    }

    public string GetBackendAccountAddress() => HotWalletAddress;

    public Task<bool> VerifyDocumentAsync(string hash) =>
        Task.FromResult(_documents.TryGetValue(hash, out var doc) && doc.Status == StatusConfirmed);

    public Task<bool> DocumentExistsAsync(string hash) => Task.FromResult(_documents.ContainsKey(hash));

    public Task<byte?> GetDocumentStatusAsync(string hash) =>
        Task.FromResult(_documents.TryGetValue(hash, out var doc) ? doc.Status : (byte?)null);

    public Task<List<object>> GetDocumentAsync(string hash) => Task.FromResult(new List<object>());

    public Task<string> RevokeDocumentAsync(string hash)
    {
        if (!_documents.TryGetValue(hash, out var doc))
        {
            throw new InvalidOperationException("Document not found");
        }

        _documents[hash] = doc with { Status = StatusRevoked };
        return Task.FromResult(NewTxHash());
    }

    public Task<BlockchainTransactionInfoDto?> GetDocumentBlockchainInfoAsync(string hash)
    {
        if (!_documents.TryGetValue(hash, out var doc))
        {
            return Task.FromResult<BlockchainTransactionInfoDto?>(null);
        }

        return Task.FromResult<BlockchainTransactionInfoDto?>(new BlockchainTransactionInfoDto
        {
            TransactionHash = doc.TxHash,
            BlockNumber = doc.Block,
            BlockTimestamp = doc.At,
            NetworkName = NetworkName,
        });
    }

    public Task<string> GetNetworkNameAsync() => Task.FromResult(NetworkName);

    public Task<List<OwnerDocumentInfoDto>> GetDocumentsByOwnerAsync(string ownerAddress) =>
        Task.FromResult(new List<OwnerDocumentInfoDto>());

    public Task<string> AddIssuerAsync(string issuerAddress)
    {
        Issuers[issuerAddress] = 1;
        return Task.FromResult(NewTxHash());
    }

    public Task<string> RemoveIssuerAsync(string issuerAddress)
    {
        Issuers.TryRemove(issuerAddress, out _);
        return Task.FromResult(NewTxHash());
    }

    public Task<string> AddAdminAsync(string adminAddress)
    {
        Admins[adminAddress] = 1;
        return Task.FromResult(NewTxHash());
    }

    public Task<string> RemoveAdminAsync(string adminAddress)
    {
        Admins.TryRemove(adminAddress, out _);
        return Task.FromResult(NewTxHash());
    }

    public Task<bool> IsIssuerAsync(string address) => Task.FromResult(Issuers.ContainsKey(address));

    public Task<bool> IsAdminAsync(string address) => Task.FromResult(Admins.ContainsKey(address));

    private static string NewTxHash() => "0x" + Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
}
