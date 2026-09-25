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
var PORT = parseInt(process.env.APP_PORT || (process.env.PORT && process.env.PORT !== "8080" ? process.env.PORT : "3000"), 10);
var HOST = "0.0.0.0";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
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
var server = app.listen(PORT, HOST, () => {
  console.log(`[GymPro Server] Server running on http://${HOST}:${PORT}`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`[GymPro Server] Port ${PORT} already in use, trying fallback port 3001`);
    app.listen(3001, HOST, () => {
      console.log(`[GymPro Server] Fallback server running on http://${HOST}:3001`);
    });
  } else {
    console.error("[GymPro Server] Server error:", err);
  }
});
