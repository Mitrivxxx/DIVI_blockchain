using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using backend.DTOs;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Microsoft.Extensions.Configuration;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Hex.HexTypes;

namespace backend.Services.Blockchain
{
	public class BlockchainService : IBlockchainService
	{
    private const string LegacyIssueDocumentAbi = "[{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"hash\",\"type\":\"bytes32\"},{\"internalType\":\"string\",\"name\":\"cid\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"documentOwner\",\"type\":\"address\"},{\"internalType\":\"bytes32\",\"name\":\"documentType\",\"type\":\"bytes32\"}],\"name\":\"issueDocument\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]";
    private const string OwnerDocumentsAbi = "[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"documentOwner\",\"type\":\"address\"}],\"name\":\"getDocumentsByOwner\",\"outputs\":[{\"components\":[{\"internalType\":\"bytes32\",\"name\":\"hash\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"issuer\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"issuedAt\",\"type\":\"uint256\"}],\"internalType\":\"struct DocumentIssuer.OwnerDocumentInfo[]\",\"name\":\"\",\"type\":\"tuple[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]";
    private const string LegacyOwnerDocumentHashesAbi = "[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"documentOwner\",\"type\":\"address\"}],\"name\":\"getDocumentHashesByOwner\",\"outputs\":[{\"internalType\":\"bytes32[]\",\"name\":\"\",\"type\":\"bytes32[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]";

    private readonly Web3 _web3;
    private readonly string _contractAddress;
    private readonly string _abi;

    public BlockchainService(IConfiguration config)
    {

        var privateKey = Environment.GetEnvironmentVariable("SEPOLIA_PRIVATE_KEY")
            ?? throw new ArgumentNullException("SEPOLIA_PRIVATE_KEY missing");

        var rpcUrl = Environment.GetEnvironmentVariable("BLOCKCHAIN_RPC_URL")
            ?? config["Blockchain:RpcUrl"]
            ?? throw new ArgumentNullException("BLOCKCHAIN_RPC_URL / Blockchain:RpcUrl missing");

        _contractAddress = Environment.GetEnvironmentVariable("BLOCKCHAIN_CONTRACT_ADDRESS")
            ?? config["Blockchain:ContractAddress"]
            ?? throw new ArgumentNullException("BLOCKCHAIN_CONTRACT_ADDRESS / Blockchain:ContractAddress missing");

        var account = new Account(privateKey);
        _web3 = new Web3(account, rpcUrl);

        // Load ABI from file
        var abiPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Infrastructure", "Contracts", "DocumentIssuer.abi.json");
        if (!File.Exists(abiPath))
        {
            throw new FileNotFoundException($"ABI file not found at {abiPath}");
        }
        _abi = File.ReadAllText(abiPath);
    }

    // =============================
    // DOCUMENTS
    // =============================

