import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
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
    port: 3000,
    open: false,
    proxy: {
      "/api": "http://localhost:5021",
    },
  },
});
