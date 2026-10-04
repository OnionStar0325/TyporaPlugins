import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Packing Typora Community Plugin into plugin.zip...');

const zip = new AdmZip();

const filesToPack = [
  'manifest.json',
  'main.js',
  'styles.css',
  'README.md',
  'LICENSE'
];

for (const file of filesToPack) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    zip.addLocalFile(filePath);
    console.log(`  ➕ Added: ${file}`);
  } else {
    console.warn(`  ⚠️ Warning: File not found: ${file}`);
  }
}

const docAssetsDir = path.join(__dirname, 'doc_assets');
if (fs.existsSync(docAssetsDir)) {
  zip.addLocalFolder(docAssetsDir, 'doc_assets');
  console.log('  ➕ Added folder: doc_assets');
}

const outputPath = path.join(__dirname, 'plugin.zip');
zip.writeZip(outputPath);

console.log(`🎉 Successfully generated: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
