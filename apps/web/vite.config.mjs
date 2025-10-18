import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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
    strictPort: false,
    allowedHosts: ['.replit.dev', 'localhost'],
    hmr: {
      protocol: "wss",
      clientPort: 443,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: ['.replit.dev', 'localhost'],
  },
});
