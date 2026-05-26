import hre from "hardhat";

import  artifact  from "../artifacts/contracts/DocumentIssuer.sol/DocumentIssuer.json";
const { ethers } = hre;
async function main() {
    const address = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

    const [issuer] = await ethers.getSigners();
    const contract = new ethers.Contract(address, artifact.abi, issuer);

    const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const cid = "QmExampleCID";
    const owner = issuer.address;
    const documentType = 0; // DocumentTypes.DocumentType.Education

    const tx = await contract.issueDocument(hash, cid, owner, documentType);
    await tx.wait();

    console.log("Document issued!");

    const doc = await contract.getDocument(hash);
    console.log("Verified document:", doc);
}

await main();
