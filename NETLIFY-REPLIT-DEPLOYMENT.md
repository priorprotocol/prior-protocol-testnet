# Prior Protocol Testnet: Netlify + Replit Deployment Guide

This document outlines how to deploy the Prior Protocol Testnet using Netlify for the frontend and Replit for the backend. This architecture provides a robust and scalable solution for your testnet application.

## Architecture Overview

- **Frontend (Netlify)**: React application with a static build
- **Backend (Replit)**: Express server with API endpoints
- **Database (Replit)**: PostgreSQL database accessed via Drizzle ORM

## Pre-deployment Setup

1. **Configure Environment Variables**:
   - Update `.env.production` in the client directory with your Replit URL

2. **Update CORS Configuration**:
   - The server is already configured to accept requests from your Netlify domain

## Deploying the Backend (Replit)

1. **Keep Your Current Replit Project**:
   - Your backend is already running in Replit
   - Make sure to enable the "Always On" feature in Replit to keep your backend running 24/7

2. **Verify Database Connection**:
   - Ensure your PostgreSQL database is properly configured
   - The database URL should be stored in the DATABASE_URL environment variable

3. **Configure Environment Variables on Replit**:
   - BASESCAN_API_KEY: Your Base Sepolia block explorer API key
   - ALLOWED_ORIGINS: Add your Netlify domain here (comma-separated if multiple)
   - DATABASE_URL: Your PostgreSQL connection string

4. **Verify API Endpoints**:
   - Test all API endpoints to ensure they're working properly
   - You can use a tool like Postman or simply curl to test them

## Deploying the Frontend (Netlify)

1. **Create a New GitHub Repository**:
   - Create a new repository for just the frontend code
   - Push your code to this repository

2. **Connect to Netlify**:
   - Sign up for a Netlify account if you don't have one
   - Click "New site from Git"
   - Select your GitHub repository

3. **Configure Build Settings**:
   - Build command: `bash netlify-build.sh`
   - Publish directory: `client/dist`
   - The netlify.toml file already contains these settings

4. **Set Environment Variables on Netlify**:
   - VITE_API_URL: https://prior-protocol-testnet-priorprotocol.replit.app
   - VITE_CHAIN_ID: 84532 (Base Sepolia Chain ID)
   - VITE_BLOCK_EXPLORER_URL: https://sepolia.basescan.org

5. **Deploy**:
   - Click "Deploy site"
   - Netlify will build and deploy your frontend

6. **Configure Custom Domain (Optional)**:
   - In the Netlify dashboard, go to "Domain settings"
   - Click "Add custom domain"
   - Follow the instructions to set up your domain

## Post-deployment Verification

1. **Test the Application**:
   - Verify that the frontend can communicate with the backend
   - Test all features: faucet, swap, quest, governance, dashboard
   - Make sure blockchain interactions work correctly

2. **Monitoring**:
   - Monitor your application's performance on both Netlify and Replit
   - Check for any errors in the logs

## Troubleshooting

### Frontend Issues

- **CORS Errors**: Make sure your Replit backend has the correct CORS configuration
- **API Connection Errors**: Verify the VITE_API_URL environment variable on Netlify
- **Build Failures**: Check the build logs on Netlify for specific errors

### Backend Issues

- **Database Connection**: Verify the DATABASE_URL environment variable on Replit
- **API Errors**: Check the server logs on Replit
- **Performance Issues**: Consider upgrading your Replit plan if you need more resources

## Maintaining Your Deployment

- **Code Updates**:
  - Push changes to your GitHub repository
  - Netlify will automatically rebuild and deploy the frontend
  - For backend changes, simply push to your Replit project

- **Database Migrations**:
  - Use the provided migration scripts to update your database schema
  - Test migrations on a development database before applying to production

## Security Considerations

- **API Keys**: Never store API keys in the frontend code
- **Environment Variables**: Use environment variables for sensitive information
- **CORS**: Only allow requests from trusted domains
- **Rate Limiting**: Consider implementing rate limiting on your API endpoints

---

By following this guide, you'll have a robust deployment of the Prior Protocol Testnet using Netlify for the frontend and Replit for the backend. This separation of concerns allows for easier maintenance and scaling of your application.