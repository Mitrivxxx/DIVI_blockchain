// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DocumentRegistry {

    struct Document {
        address issuer;
        uint256 timestamp;
        bool exists;
    }

    // hash dokumentu => dane
    mapping(bytes32 => Document) private documents;

    event DocumentRegistered(
        bytes32 indexed documentHash,
        address indexed issuer,
        uint256 timestamp
    );

    /**
     * Rejestruje nowy dokument
     */
    function registerDocument(bytes32 documentHash) external {
        require(documentHash != bytes32(0), "Invalid hash");
        require(!documents[documentHash].exists, "Document already registered");

        documents[documentHash] = Document({
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit DocumentRegistered(documentHash, msg.sender, block.timestamp);
    }

    /**
     * Sprawdza czy dokument istnieje
     */
    function exists(bytes32 documentHash) external view returns (bool) {
        return documents[documentHash].exists;
    }

    /**
     * Pobiera dane dokumentu
     */
    function getDocument(bytes32 documentHash)
        external
        view
        returns (address issuer, uint256 timestamp)
    {
        require(documents[documentHash].exists, "Document not found");

        Document memory doc = documents[documentHash];
        return (doc.issuer, doc.timestamp);
    }
}
