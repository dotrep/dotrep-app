import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@metamask/sdk', '@wagmi/connectors'],
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: false,
    hmr: {
      protocol: "wss",
      clientPort: 443,
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
  },
});
