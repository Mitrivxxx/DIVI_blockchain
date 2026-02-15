// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DocumentTypes {
    struct Document {
        address issuer;
        address documentOwner;
        uint256 issuedAt;
        string cid;
        bytes32 documentType;
        bool exists;
    }
}
