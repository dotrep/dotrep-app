import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const allowedHosts = [
  ".replit.dev",
  process.env.REPLIT_DEV_DOMAIN,
  ...(process.env.REPLIT_DOMAINS
    ? process.env.REPLIT_DOMAINS.split(/[;,]/).map(s => s.trim()).filter(Boolean)
    : []),
  "localhost",
].filter(Boolean);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts,

    hmr: {
      protocol: "wss",
      host: process.env.REPLIT_DEV_DOMAIN || "localhost",
      clientPort: 443,
    },

    proxy: {
      "/api": {
        target: "http://127.0.0.1:9000",
        changeOrigin: true,
        ws: true,
      },
      "/whitepaper": {
        target: "http://127.0.0.1:9000",
        changeOrigin: true,
      },

      // ✅ THIS IS THE MISSING PIECE
      "/manifold-proxy": {
        target: "http://127.0.0.1:9000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts,
  },
});
