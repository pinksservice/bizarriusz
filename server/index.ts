import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "5000");
const isProd = process.env.NODE_ENV === "production";

app.use(express.json());

// API routes
registerRoutes(app);

if (isProd) {
  // Serve built frontend
  const distPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
} else {
  // In dev, Vite runs separately on port 5173 – just tell user
  app.get("/", (_req, res) => res.send("API running. Frontend: run `vite` separately."));
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Bizarriusz server running on port ${PORT} [${isProd ? "production" : "development"}]`);
  try {
    const { pool } = await import("./db.js");
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✓ Database connection OK");
  } catch (err: any) {
    console.error("✗ Database connection FAILED:", err.message);
  }
});
