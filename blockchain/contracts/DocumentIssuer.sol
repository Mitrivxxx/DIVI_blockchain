// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "./DocumentTypes.sol";

contract DocumentIssuer {
    // Admins mapping, default admin is hardcoded
    mapping(address => bool) public isAdmin;
    address public constant DEFAULT_ADMIN = 0xeb2a27c7c6E72BC5022a49c4e044E72ab70E9bDb;

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not admin");
        _;
    }

    mapping(address => bool) public isIssuer;
    mapping(address => bool) public issuerApplications;

    // Function for users to apply to become issuer
    function applyForIssuer() external {
        require(!isAdmin[msg.sender], "Admin cannot be issuer");
        issuerApplications[msg.sender] = true;
    }

    // Function for admin to approve issuer applications
    function approveIssuer(address applicant) external onlyAdmin {
        require(issuerApplications[applicant], "No application");
        require(!isAdmin[applicant], "Admin cannot be issuer");
        isIssuer[applicant] = true;
        issuerApplications[applicant] = false;
    }

    // Admin management
    function addAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        require(!isAdmin[newAdmin], "Already admin");
        require(!isIssuer[newAdmin], "Issuer cannot be admin");
        isAdmin[newAdmin] = true;
    }

    function removeAdmin(address adminToRemove) external onlyAdmin {
        require(adminToRemove != address(0), "Zero address");
        require(isAdmin[adminToRemove], "Not admin");
        require(adminToRemove != DEFAULT_ADMIN, "Cannot remove default admin");
        isAdmin[adminToRemove] = false;
    }

    address public owner;
    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => DocumentTypes.Document) public documents;

    event DocumentIssued(bytes32 indexed hash, address indexed issuer, address indexed documentOwner, bytes32 documentType, DocumentTypes.DocumentStatus status);

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized");
        _;
    }

    constructor(address[] memory initialIssuers) {
        // Set default admin
        isAdmin[DEFAULT_ADMIN] = true;
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
        require(!isAdmin[_issuer], "Admin cannot be issuer");
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
            exists: true,
            status: DocumentTypes.DocumentStatus.Confirmed
        });
        emit DocumentIssued(hash, msg.sender, documentOwner, documentType, DocumentTypes.DocumentStatus.Confirmed);
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
