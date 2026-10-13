import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const buildDir = path.join(rootDir, 'build');
const serverJs = path.join(rootDir, 'server.js');

if (!fs.existsSync(distDir)) {
  console.error('[Build Sync] Error: dist directory was not created by vite build!');
  process.exit(1);
}

// Copy dist to build to support platforms expecting either dist or build
fs.cpSync(distDir, buildDir, { recursive: true });

// If bundled server.js exists, place a copy in both dist and build directories
if (fs.existsSync(serverJs)) {
  fs.copyFileSync(serverJs, path.join(distDir, 'server.js'));
  fs.copyFileSync(serverJs, path.join(buildDir, 'server.js'));
}

const distFiles = fs.readdirSync(distDir);
const buildFiles = fs.readdirSync(buildDir);

console.log(`[Build Sync] Artifacts synchronized successfully:`);
console.log(` - dist/ (${distFiles.length} items): ${distFiles.slice(0, 5).join(', ')}...`);
console.log(` - build/ (${buildFiles.length} items): ${buildFiles.slice(0, 5).join(', ')}...`);
