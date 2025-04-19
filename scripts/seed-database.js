// This script seeds the database with initial data for testing and demo purposes
// Run this with: node scripts/seed-database.js

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema.js';
import { users, tokens, quests, proposals } from '../shared/schema.js';

// Sample data for seeding
const sampleUsers = [
  {
    address: '0x57c4e8d937f2f63b1561ce73ab94eac8dcb6cdd3',
    username: 'PriorPioneer',
    points: 25.5,
    rank: 1,
    lastClaimTime: new Date(Date.now() - 86400000), // 1 day ago
    badges: ['early_adopter', 'faucet_user', 'swap_expert'],
    totalSwaps: 51,
    totalClaims: 10,
    createdAt: new Date()
  },
  {
    address: '0x8f6ff5b432c594f758b9c6cb1bc937c936693184',
    username: 'CryptoExplorer',
    points: 22.0,
    rank: 2,
    lastClaimTime: new Date(Date.now() - 36000000), // 10 hours ago
    badges: ['governance_voter', 'swap_expert'],
    totalSwaps: 44,
    totalClaims: 8,
    createdAt: new Date()
  },
  {
    address: '0x3e21f0ca4ac4e7f36ef116ace97c1ca03df6d138',
    username: 'BaseBuilder',
    points: 18.5,
    rank: 3,
    lastClaimTime: new Date(Date.now() - 172800000), // 2 days ago
    badges: ['early_adopter', 'quiz_master'],
    totalSwaps: 37,
    totalClaims: 6,
    createdAt: new Date()
  },
  {
    address: '0xc1f72d2436f6f29b0a7849c6f0e6a47c7d6cf314',
    username: 'TokenTrader',
    points: 15.0,
    rank: 4,
    lastClaimTime: new Date(Date.now() - 48000000), // ~13 hours ago
    badges: ['swap_expert'],
    totalSwaps: 30,
    totalClaims: 5,
    createdAt: new Date()
  },
  {
    address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
    username: 'EthereumAdvocate',
    points: 12.5,
    rank: 5,
    lastClaimTime: new Date(Date.now() - 108000000), // ~30 hours ago
    badges: ['governance_voter', 'early_adopter'],
    totalSwaps: 25,
    totalClaims: 4,
    createdAt: new Date()
  }
];

const sampleTokens = [
  {
    symbol: 'PRIOR',
    name: 'Prior Protocol Token',
    address: '0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb',
    decimals: 18,
    imageUrl: '/tokens/prior.svg',
    description: 'The native token of the Prior Protocol ecosystem',
    createdAt: new Date()
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2',
    decimals: 6,
    imageUrl: '/tokens/usdc.svg',
    description: 'A stablecoin pegged to the US dollar',
    createdAt: new Date()
  }
];

const sampleQuests = [
  {
    title: 'Welcome to Prior Protocol',
    description: 'Complete your first faucet claim to earn 1 PRIOR token',
    type: 'faucet',
    reward: 0,
    requirements: JSON.stringify({ claims: 1 }),
    createdAt: new Date()
  },
  {
    title: 'Swap Expert',
    description: 'Complete 5 token swaps on the platform',
    type: 'swap',
    reward: 0,
    requirements: JSON.stringify({ swaps: 5 }),
    createdAt: new Date()
  },
  {
    title: 'Governance Participant',
    description: 'Vote on your first governance proposal',
    type: 'governance',
    reward: 0,
    requirements: JSON.stringify({ votes: 1 }),
    createdAt: new Date()
  }
];

const sampleProposals = [
  {
    title: 'Increase Daily Swap Points',
    description: 'Proposal to increase the daily swap points from 0.5 to 1.0 per swap',
    creator: '0x57c4e8d937f2f63b1561ce73ab94eac8dcb6cdd3',
    status: 'active',
    votesFor: 12,
    votesAgainst: 5,
    startDate: new Date(),
    endDate: new Date(Date.now() + 604800000), // 1 week from now
    createdAt: new Date()
  },
  {
    title: 'Add ETH/PRIOR Swap Pair',
    description: 'Proposal to add a new ETH/PRIOR swap pair to the platform',
    creator: '0x8f6ff5b432c594f758b9c6cb1bc937c936693184',
    status: 'active',
    votesFor: 8,
    votesAgainst: 3,
    startDate: new Date(),
    endDate: new Date(Date.now() + 604800000), // 1 week from now
    createdAt: new Date()
  }
];

async function seedDatabase() {
  console.log('Starting database seeding process...');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL in your environment variables');
    process.exit(1);
  }
  
  try {
    console.log('Connecting to database...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    // Check if database is already seeded by checking for users
    const existingUsers = await db.query.users.findMany({ limit: 1 });
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Database already has users, skipping seeding...');
      return;
    }
    
    console.log('Seeding tokens...');
    await db.insert(tokens).values(sampleTokens);
    
    console.log('Seeding users...');
    await db.insert(users).values(sampleUsers);
    
    console.log('Seeding quests...');
    await db.insert(quests).values(sampleQuests);
    
    console.log('Seeding proposals...');
    await db.insert(proposals).values(sampleProposals);
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase().then(() => {
  console.log('Database initialization complete');
  process.exit(0);
}).catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});