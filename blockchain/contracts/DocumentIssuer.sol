// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DocumentTypes.sol";

contract DocumentIssuer {
    // Administrator address (hardcoded)
    address public admin = 0xeb2a27c7c6E72BC5022a49c4e044E72ab70E9bDb;

    // Modifier to restrict access to admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    // Mapping to track issuer status
    mapping(address => bool) public isIssuer;
    // Mapping to track issuer applications
    mapping(address => bool) public issuerApplications;

    // Function for users to apply to become issuer
    function applyForIssuer() external {
        issuerApplications[msg.sender] = true;
    }

    // Function for admin to approve issuer applications
    function approveIssuer(address applicant) external onlyAdmin {
        require(issuerApplications[applicant], "No application");
        isIssuer[applicant] = true;
        issuerApplications[applicant] = false;
    }

    address public owner;
    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => DocumentTypes.Document) public documents;

    event DocumentIssued(bytes32 indexed hash, address indexed issuer, address indexed documentOwner, bytes32 documentType);

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized");
        _;
    }

    constructor(address[] memory initialIssuers) {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        for (uint i = 0; i < initialIssuers.length; i++) {
            authorizedIssuers[initialIssuers[i]] = true;
        }
    }

    function addIssuer(address _issuer) external {
        require(msg.sender == owner, "Only owner can add issuer");
        require(_issuer != address(0), "Zero address");
        require(!authorizedIssuers[_issuer], "Already authorized");
        authorizedIssuers[_issuer] = true;
    }

    function removeIssuer(address _issuer) external {
        require(msg.sender == owner, "Only owner can remove issuer");
        require(_issuer != address(0), "Zero address");
        require(authorizedIssuers[_issuer], "Not authorized");
        authorizedIssuers[_issuer] = false;
    }

    function issueDocument(bytes32 hash, string calldata cid, address documentOwner, bytes32 documentType) external onlyIssuer {
        require(hash != bytes32(0), "Hash required");
        require(bytes(cid).length > 0, "CID required");
        require(documentOwner != address(0), "Owner required");
        require(documentType != bytes32(0), "Document type required");
        require(!documents[hash].exists, "Already issued");
        documents[hash] = DocumentTypes.Document({
            issuer: msg.sender,
            documentOwner: documentOwner,
            issuedAt: block.timestamp,
            cid: cid,
            documentType: documentType,
            exists: true
        });
        emit DocumentIssued(hash, msg.sender, documentOwner, documentType);
    }

    function exists(bytes32 hash) external view returns (bool) {
        return documents[hash].exists;
    }

    function getDocument(bytes32 hash) external view returns (DocumentTypes.Document memory) {
        require(documents[hash].exists, "Not found");
        return documents[hash];
    }

    function verifyDocument(bytes32 hash) external view returns (bool) {
        return documents[hash].exists;
    }
}
