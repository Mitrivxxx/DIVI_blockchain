using System;
using System.IO;
using backend.Infrastructure.Configuration;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Microsoft.Extensions.Options;

namespace backend.Services.Blockchain
{
	public partial class BlockchainService : IBlockchainService
	{
    private readonly Web3 _web3;
    private readonly string _contractAddress;
    private readonly string _abi;

    public BlockchainService(IOptions<BlockchainOptions> options)
    {
        var blockchainOptions = options.Value;

        var privateKey = blockchainOptions.PrivateKey;
        var rpcUrl = blockchainOptions.RpcUrl;
        _contractAddress = blockchainOptions.ContractAddress;

        var account = new Account(privateKey);
        _web3 = new Web3(account, rpcUrl);

        _abi = LoadAbi();
    }

    private static string LoadAbi()
    {
        var abiPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Infrastructure", "Contracts", "DocumentIssuer.abi.json");
        if (!File.Exists(abiPath))
        {
            throw new FileNotFoundException($"ABI file not found at {abiPath}");
        }

        return File.ReadAllText(abiPath);
    }
}
}
