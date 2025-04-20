/**
 * Simplified build script for Netlify deployment
 * This script only builds the frontend part of the application
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building frontend for Netlify deployment...');

// Ensure we're in the project root
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// Build the frontend only
try {
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Building frontend...');
  // Change to client directory and run build there
  execSync('cd client && mkdir -p dist && npx vite build', { stdio: 'inherit' });
  
  console.log('Frontend build complete!');
} catch (error) {
  console.error('Error building frontend:', error);
  process.exit(1);
}