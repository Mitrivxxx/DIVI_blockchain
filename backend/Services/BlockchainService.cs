using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Nethereum.Hex.HexTypes;


public class BlockchainService
{
    private readonly Web3 _web3;
    private readonly string _contractAddress;
    private readonly string _abi;

    public BlockchainService(IConfiguration configuration)
    {
        var rpcUrl = configuration["Blockchain:RpcUrl"]
            ?? throw new ArgumentNullException("Blockchain:RpcUrl missing");

        var privateKey = configuration["Blockchain:PrivateKey"]
            ?? throw new ArgumentNullException("Blockchain:PrivateKey missing");

        _contractAddress = configuration["Blockchain:ContractAddress"]
            ?? throw new ArgumentNullException("Blockchain:ContractAddress missing");

        var account = new Account(privateKey, 11155111); // 11155111 = Sepolia chainId
        _web3 = new Web3(account, rpcUrl);

        _abi = @"[
            {
                ""inputs"": [{""internalType"": ""address"", ""name"": ""issuer"", ""type"": ""address""}],
                ""name"": ""addIssuer"",
                ""outputs"": [],
                ""stateMutability"": ""nonpayable"",
                ""type"": ""function""
            }
        ]";
    }

    public async Task AddIssuerAsync(string issuerAddress)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("addIssuer");

        var receipt = await function.SendTransactionAndWaitForReceiptAsync(
            from: _web3.TransactionManager.Account.Address,
            gas: new HexBigInteger(300000),
            value: null,
            functionInput: issuerAddress
        );

        if (receipt.Status.Value == 0)
        {
            throw new Exception("Blockchain transaction failed.");
        }
    }
}
