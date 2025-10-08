import express from "express";

const app = express();

app.get("/health", (_req, res) => res.send("ok"));
app.get("/api/hello", (_req, res) => res.json({ message: "hello from API" }));

const port = Number(process.env.PORT) || 5000;
const host = "0.0.0.0";

app.listen(port, host, () => {
  console.log(`[api] listening on http://${host}:${port}`);
});
