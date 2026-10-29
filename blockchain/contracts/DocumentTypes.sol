// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DocumentTypes {
    enum DocumentStatus { Pending, Confirmed, Revoked }
    enum DocumentType {
        Education,              // Wykształcenie
        Experience,             // Doświadczenie
        LicensesAndCertificates,// Licencje i certyfikaty
        Recommendation,         // Rekomendacja
        HonorsAndAwards         // Wyróżnienia i nagrody
    }

    struct Document {
        address issuer; //wystawca
        address documentOwner; //wlasciciel dokumentu (np student)
        uint256 issuedAt; //data wystawienia
        string cid;
        DocumentType documentType;
        bool exists;
        DocumentStatus status;
    }
}
