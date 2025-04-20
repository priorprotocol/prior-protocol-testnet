/**
 * Script to prepare files for Netlify deployment
 * This creates a separate directory with only the files needed for Netlify deployment
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const outputDir = path.resolve(__dirname, '../netlify-deploy');
const requiredFiles = [
  'client',
  'netlify.toml',
  'package.json',
  'package-lock.json',
  'README.md',
  'scripts/build-frontend.js',
  'scripts/netlify-build.js',
  '.gitignore'
];

console.log('Preparing files for Netlify deployment...');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
} else {
  // Clear the output directory
  console.log('Clearing output directory...');
  execSync(`rm -rf ${outputDir}/*`);
}

// Copy required files
console.log('Copying files...');
requiredFiles.forEach(file => {
  const sourcePath = path.resolve(__dirname, '..', file);
  const destPath = path.resolve(outputDir, file);
  
  if (fs.existsSync(sourcePath)) {
    // Create directory if it doesn't exist
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // Copy directory recursively, excluding node_modules and dist
      execSync(`cp -r ${sourcePath}/* ${destPath}`, { 
        shell: true,
        stdio: 'inherit'
      });
      console.log(`Copied directory: ${file}`);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied file: ${file}`);
    }
  } else {
    console.warn(`Warning: File or directory not found: ${file}`);
  }
});

// Create a .env.local file for development
fs.writeFileSync(
  path.resolve(outputDir, 'client/.env.local'),
  'VITE_API_URL=https://prior-protocol-testnet-priorprotocol.replit.app\n' +
  'VITE_CHAIN_ID=84532\n' +
  'VITE_BLOCK_EXPLORER_URL=https://sepolia.basescan.org\n'
);

console.log('Deployment preparation complete!');
console.log(`Files prepared in: ${outputDir}`);
console.log('');
console.log('Next steps:');
console.log('1. Navigate to the netlify-deploy directory');
console.log('2. Initialize a new Git repository');
console.log('3. Push to GitHub');
console.log('4. Connect to Netlify for deployment');