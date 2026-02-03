// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocumentRegistry
 * @notice Minimalny rejestr istnienia dokumentów (hashy)
 */
contract DocumentRegistry {

    struct Document {
        address issuer;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Document) private documents;

    event DocumentRegistered(
        bytes32 indexed documentHash,
        address indexed issuer,
        uint256 timestamp
    );

    function register(bytes32 documentHash) external {
        require(documentHash != bytes32(0), "Invalid hash");
        require(!documents[documentHash].exists, "Already registered");

        documents[documentHash] = Document({
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit DocumentRegistered(documentHash, msg.sender, block.timestamp);
    }

    function exists(bytes32 documentHash) external view returns (bool) {
        return documents[documentHash].exists;
    }

    function get(bytes32 documentHash)
        external
        view
        returns (address issuer, uint256 timestamp)
    {
        require(documents[documentHash].exists, "Not found");
        Document memory doc = documents[documentHash];
        return (doc.issuer, doc.timestamp);
    }
}
