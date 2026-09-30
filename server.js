// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = parseInt(process.env.PORT || process.env.APP_PORT || "8080", 10);
var HOST = "0.0.0.0";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get(["/health", "/healthz", "/_healthz", "/api/health"], (_req, res) => {
  res.status(200).json({ status: "ok", service: "GymPro ERP Enterprise", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
var distPath = path.resolve(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    }
  }));
  app.get("*", (_req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send("GymPro ERP Enterprise is running.");
    }
  });
} else {
  app.get("*", (_req, res) => {
    res.status(200).send("GymPro ERP Enterprise dist is preparing.");
  });
}
function startListening(port, attempt = 1) {
  const srv = app.listen(port, HOST, () => {
    console.log(`[GymPro Server] Server successfully running on http://${HOST}:${port}`);
  });
  srv.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[GymPro Server] Port ${port} is in use.`);
      if (attempt < 3) {
        const nextPort = port === 8080 ? 3e3 : port + 1;
        console.warn(`[GymPro Server] Attempting fallback to port ${nextPort}...`);
        startListening(nextPort, attempt + 1);
      } else {
        console.error(`[GymPro Server] Failed to bind port after ${attempt} attempts.`);
        process.exit(1);
      }
    } else {
      console.error("[GymPro Server] Fatal server error:", err);
      process.exit(1);
    }
  });
  return srv;
}
startListening(PORT);
