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

        _abi = ABI;
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
        var hashBytes32 = StringToBytes32(hash, true);
        var documentTypeBytes32 = StringToBytes32(documentType);

        var gasEstimate = await function.EstimateGasAsync(
            from: _web3.TransactionManager.Account.Address,
            null,
            null,
            hashBytes32,
            cid,
            owner,
            documentTypeBytes32
        );
        var gasWithBuffer = new Nethereum.Hex.HexTypes.HexBigInteger(gasEstimate.Value + (gasEstimate.Value / 10));

        var txHash = await function.SendTransactionAsync(
            from: _web3.TransactionManager.Account.Address,
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

        return await function.CallAsync<bool>(StringToBytes32(hash, true));
    }

    public async Task<List<object>> GetDocumentAsync(string hash)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("getDocument");

        return await function.CallAsync<List<object>>(StringToBytes32(hash, true));
    }

    // =============================
    // ISSUERS
    // =============================

    public async Task<string> AddIssuerAsync(string issuerAddress)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("addIssuer");

        return await function.SendTransactionAsync(
            from: _web3.TransactionManager.Account.Address,
            gas: null,
            value: null,
            functionInput: issuerAddress);
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

    // =============================
    // UTILS
    // =============================

    private static byte[] StringToBytes32(string str, bool isHex = false)
    {
        if (string.IsNullOrWhiteSpace(str))
            throw new ArgumentException("String is empty");

        if (isHex)
        {
            if (str.StartsWith("0x")) str = str.Substring(2);
            if (str.Length != 64)
                throw new ArgumentException("Hex string must be 32 bytes (64 hex chars)");

            return Enumerable.Range(0, str.Length / 2)
                .Select(x => Convert.ToByte(str.Substring(x * 2, 2), 16))
                .ToArray();
        }
        else
        {
            str = str.Trim();
            var bytes = System.Text.Encoding.UTF8.GetBytes(str);

            if (bytes.Length > 32)
                throw new ArgumentException($"String too long for bytes32: {bytes.Length} bytes");

            var bytes32 = new byte[32];
            Array.Copy(bytes, bytes32, bytes.Length);
            return bytes32;
        }
    }

    private const string ABI = "[{\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"initialIssuers\",\"type\":\"address[]\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"hash\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"issuer\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"documentOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"documentType\",\"type\":\"bytes32\"}],\"name\":\"DocumentIssued\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_issuer\",\"type\":\"address\"}],\"name\":\"addIssuer\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"admin\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"applyForIssuer\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"applicant\",\"type\":\"address\"}],\"name\":\"approveIssuer\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"authorizedIssuers\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"name\":\"documents\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"issuer\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"documentOwner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"issuedAt\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"cid\",\"type\":\"string\"},{\"internalType\":\"bytes32\",\"name\":\"documentType\",\"type\":\"bytes32\"},{\"internalType\":\"bool\",\"name\":\"exists\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"hash\",\"type\":\"bytes32\"}],\"name\":\"exists\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"hash\",\"type\":\"bytes32\"}],\"name\":\"getDocument\",\"outputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"issuer\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"documentOwner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"issuedAt\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"cid\",\"type\":\"string\"},{\"internalType\":\"bytes32\",\"name\":\"documentType\",\"type\":\"bytes32\"},{\"internalType\":\"bool\",\"name\":\"exists\",\"type\":\"bool\"}],\"internalType\":\"struct DocumentTypes.Document\",\"name\":\"\",\"type\":\"tuple\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"isIssuer\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"hash\",\"type\":\"bytes32\"},{\"internalType\":\"string\",\"name\":\"cid\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"documentOwner\",\"type\":\"address\"},{\"internalType\":\"bytes32\",\"name\":\"documentType\",\"type\":\"bytes32\"}],\"name\":\"issueDocument\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"issuerApplications\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_issuer\",\"type\":\"address\"}],\"name\":\"removeIssuer\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"hash\",\"type\":\"bytes32\"}],\"name\":\"verifyDocument\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]";
}
