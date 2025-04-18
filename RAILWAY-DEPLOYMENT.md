# Deploying Prior Protocol Testnet to Railway

This guide will walk you through deploying your Prior Protocol testnet application to Railway, which offers an excellent platform for Node.js applications with PostgreSQL databases.

## Prerequisites

1. [GitHub](https://github.com) account with your project repository
2. [Railway](https://railway.app) account (you can sign up with your GitHub account)
3. Your Basescan API key

## Step 1: Set Up Railway Project

1. Log in to [Railway](https://railway.app) with your GitHub account
2. Click "New Project" from the dashboard
3. Select "Deploy from GitHub repo"
4. Choose your Prior Protocol testnet repository
5. Select the branch you want to deploy (usually `main`)

## Step 2: Configure the Database

1. Click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create and link a PostgreSQL database to your project
3. The connection string will be automatically added as an environment variable: `DATABASE_URL`

## Step 3: Configure Environment Variables

Go to your project settings and add the following environment variables:

```
NODE_ENV=production
PORT=3000
BASESCAN_API_KEY=your_basescan_api_key
```

## Step 4: Configure Build and Start Commands

1. Click on your deployment service
2. Go to the "Settings" tab
3. Under "Build Command", enter: `npm install && npm run build`
4. Under "Start Command", enter: `npm start`

## Step 5: Deploy Your Application

1. Railway will automatically deploy your application based on the selected GitHub repository
2. You can trigger manual deploys from the "Deployments" tab if needed
3. View logs and monitor your application from the "Deployments" section

## Step 6: Database Schema Setup

After your first deployment, you need to set up your database schema:

1. Go to the "CLI" section of Railway
2. Run the following command to push your Drizzle schema to the database:
   ```
   npm run db:push
   ```

## Step 7: Connect a Custom Domain (Optional)

1. Go to your service's settings
2. Select the "Domains" section
3. Click "Generate Domain" for a railway.app subdomain, or
4. Click "Custom Domain" to connect your own domain
5. Follow the DNS configuration instructions provided

## Step 8: Monitor Your Application

Railway provides several tools to monitor your application:

1. **Logs**: Real-time logs are available in the deployment details
2. **Metrics**: CPU, memory, and network usage statistics
3. **Database**: You can explore your database using the PostgreSQL plugin

## Troubleshooting Common Issues

### Application Not Starting

Check your application logs for any errors. Common issues include:

- Missing environment variables
- Database connection problems
- Build errors

### Database Migrations Failing

If your database schema changes are not applying:

1. Connect to your Railway CLI
2. Run `npm run db:push` manually to force a schema update

### Environment Variable Issues

If your app can't access environment variables:

1. Check that all required variables are set in Railway
2. Ensure your code correctly references these variables
3. Restart your deployment after changing environment variables

## Continuous Deployment

Railway automatically sets up continuous deployment from your GitHub repository:

1. Every push to your configured branch will trigger a new deployment
2. You can disable automatic deployments in the project settings
3. You can configure a specific path to watch for changes if needed

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Dashboard](https://railway.app/dashboard)
- [PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)