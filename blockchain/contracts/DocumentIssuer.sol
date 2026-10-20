// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DocumentTypes.sol";

/// @title DocumentIssuer
/// @notice On-chain registry of issued document hashes. Roles: owner (deployer),
///         admin (managed by owner), issuer (authorizedIssuers — can call issueDocument).
contract DocumentIssuer {
    struct OwnerDocumentInfo {
        bytes32 hash;
        address issuer;
        uint256 issuedAt;
    }

    address public owner;
    mapping(address => bool) public isAdmin;
    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => DocumentTypes.Document) public documents;
    mapping(address => bytes32[]) private ownerDocumentHashes;

    event DocumentIssued(
        bytes32 indexed hash,
        address indexed issuer,
        address indexed documentOwner,
        DocumentTypes.DocumentType documentType,
        DocumentTypes.DocumentStatus status
    );
    event IssuerAdded(address indexed issuer, address indexed by);
    event IssuerRemoved(address indexed issuer, address indexed by);
    event AdminAdded(address indexed admin, address indexed by);
    event AdminRemoved(address indexed admin, address indexed by);
    event DocumentRevoked(bytes32 indexed hash, address indexed revokedBy, uint256 revokedAt);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOwnerOrAdmin() {
        require(msg.sender == owner || isAdmin[msg.sender], "Not owner or admin");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized");
        _;
    }

    /// @param initialIssuers Optional extra issuers (deployer is always authorized).
    /// @param initialAdmin Optional first admin (address(0) = none).
    constructor(address[] memory initialIssuers, address initialAdmin) {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;

        for (uint i = 0; i < initialIssuers.length; i++) {
            address issuer = initialIssuers[i];
            if (issuer != address(0) && !authorizedIssuers[issuer]) {
                authorizedIssuers[issuer] = true;
            }
        }

        if (initialAdmin != address(0)) {
            require(initialAdmin != msg.sender, "Owner cannot be admin");
            isAdmin[initialAdmin] = true;
        }
    }

    function addAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Zero address");
        require(newAdmin != owner, "Owner cannot be admin");
        require(!isAdmin[newAdmin], "Already admin");
        require(!authorizedIssuers[newAdmin], "Issuer cannot be admin");
        isAdmin[newAdmin] = true;
        emit AdminAdded(newAdmin, msg.sender);
    }

    function removeAdmin(address adminToRemove) external onlyOwner {
        require(adminToRemove != address(0), "Zero address");
        require(isAdmin[adminToRemove], "Not admin");
        isAdmin[adminToRemove] = false;
        emit AdminRemoved(adminToRemove, msg.sender);
    }

    function addIssuer(address _issuer) external onlyOwnerOrAdmin {
        require(_issuer != address(0), "Zero address");
        require(!authorizedIssuers[_issuer], "Already authorized");
        require(!isAdmin[_issuer], "Admin cannot be issuer");
        require(_issuer != owner, "Owner already issuer");
        authorizedIssuers[_issuer] = true;
        emit IssuerAdded(_issuer, msg.sender);
    }

    function removeIssuer(address _issuer) external onlyOwnerOrAdmin {
        require(_issuer != address(0), "Zero address");
        require(_issuer != owner, "Cannot remove owner issuer");
        require(authorizedIssuers[_issuer], "Not authorized");
        authorizedIssuers[_issuer] = false;
        emit IssuerRemoved(_issuer, msg.sender);
    }

    function issueDocument(
        bytes32 hash,
        string calldata cid,
        address documentOwner,
        DocumentTypes.DocumentType documentType
    ) external onlyIssuer {
        require(hash != bytes32(0), "Hash required");
        require(bytes(cid).length > 0, "CID required");
        require(documentOwner != address(0), "Owner required");
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
        ownerDocumentHashes[documentOwner].push(hash);
        emit DocumentIssued(
            hash,
            msg.sender,
            documentOwner,
            documentType,
            DocumentTypes.DocumentStatus.Confirmed
        );
    }

    function getDocumentsByOwner(address documentOwner) external view returns (OwnerDocumentInfo[] memory) {
        require(documentOwner != address(0), "Owner required");

        bytes32[] storage hashes = ownerDocumentHashes[documentOwner];
        OwnerDocumentInfo[] memory result = new OwnerDocumentInfo[](hashes.length);

        for (uint256 i = 0; i < hashes.length; i++) {
            bytes32 docHash = hashes[i];
            DocumentTypes.Document storage doc = documents[docHash];

            result[i] = OwnerDocumentInfo({
                hash: docHash,
                issuer: doc.issuer,
                issuedAt: doc.issuedAt
            });
        }

        return result;
    }

    function revokeDocument(bytes32 hash) external {
        DocumentTypes.Document storage doc = documents[hash];
        require(doc.exists, "Not found");
        require(doc.status != DocumentTypes.DocumentStatus.Revoked, "Already revoked");
        require(
            msg.sender == doc.issuer || isAdmin[msg.sender] || msg.sender == owner,
            "Not authorized to revoke"
        );
        doc.status = DocumentTypes.DocumentStatus.Revoked;
        emit DocumentRevoked(hash, msg.sender, block.timestamp);
    }

    function exists(bytes32 hash) external view returns (bool) {
        return documents[hash].exists;
    }

    function getDocument(bytes32 hash) external view returns (DocumentTypes.Document memory) {
        require(documents[hash].exists, "Not found");
        return documents[hash];
    }

    /// @notice True only if the document exists and is still Confirmed (not revoked).
    function verifyDocument(bytes32 hash) external view returns (bool) {
        DocumentTypes.Document storage doc = documents[hash];
        return doc.exists && doc.status == DocumentTypes.DocumentStatus.Confirmed;
    }
}
