# Deploying Prior Protocol Testnet to Hostinger

This guide explains how to deploy your Prior Protocol testnet DApp to Hostinger.

## Prerequisites

1. A Hostinger hosting plan with Node.js support
2. Access to Hostinger control panel
3. Your project code in a Git repository

## Deployment Steps

### 1. Prepare Your Application

Your application is already configured with proper build and start scripts in `package.json`:

```json
"scripts": {
  "dev": "tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js"
}
```

### 2. Set Up Hostinger Node.js Hosting

1. Log in to your Hostinger control panel
2. Create a new website or select an existing one
3. Go to the "Website" section
4. Select "Node.js" as your hosting type
5. Configure Node.js version (select Node.js 20.x)

### 3. Database Setup

1. Go to "Databases" section in your Hostinger control panel
2. Create a new MySQL database
3. Note your database credentials (host, username, password, database name)
4. Update your application's environment variables with these credentials
   - Modify your `.env` file or set up environment variables in Hostinger's control panel

### 4. Upload Your Application

#### Option A: Upload via Hostinger's File Manager

1. Run `npm run build` on your local machine
2. Compress your project into a ZIP file
3. Upload and extract using Hostinger's File Manager

#### Option B: Deploy via Git (Recommended)

1. Set up Git deployment in Hostinger
2. Add your repository URL and credentials
3. Configure the branch to deploy (typically `main`)
4. Set up the build command: `npm install && npm run build`
5. Set the start command: `npm start`

### 5. Environment Variables

Create these environment variables in Hostinger's control panel:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://username:password@host/database
BASESCAN_API_KEY=your_api_key
```

### 6. Configure Domain and SSL

1. Point your domain to Hostinger (if not already done)
2. Enable SSL/HTTPS in the Hostinger control panel

### 7. Start the Application

1. In the Hostinger control panel, navigate to your Node.js app settings
2. Start your application using the configured start command (`npm start`)
3. Verify the application is running by checking the logs

## Troubleshooting

If you encounter any issues:

1. Check Hostinger's error logs
2. Verify that all environment variables are correctly set
3. Make sure the Node.js version is compatible (Node.js 20.x recommended)
4. Confirm database connection string is correct
5. Check that ports are correctly configured (Hostinger might use a proxy)

## Maintenance

To update your application:

1. Push changes to your Git repository
2. Trigger a new deployment from Hostinger's control panel
3. Check logs to ensure successful deployment