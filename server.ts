import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Default to 3000 because AI Studio container Nginx listens on 8080 and reverse proxies to 3000
const PORT = parseInt(process.env.APP_PORT || (process.env.PORT && process.env.PORT !== '8080' ? process.env.PORT : '3000'), 10);
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Cloud Run
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static assets from Vite build directory
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // SPA Fallback: serve index.html for all non-file client routes
  app.get('*', (_req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('GymPro ERP Enterprise is running.');
    }
  });
} else {
  app.get('*', (_req, res) => {
    res.status(200).send('GymPro ERP Enterprise dist is preparing.');
  });
}

const server = app.listen(PORT, HOST, () => {
  console.log(`[GymPro Server] Server running on http://${HOST}:${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[GymPro Server] Port ${PORT} already in use, trying fallback port 3001`);
    app.listen(3001, HOST, () => {
      console.log(`[GymPro Server] Fallback server running on http://${HOST}:3001`);
    });
  } else {
    console.error('[GymPro Server] Server error:', err);
  }
});

