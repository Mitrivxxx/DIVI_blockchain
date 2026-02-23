using Nethereum.Web3;
using Nethereum.Web3.Accounts;


public class BlockchainService : IBlockchainService
{
    private readonly Web3 _web3;
    private readonly string _contractAddress;
    private readonly string _abi;

    public BlockchainService(IConfiguration config)
    {

        var privateKey = Environment.GetEnvironmentVariable("SEPOLIA_PRIVATE_KEY")
            ?? throw new ArgumentNullException("SEPOLIA_PRIVATE_KEY missing");

        var rpcUrl = config["Blockchain:RpcUrl"]
            ?? throw new ArgumentNullException("Blockchain:RpcUrl missing");

        _contractAddress = config["Blockchain:ContractAddress"]
            ?? throw new ArgumentNullException("Blockchain:ContractAddress missing");

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

    public async Task<string> IssueDocumentAsync(
        string hash,
        string cid,
        string owner,
        string documentType)
    {

        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("issueDocument");
        var hashBytes32 = Utils.StringToBytes32(hash, true);
        var documentTypeBytes32 = Utils.StringToBytes32(documentType);

        var fromAddress = _web3.TransactionManager.Account.Address;

        var gasEstimate = await function.EstimateGasAsync(
            from: fromAddress,
            null,
            null,
            hashBytes32,
            cid,
            owner,
            documentTypeBytes32
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
                documentTypeBytes32
            });
        return txHash;
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
