import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, ".."), "");
  const proxyTarget = env.VITE_PROXY_TARGET ?? "http://localhost:5021";
  const blockchainContractAddress = env.BLOCKCHAIN_CONTRACT_ADDRESS ?? env.VITE_BLOCKCHAIN_CONTRACT_ADDRESS ?? "";

  return {
    plugins: [react()],
    root: ".",
    envDir: "..",
    define: {
      "import.meta.env.VITE_BLOCKCHAIN_CONTRACT_ADDRESS": JSON.stringify(blockchainContractAddress),
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
    },
    server: {
      host: true,
      port: 3000,
      open: false,
      proxy: {
        "/api": proxyTarget,
      },
    },
  };
});
