# Vercel Deployment Guide for Prior Protocol Testnet

This guide will help you deploy your Prior Protocol Testnet DApp on Vercel.

## Prerequisites

1. A [GitHub](https://github.com/) account
2. A [Vercel](https://vercel.com/) account (can sign up with your GitHub account)
3. A PostgreSQL database (you can use [Neon](https://neon.tech/) or [Supabase](https://supabase.com/))
4. A [BaseScan API key](https://basescan.org/apis) for blockchain transaction indexing

## Step 1: Push Your Code to GitHub

1. Create a new GitHub repository
2. Initialize Git in your project directory (if not already done):
   ```bash
   git init
   ```
3. Add your files:
   ```bash
   git add .
   ```
4. Commit your changes:
   ```bash
   git commit -m "Initial commit for Vercel deployment"
   ```
5. Add your remote GitHub repository:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   ```
6. Push your code:
   ```bash
   git push -u origin main
   ```

## Step 2: Set Up Your Database

1. Set up a PostgreSQL database with a service like Neon or Supabase
2. Get your database connection string, which should look like:
   ```
   postgresql://username:password@hostname:port/database
   ```
3. Keep this URL handy for the next step

## Step 3: Deploy on Vercel

1. Log in to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Vercel should automatically detect the project as a Node.js application
5. In the "Environment Variables" section, add the following:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `BASESCAN_API_KEY`: Your BaseScan API key
   - Any other environment variables from your `.env` file that are needed
6. Click "Deploy"

## Step 4: Monitor Your Deployment

1. Vercel will build and deploy your application
2. Once deployment is complete, Vercel will provide you with a URL for your live application
3. Check the logs if there are any issues during deployment

## Step 5: Connect Your Custom Domain (Optional)

1. If you have a custom domain, go to your project in the Vercel dashboard
2. Click on "Domains"
3. Add your domain and follow the instructions to set up DNS records

## Troubleshooting

### Database Connection Issues

If your application is unable to connect to the database:
- Check that your `DATABASE_URL` is correct
- Ensure your database allows connections from Vercel's IP addresses
- For Neon: Make sure to enable the "Pooled connection" option

### API Key Issues

If BaseScan API calls are failing:
- Verify your API key is correct
- Check if you've hit your API rate limits
- Ensure the API key has the correct permissions

### Build Failures

If your build fails:
- Check the Vercel build logs for specific errors
- Ensure all dependencies are correctly specified in `package.json`
- Make sure the build command in `package.json` is working correctly

## Updating Your Deployment

Any new commits pushed to your GitHub repository's main branch will automatically trigger a new deployment in Vercel.

For more information, visit [Vercel's documentation](https://vercel.com/docs).