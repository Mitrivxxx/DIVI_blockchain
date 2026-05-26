namespace backend.Services.Blockchain;

public partial class BlockchainService
{
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