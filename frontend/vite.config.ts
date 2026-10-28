import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, ".."), "");
  const proxyTarget =
    process.env.VITE_PROXY_TARGET ??
    env.VITE_PROXY_TARGET ??
    "http://localhost:5021";
  const blockchainContractAddress =
    process.env.BLOCKCHAIN_CONTRACT_ADDRESS ??
    process.env.VITE_BLOCKCHAIN_CONTRACT_ADDRESS ??
    env.BLOCKCHAIN_CONTRACT_ADDRESS ??
    env.VITE_BLOCKCHAIN_CONTRACT_ADDRESS ??
    "";
  const port = Number(process.env.PORT ?? env.PORT ?? 3000);

  return {
    plugins: [react(), tailwindcss()],
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
      port,
      strictPort: true,
      open: false,
      proxy: {
        "/api": proxyTarget,
        "/Auth": proxyTarget,
      },
    },
  };
});
