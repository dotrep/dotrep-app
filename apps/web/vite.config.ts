import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const REPLIT_PORT = Number(process.env.PORT) || 3000;

// If your API serves /rep/* directly (no /api prefix), proxy "/rep".
// If you mounted the API under /api, then change the key to "/api".
const proxyTarget = "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                 // listen on 0.0.0.0
    port: REPLIT_PORT,          // use Replit-assigned port
    strictPort: false,          // let Replit override if needed
    hmr: {
      protocol: "wss",
      clientPort: 443,          // critical for Replit preview
    },
    proxy: {
      "/rep": {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: REPLIT_PORT,
  },
});
