import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);


// Twój adres Sepolia (konto deployera)
const deployerAddress = wallet.address;

// Tablica initialIssuers – można wrzucić tylko deployera lub więcej adresów
const initialIssuers = [deployerAddress];

async function main() {
  const artifact = await import("../artifacts/contracts/DocumentIssuer.sol/DocumentIssuer.json", {
    assert: { type: "json" }
  });

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(initialIssuers);
 

  await contract.waitForDeployment();
  console.log("Deployed at:", contract.target); 
}

main().catch(console.error);
