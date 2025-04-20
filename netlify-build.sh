#!/bin/bash

# This is a simple bash script for Netlify to build the frontend

# Print commands for debugging
set -ex

# Install dependencies
npm install

# Build the frontend only using Vite
npm run build 

# Make sure client/dist exists
mkdir -p client/dist

# Copy the built files to client/dist (where Netlify expects them)
cp -r dist/public/* client/dist/

echo "Build complete! Files copied to client/dist for Netlify deployment."