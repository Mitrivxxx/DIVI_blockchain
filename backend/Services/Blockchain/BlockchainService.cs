using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Microsoft.Extensions.Configuration;
using Nethereum.RPC.Eth.DTOs;

namespace backend.Services.Blockchain
{
	public class BlockchainService : IBlockchainService
	{
    private const string LegacyIssueDocumentAbi = "[{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"hash\",\"type\":\"bytes32\"},{\"internalType\":\"string\",\"name\":\"cid\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"documentOwner\",\"type\":\"address\"},{\"internalType\":\"bytes32\",\"name\":\"documentType\",\"type\":\"bytes32\"}],\"name\":\"issueDocument\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]";

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
	}
}