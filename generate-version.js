import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionPath = path.join(__dirname, 'dist', 'version.json');
const data = {
  version: "0.0.0",
  timestamp: Date.now()
};

if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
}

fs.writeFileSync(versionPath, JSON.stringify(data, null, 2));
console.log('✓ version.json generated successfully');
