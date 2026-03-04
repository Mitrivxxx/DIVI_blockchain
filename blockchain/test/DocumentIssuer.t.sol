// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/DocumentIssuer.sol";
import "../contracts/DocumentTypes.sol";

contract DocumentIssuerTest {
    DocumentIssuer documentIssuer;

    address owner;
    address issuer1;
    address user;

    bytes32 constant DIPLOMA = bytes32("DIPLOMA");

    constructor() {
        owner = address(this); // kontrakt testowy jako owner
        issuer1 = address(0x123);
        user = address(0x456);
        address[] memory issuers = new address[](1);
        issuers[0] = issuer1;
        documentIssuer = new DocumentIssuer(issuers);
    }

    // prosty assert
    function testOwnerIsSet() public view returns (bool) {
        require(documentIssuer.owner() == owner, "Owner mismatch");
        return true;
    }

    function testInitialIssuerAuthorized() public view returns (bool) {
        require(documentIssuer.authorizedIssuers(issuer1), "Issuer1 not authorized");
        return true;
    }

    function testIssueDocument() public returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked("test-doc"));
        string memory cid = "QmTestCid";

        documentIssuer.issueDocument(hash, cid, user, DIPLOMA);

        DocumentTypes.Document memory doc = documentIssuer.getDocument(hash);

        require(doc.exists, "Doc does not exist");
        require(doc.documentOwner == user, "Owner mismatch");
        require(doc.documentType == DIPLOMA, "DocType mismatch");

        return true;
    }
}
