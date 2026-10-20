import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Alternative deploy path (Ignition). Primary path: scripts/deploy.js
 *
 *   npx hardhat ignition deploy ignition/modules/DocumentIssuer.ts
 *   npx hardhat ignition deploy ignition/modules/DocumentIssuer.ts --network sepolia
 */
export default buildModule("DocumentIssuerModule", (m) => {
  const initialIssuers: string[] = [];
  const initialAdmin = "0x0000000000000000000000000000000000000000";

  const documentIssuer = m.contract("DocumentIssuer", [initialIssuers, initialAdmin]);

  return { documentIssuer };
});
