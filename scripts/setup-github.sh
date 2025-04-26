#!/bin/bash

# This script helps set up a GitHub repository for the Prior Protocol Testnet DApp
# It initializes a git repository, adds all files, creates an initial commit,
# and pushes to a remote repository if provided.

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}     Prior Protocol Testnet GitHub Setup Script     ${NC}"
echo -e "${GREEN}====================================================${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install git first.${NC}"
    exit 1
fi

# Initialize repository if .git doesn't exist
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}Git repository initialized successfully.${NC}"
else
    echo -e "${YELLOW}Git repository already initialized.${NC}"
fi

# Ask for GitHub repository URL
echo -e "${YELLOW}Enter your GitHub repository URL (press Enter to skip):${NC}"
read github_url

# Add all files to git
echo -e "${YELLOW}Adding files to git...${NC}"
git add .
echo -e "${GREEN}Files added successfully.${NC}"

# Commit changes
echo -e "${YELLOW}Creating initial commit...${NC}"
git commit -m "Initial commit of Prior Protocol Testnet DApp"
echo -e "${GREEN}Commit created successfully.${NC}"

# Add remote and push if URL was provided
if [ -n "$github_url" ]; then
    echo -e "${YELLOW}Adding remote repository...${NC}"
    git remote add origin $github_url
    
    echo -e "${YELLOW}Would you like to push to GitHub now? (y/n)${NC}"
    read push_now
    
    if [ "$push_now" = "y" ] || [ "$push_now" = "Y" ]; then
        echo -e "${YELLOW}Pushing to GitHub...${NC}"
        git push -u origin main || git push -u origin master
        echo -e "${GREEN}Push completed successfully.${NC}"
    else
        echo -e "${YELLOW}Skipping push. To push later, run:${NC}"
        echo -e "  git push -u origin main"
    fi
else
    echo -e "${YELLOW}No GitHub URL provided. To add a remote later:${NC}"
    echo -e "  git remote add origin <your-github-url>"
    echo -e "  git push -u origin main"
fi

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}     Setup completed successfully!                  ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Deploy to Vercel by following instructions in VERCEL-DEPLOYMENT.md"
echo -e "2. Set up your PostgreSQL database on Neon or Vercel"
echo -e "3. Add environment variables to your Vercel project"

exit 0