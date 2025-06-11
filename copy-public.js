import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Copy qr-upload.html to public directory
const qrUploadSource = path.join(__dirname, 'public', 'qr-upload.html');
const qrUploadDest = path.join(publicDir, 'qr-upload.html');

if (fs.existsSync(qrUploadSource)) {
    fs.copyFileSync(qrUploadSource, qrUploadDest);
    console.log('Copied qr-upload.html to public directory');
} else {
    console.log('qr-upload.html not found in source directory');
}

console.log('Public directory setup complete'); 