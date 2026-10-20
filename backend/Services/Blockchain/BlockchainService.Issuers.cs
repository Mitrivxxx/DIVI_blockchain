namespace backend.Services.Blockchain;

public partial class BlockchainService
{
    public async Task<string> AddIssuerAsync(string issuerAddress)
    {
        return await SendAddressMutationAsync("addIssuer", issuerAddress);
    }

    public async Task<string> RemoveIssuerAsync(string issuerAddress)
    {
        return await SendAddressMutationAsync("removeIssuer", issuerAddress);
    }

    public async Task<string> AddAdminAsync(string adminAddress)
    {
        return await SendAddressMutationAsync("addAdmin", adminAddress);
    }

    public async Task<string> RemoveAdminAsync(string adminAddress)
    {
        return await SendAddressMutationAsync("removeAdmin", adminAddress);
    }

    public async Task<bool> IsIssuerAsync(string address)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("authorizedIssuers");
        return await function.CallAsync<bool>(address);
    }

    public async Task<bool> IsAdminAsync(string address)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction("isAdmin");
        return await function.CallAsync<bool>(address);
    }

    private async Task<string> SendAddressMutationAsync(string functionName, string addressArg)
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        var function = contract.GetFunction(functionName);
        var fromAddress = _web3.TransactionManager.Account.Address;

        var gasEstimate = await function.EstimateGasAsync(
            from: fromAddress,
            null,
            null,
            addressArg
        );
        var gasWithBuffer = new Nethereum.Hex.HexTypes.HexBigInteger(gasEstimate.Value + (gasEstimate.Value / 10));

        var txHash = await function.SendTransactionAsync(
            from: fromAddress,
            gas: gasWithBuffer,
            value: null,
            functionInput: addressArg);

        return await WaitForMinedSuccessAsync(txHash);
    }
}
