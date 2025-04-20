/**
 * Build script for the frontend only (used by Netlify)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building frontend for Netlify deployment...');

// Ensure we're in the project root
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// Build the frontend
try {
  console.log('Installing frontend dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('Building frontend...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  
  console.log('Frontend build complete!');
} catch (error) {
  console.error('Error building frontend:', error);
  process.exit(1);
}