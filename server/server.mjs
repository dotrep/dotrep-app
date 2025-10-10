import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { addHealth } from "./health.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "..", "apps", "web", "dist");
const indexFile = path.join(distDir, "index.html");

// hard stop if build missing (prevents “black screen” mysteries)
if (!fs.existsSync(indexFile)) {
  console.error("❌ Missing dist/index.html. Run: pnpm --dir apps/web build");
  process.exit(1);
}

const app = express();
addHealth(app);
app.use(express.json());

// API (yours)
app.get("/rep/check", (req, res) => {
  const name = String(req.query.name || "demo").toLowerCase();
  const available = name !== "taken";
  res.json({ ok: true, name, available });
});

// static SPA
app.use(express.static(distDir));
app.use((_, res) => res.sendFile(indexFile));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`✅ Serving dist on :${PORT}`));
