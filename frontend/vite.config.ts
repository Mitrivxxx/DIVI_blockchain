import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(() => {
  const proxyTarget = process.env.VITE_PROXY_TARGET ?? "http://localhost:5021";

  return {
    plugins: [react()],
    root: ".",
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
