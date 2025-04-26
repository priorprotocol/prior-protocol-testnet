
#!/bin/bash
set -e

# Install dependencies
npm install

# Build the client
cd client
npm install
npm run build

# Ensure dist directory exists
mkdir -p dist

echo "Build complete! Files ready for Netlify deployment."
