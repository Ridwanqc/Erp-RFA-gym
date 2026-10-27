import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundledServerPath = path.join(__dirname, 'server.js');

if (fs.existsSync(bundledServerPath)) {
  await import('./server.js');
} else {
  await import('./server/app.ts');
}
