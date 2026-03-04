// scripts/deploy.js
import hre from "hardhat";

async function main() {
  console.log("Deploying DocumentIssuer contract...");

  // Połączenie z networkiem (Hardhat v3 way)
  const { ethers } = await hre.network.connect();

  const DocumentIssuer = await ethers.getContractFactory("DocumentIssuer");

  // Provide an empty array for initialIssuers, or add addresses if needed
  const initialIssuers = [];
  const contract = await DocumentIssuer.deploy(initialIssuers);

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("Contract address:", address);

  const owner = await contract.owner();
  console.log("Owner address:", owner);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
