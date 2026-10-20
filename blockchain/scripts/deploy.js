/**
 * Deploy DocumentIssuer to the selected Hardhat network.
 *
 *   npx hardhat run scripts/deploy.js --network localhost
 *   npx hardhat run scripts/deploy.js --network sepolia
 *   npm run deploy:local
 *   npm run deploy:sepolia
 *
 * Optional env: INITIAL_ADMIN (Ethereum address). Empty / unset = no initial admin.
 */
import hre from "hardhat";
import { BrowserProvider, ContractFactory, ZeroAddress } from "ethers";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const connection = await hre.network.connect();
  const { networkName, provider } = connection;

  console.log(`Deploying DocumentIssuer on network: ${networkName}`);

  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/DocumentIssuer.sol/DocumentIssuer.json"
  );
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));

  const ethersProvider = new BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  const initialIssuers = [];
  const initialAdminEnv = (process.env.INITIAL_ADMIN || "").trim();
  const initialAdmin =
    initialAdminEnv && initialAdminEnv.toLowerCase() !== ZeroAddress.toLowerCase()
      ? initialAdminEnv
      : ZeroAddress;

  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(initialIssuers, initialAdmin);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const owner = await contract.owner();

  console.log("Contract address:", address);
  console.log("Owner:", owner);
  if (initialAdmin !== ZeroAddress) {
    console.log("Initial admin:", initialAdmin);
  }
  console.log("");
  console.log("Next steps:");
  console.log("  1. Copy ABI → backend/Infrastructure/Contracts/DocumentIssuer.abi.json");
  console.log("     (or: node -e \"...\" after compile — see README)");
  console.log("  2. Set Blockchain__ContractAddress / BLOCKCHAIN_CONTRACT_ADDRESS in .env");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
