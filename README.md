# Prior Protocol Testnet DApp

A cutting-edge testnet DApp for Prior Protocol on Base Sepolia chain, designed to make blockchain interactions intuitive and engaging through gamified user experiences and educational features.

## Features

- **Faucet**: Claim 1 PRIOR token every 24 hours
- **Swap**: Exchange tokens on Sepolia testnet with real blockchain transactions
- **Dashboard**: Track your activities, points history, and progress with interactive charts
- **Historical Points**: View your points accumulation over time (daily, weekly, monthly)
- **Transaction History**: Track all your blockchain transactions in one place
- **Leaderboard**: Compete with other users to earn the most points
- **Points Analytics**: Detailed breakdown of points earned from various activities

## Points System

- 0.5 points per swap, maximum 5 swaps per day (2.5 points daily cap)
- No points for faucet claims or other activities
- Historical points tracking with daily, weekly, and monthly views
- Real-time leaderboard to track your position

All points will be converted to PRIOR tokens at TGE (Token Generation Event).

## Tech Stack

- React.js frontend with TypeScript
- Base Sepolia blockchain integration
- Tailwind CSS with Shadcn/UI components for responsive design
- Ethers.js for blockchain interactions
- Express.js backend with API endpoints
- Recharts for data visualization
- React Query for efficient data fetching
- PostgreSQL/SQLite database integration (optional)
- Real-time transaction synchronization

## Smart Contracts (Base Sepolia)

- PRIOR Token: `0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb`
- USDC (Mock): `0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2`
- Prior Faucet: `0xa206dC56F1A56a03aEa0fCBB7c7A62b5bE1Fe419`
- PriorUsdcSwap: `0x8957e1988905311EE249e679a29fc9deCEd4D910`
- Prior Pioneer NFT: `0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59`

Block Explorer: [Base Sepolia](https://sepolia.basescan.org)

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Deployment

This project can be deployed to various platforms:

- **Vercel (Recommended)** - Follow the detailed instructions in [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md)
  - Supports serverless functions with database integration
  - Automatic GitHub integration and continuous deployment
  - Custom domains with free SSL certificates

- **Railway** - Follow the instructions in [RAILWAY-DEPLOYMENT.md](./RAILWAY-DEPLOYMENT.md)
- **Replit** - Click the "Deploy" button in the Replit interface
- **Hostinger** - Follow the instructions in [HOSTINGER-DEPLOYMENT.md](./HOSTINGER-DEPLOYMENT.md)

## GitHub and Database Setup

To prepare your project for GitHub and deploy with database support:

1. Create a repository on GitHub
2. Run the setup script to initialize Git and push to GitHub:
   ```bash
   chmod +x scripts/setup-github.sh
   ./scripts/setup-github.sh
   ```

3. Set up your PostgreSQL database:
   - For Vercel: Use [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres)
   - For other platforms: Any PostgreSQL provider (Railway, Supabase, etc.)

4. The deployment will automatically:
   - Set up database tables using the schema in `shared/schema.ts`
   - Run migrations if needed via the deployment scripts
   - Seed essential data for the application to function

For more details, see the platform-specific deployment guides linked above.

## License

MIT License

## Recent Updates

### Points System Enhancements (April 2025)
- Implemented historical points tracking functionality
- Added intuitive data visualization with interactive charts
- Created new dashboard with points analytics and metrics
- Simplified points system (0.5 points per swap, max 5 swaps daily)
- Improved transaction synchronization with blockchain