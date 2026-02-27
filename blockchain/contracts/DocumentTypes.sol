// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DocumentTypes {
    enum DocumentStatus { Pending, Confirmed }

    struct Document {
        address issuer; //wystawca
        address documentOwner; //wlasciciel dokumentu (np student)
        uint256 issuedAt; //data wystawienia
        string cid;
        bytes32 documentType;
        bool exists;
        DocumentStatus status;
    }
}
