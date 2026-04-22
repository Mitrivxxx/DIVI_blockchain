using System.Collections.Generic;
using System.Linq;
using backend.DTOs;
using backend.Utils;
using Nethereum.Contracts;
using Nethereum.RPC.Eth.DTOs;

namespace backend.Services.Blockchain;

public partial class BlockchainService
{
    public async Task PrecheckIssueDocumentAsync(
        string hash,
        string owner,
        byte documentType)
    {
        var function = GetIssueDocumentFunction();
        var hashBytes32 = Bytes32Helper.StringToBytes32(hash, true);
        var fromAddress = _web3.TransactionManager.Account.Address;

        // Dry-run by gas estimation to catch contract reverts before Pinata upload.
        await function.EstimateGasAsync(
            from: fromAddress,
            null,
            null,
            hashBytes32,
            "precheck",
            owner,
            documentType
        );
    }

    public async Task<string> IssueDocumentAsync(
        string hash,
        string cid,
        string owner,
        byte documentType)
    {
        var function = GetIssueDocumentFunction();
        var hashBytes32 = Bytes32Helper.StringToBytes32(hash, true);
        var fromAddress = _web3.TransactionManager.Account.Address;

        var gasEstimate = await function.EstimateGasAsync(
            from: fromAddress,
            null,
            null,
            hashBytes32,
            cid,
            owner,
            documentType
        );
        var gasWithBuffer = new Nethereum.Hex.HexTypes.HexBigInteger(gasEstimate.Value + (gasEstimate.Value / 10));

        var txHash = await function.SendTransactionAsync(
            from: fromAddress,
            gas: gasWithBuffer,
            value: null,
            functionInput: new object[]
            {
                hashBytes32,
                cid,
                owner,
                documentType
            });

        return await WaitForMinedSuccessAsync(txHash);
    }

    public async Task<bool> VerifyDocumentAsync(string hash)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("verifyDocument");
        var hashBytes32 = Bytes32Helper.StringToBytes32(hash, true);
        return await function.CallAsync<bool>(hashBytes32);
    }

    public async Task<List<object>> GetDocumentAsync(string hash)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("getDocument");
        var hashBytes32 = Bytes32Helper.StringToBytes32(hash, true);
        return await function.CallAsync<List<object>>(hashBytes32);
    }

    public async Task<BlockchainTransactionInfoDto?> GetDocumentBlockchainInfoAsync(string hash)
    {
        var documentIssuedEvent = new Event<DocumentIssuedEventDto>(_web3.Client, _contractAddress);
        var filterInput = documentIssuedEvent.CreateFilterInput(BlockParameter.CreateEarliest(), BlockParameter.CreateLatest());
        var changes = await documentIssuedEvent.GetAllChangesAsync(filterInput);

        var normalizedHash = NormalizeHex(hash);
        var matchingEvent = changes.LastOrDefault(change => NormalizeHex(Bytes32Helper.BytesToHexString(change.Event.Hash)) == normalizedHash);
        if (matchingEvent == null)
        {
            return null;
        }

        var blockNumber = matchingEvent.Log.BlockNumber?.Value ?? System.Numerics.BigInteger.Zero;
        var block = await _web3.Eth.Blocks.GetBlockWithTransactionsByNumber.SendRequestAsync(new BlockParameter(matchingEvent.Log.BlockNumber));
        var timestamp = block?.Timestamp?.Value ?? System.Numerics.BigInteger.Zero;

        return new BlockchainTransactionInfoDto
        {
            TransactionHash = matchingEvent.Log.TransactionHash ?? string.Empty,
            BlockNumber = (long)blockNumber,
            BlockTimestamp = DateTimeOffset.FromUnixTimeSeconds((long)timestamp),
            NetworkName = await GetNetworkNameAsync()
        };
    }

    public async Task<string> GetNetworkNameAsync()
    {
        var chainId = await _web3.Eth.ChainId.SendRequestAsync();
        return ResolveNetworkName(chainId?.Value ?? System.Numerics.BigInteger.Zero);
    }

    public async Task<List<OwnerDocumentInfoDto>> GetDocumentsByOwnerAsync(string ownerAddress)
    {
        var detailedFunction = GetOwnerDocumentsFunction();
        var result = await detailedFunction.CallDeserializingToObjectAsync<GetDocumentsByOwnerOutputDto>(ownerAddress);
        return result?.Documents?
            .Select(document => new OwnerDocumentInfoDto(
                Bytes32Helper.BytesToHexString(document.Hash),
                document.Issuer ?? string.Empty,
                DecodeUnixTimestamp(document.IssuedAt)))
            .ToList()
            ?? new List<OwnerDocumentInfoDto>();
    }

    private Nethereum.Contracts.Function GetIssueDocumentFunction()
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        return contract.GetFunction("issueDocument");
    }

    private async Task<string> WaitForMinedSuccessAsync(string txHash)
    {
        TransactionReceipt? receipt = await _web3.TransactionManager.TransactionReceiptService
            .PollForReceiptAsync(txHash);

        if (receipt is null)
        {
            throw new Exception($"Nie udało się pobrać potwierdzenia transakcji on-chain. txHash: {txHash}");
        }

        if (receipt.Status is null || receipt.Status.Value == 0)
        {
            throw new Exception($"Transakcja została odrzucona on-chain (status=0). txHash: {txHash}");
        }

        return txHash;
    }
}