using System;
using System.Collections.Generic;
using System.Numerics;
using backend.DTOs;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
using Nethereum.Hex.HexTypes;

namespace backend.Services.Blockchain;

public partial class BlockchainService
{
    private Nethereum.Contracts.Function GetOwnerDocumentsFunction()
    {
        var contract = _web3.Eth.GetContract(_abi, _contractAddress);
        return contract.GetFunction("getDocumentsByOwner");
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

    private static string NormalizeHex(string value)
    {
        return value.Trim().ToLowerInvariant();
    }

    private static string ResolveNetworkName(BigInteger chainId)
    {
        if (chainId == new BigInteger(1))
        {
            return "Ethereum Mainnet";
        }

        if (chainId == new BigInteger(5))
        {
            return "Goerli";
        }

        if (chainId == new BigInteger(11155111))
        {
            return "Sepolia";
        }

        if (chainId == new BigInteger(1337))
        {
            return "Localhost";
        }

        if (chainId == new BigInteger(31337))
        {
            return "Hardhat";
        }

        return $"Chain ID {chainId}";
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

    [Event("DocumentIssued")]
    private class DocumentIssuedEventDto : IEventDTO
    {
        [Parameter("bytes32", "hash", 1, true)]
        public byte[] Hash { get; set; } = Array.Empty<byte>();

        [Parameter("address", "issuer", 2, true)]
        public string Issuer { get; set; } = string.Empty;

        [Parameter("address", "documentOwner", 3, true)]
        public string DocumentOwner { get; set; } = string.Empty;

        [Parameter("uint8", "documentType", 4, false)]
        public byte DocumentType { get; set; }

        [Parameter("uint8", "status", 5, false)]
        public byte Status { get; set; }

        public Nethereum.RPC.Eth.DTOs.FilterLog Log { get; set; } = default!;
    }
}