    public async Task PrecheckIssueDocumentAsync(
        string hash,
        string owner,
        byte documentType)
    {
        try
        {
            var function = GetIssueDocumentFunction();
            var hashBytes32 = Utils.StringToBytes32(hash, true);
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
        catch (Exception ex) when (ShouldTryLegacyIssueDocument(ex))
        {
            await EstimateLegacyIssueDocumentGasAsync(hash, "precheck", owner, documentType);
        }
    }

    public async Task<string> IssueDocumentAsync(
        string hash,
        string cid,
        string owner,
        byte documentType)
    {
        try
        {
            var function = GetIssueDocumentFunction();
            var hashBytes32 = Utils.StringToBytes32(hash, true);

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
        catch (Exception ex) when (ShouldTryLegacyIssueDocument(ex))
        {
            return await SendLegacyIssueDocumentTransactionAsync(hash, cid, owner, documentType);
        }
    }

    private Nethereum.Contracts.Function GetIssueDocumentFunction()
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        return contract.GetFunction("issueDocument");
    }

    private Nethereum.Contracts.Function GetLegacyIssueDocumentFunction()
    {
        var contract = _web3.Eth.GetContract(LegacyIssueDocumentAbi, _contractAddress);
        return contract.GetFunction("issueDocument");
    }

    private async Task EstimateLegacyIssueDocumentGasAsync(string hash, string cid, string owner, byte documentType)
    {
        var function = GetLegacyIssueDocumentFunction();
        var hashBytes32 = Utils.StringToBytes32(hash, true);
        var legacyDocumentTypeBytes32 = Utils.StringToBytes32(MapDocumentTypeToLegacyLabel(documentType));
        var fromAddress = _web3.TransactionManager.Account.Address;

        await function.EstimateGasAsync(
            from: fromAddress,
            null,
            null,
            hashBytes32,
            cid,
            owner,
            legacyDocumentTypeBytes32
        );
    }

    private async Task<string> SendLegacyIssueDocumentTransactionAsync(string hash, string cid, string owner, byte documentType)
    {
        var function = GetLegacyIssueDocumentFunction();
        var hashBytes32 = Utils.StringToBytes32(hash, true);
        var legacyDocumentTypeBytes32 = Utils.StringToBytes32(MapDocumentTypeToLegacyLabel(documentType));
        var fromAddress = _web3.TransactionManager.Account.Address;

        var gasEstimate = await function.EstimateGasAsync(
            from: fromAddress,
            null,
            null,
            hashBytes32,
            cid,
            owner,
            legacyDocumentTypeBytes32
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
                legacyDocumentTypeBytes32
            });

        return await WaitForMinedSuccessAsync(txHash);
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

    private static bool ShouldTryLegacyIssueDocument(Exception ex)
    {
        var message = ex.Message?.ToLowerInvariant() ?? string.Empty;

        // If the call reverted without a reason, this often means selector/ABI mismatch.
        return message.Contains("smart contract error")
            || message.Contains("execution reverted")
            || message.Contains("without a reason")
            || message.Contains("function selector was not recognized");
    }

    private static string MapDocumentTypeToLegacyLabel(byte documentType)
    {
        return documentType switch
        {
            0 => "Education",
            1 => "Professional certificates",
            2 => "Employment documents",
            3 => "License",
            4 => "Other documents",
            _ => "Other documents"
        };
    }

    public async Task<bool> VerifyDocumentAsync(string hash)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("verifyDocument");
        var hashBytes32 = Utils.StringToBytes32(hash, true);
        return await function.CallAsync<bool>(hashBytes32);
    }

    public async Task<List<object>> GetDocumentAsync(string hash)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("getDocument");
        var hashBytes32 = Utils.StringToBytes32(hash, true);
        return await function.CallAsync<List<object>>(hashBytes32);
    }

    public async Task<List<OwnerDocumentInfoDto>> GetDocumentsByOwnerAsync(string ownerAddress)
    {
        var detailedFunction = GetOwnerDocumentsFunction();
        try
        {
            var result = await detailedFunction.CallDeserializingToObjectAsync<GetDocumentsByOwnerOutputDto>(ownerAddress);
            return result?.Documents?
                .Select(document => new OwnerDocumentInfoDto(
                    Utils.BytesToHexString(document.Hash),
                    document.Issuer ?? string.Empty,
                    DecodeUnixTimestamp(document.IssuedAt)))
                .ToList()
                ?? new List<OwnerDocumentInfoDto>();
        }
        catch (Exception ex) when (ShouldTryLegacyOwnerDocuments(ex))
        {
        }

        var hashesFunction = GetLegacyOwnerDocumentHashesFunction();

        var rawHashes = await hashesFunction.CallAsync<List<byte[]>>(ownerAddress);
        if (rawHashes == null || rawHashes.Count == 0)
        {
            return new List<OwnerDocumentInfoDto>();
        }

        var certificates = new List<OwnerDocumentInfoDto>(rawHashes.Count);
        foreach (var rawHash in rawHashes)
        {
            var hash = Utils.BytesToHexString(rawHash);
            var rawDocument = await GetDocumentAsync(hash);
            var certificate = DecodeLegacyOwnerDocument(hash, rawDocument);

            if (certificate != null)
            {
                certificates.Add(certificate);
            }
        }

        return certificates;
    }

    // =============================
    // ISSUERS
    // =============================

    public async Task<string> AddIssuerAsync(string issuerAddress)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("addIssuer");
        var fromAddress = _web3.TransactionManager.Account.Address;

        // Estimate gas
        var gasEstimate = await function.EstimateGasAsync(
            from: fromAddress,
            null,
            null,
            issuerAddress
        );
        var gasWithBuffer = new Nethereum.Hex.HexTypes.HexBigInteger(gasEstimate.Value + (gasEstimate.Value / 10));

        var txHash = await function.SendTransactionAsync(
            from: fromAddress,
            gas: gasWithBuffer,
            value: null,
            functionInput: issuerAddress);
        return txHash;

    }

    public async Task<string> ApproveIssuerAsync(string applicantAddress)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("approveIssuer");

        return await function.SendTransactionAsync(
            from: _web3.TransactionManager.Account.Address,
            gas: null,
            value: null,
            functionInput: applicantAddress);
    }

    public async Task<string> RemoveIssuerAsync(string issuerAddress)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("removeIssuer");

        return await function.SendTransactionAsync(
            from: _web3.TransactionManager.Account.Address,
            gas: null,
            value: null,
            functionInput: issuerAddress);
    }

    public async Task<bool> IsIssuerAsync(string address)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("isIssuer");

        return await function.CallAsync<bool>(address);
    }

    private static string DecodeHash(object? value)
    {
        return value switch
        {
            byte[] bytes => Utils.BytesToHexString(bytes),
            string stringValue => stringValue,
            _ => string.Empty
        };
    }

    private static OwnerDocumentInfoDto? DecodeOwnerDocument(params object[] tuple)
    {
        if (tuple.Length < 3)
        {
            return null;
        }

        var hash = DecodeHash(tuple[0]);
        var issuer = tuple[1]?.ToString() ?? string.Empty;
        var issuedAt = DecodeUnixTimestamp(tuple[2]);

        return new OwnerDocumentInfoDto(hash, issuer, issuedAt);
    }

    private static OwnerDocumentInfoDto? DecodeLegacyOwnerDocument(string hash, List<object>? rawDocument)
    {
        if (rawDocument == null || rawDocument.Count < 3)
        {
            return null;
        }

        var issuer = rawDocument[0]?.ToString() ?? string.Empty;
        var issuedAt = DecodeUnixTimestamp(rawDocument[2]);

        return new OwnerDocumentInfoDto(hash, issuer, issuedAt);
    }

    private static Nethereum.Contracts.Function? TryGetFunction(Nethereum.Contracts.Contract contract, string functionName)
    {
        try
        {
            return contract.GetFunction(functionName);
        }
        catch (Exception ex) when (ex.Message.Contains("Function not found", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }
    }

    private Nethereum.Contracts.Function GetOwnerDocumentsFunction()
    {
        var contract = _web3.Eth.GetContract(OwnerDocumentsAbi, _contractAddress);
        return contract.GetFunction("getDocumentsByOwner");
    }

    private Nethereum.Contracts.Function GetLegacyOwnerDocumentHashesFunction()
    {
        var contract = _web3.Eth.GetContract(LegacyOwnerDocumentHashesAbi, _contractAddress);
        return contract.GetFunction("getDocumentHashesByOwner");
    }

    [FunctionOutput]
    private class GetDocumentsByOwnerOutputDto : IFunctionOutputDTO
    {
        [Parameter("tuple[]", "", 1)]
        public List<OwnerDocumentOutputDto> Documents { get; set; } = new();
    }

    [FunctionOutput]
    private class OwnerDocumentOutputDto : IFunctionOutputDTO
    {
        [Parameter("bytes32", "hash", 1)]
        public byte[] Hash { get; set; } = Array.Empty<byte>();

        [Parameter("address", "issuer", 2)]
        public string Issuer { get; set; } = string.Empty;

        [Parameter("uint256", "issuedAt", 3)]
        public BigInteger IssuedAt { get; set; }
    }

    private static bool ShouldTryLegacyOwnerDocuments(Exception ex)
    {
        var message = ex.Message?.ToLowerInvariant() ?? string.Empty;

        return message.Contains("function selector was not recognized")
            || message.Contains("execution reverted")
            || message.Contains("without a reason");
    }

    private static DateTimeOffset DecodeUnixTimestamp(object? value)
    {
        var rawValue = value switch
        {
            HexBigInteger hex => hex.Value,
            BigInteger big => big,
            long longValue => new BigInteger(longValue),
            int intValue => new BigInteger(intValue),
            string stringValue when long.TryParse(stringValue, out var parsed) => new BigInteger(parsed),
            _ => BigInteger.Zero
        };

        if (rawValue < 0)
        {
            rawValue = BigInteger.Zero;
        }

        return DateTimeOffset.FromUnixTimeSeconds((long)rawValue);
    }
	}
}